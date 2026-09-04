import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { authenticateUser } from './middleware/auth.js';
import { getPackageById } from './server/packageCatalog.js';
import { createPendingPayment, fulfillPendingPayment, getPendingPayment } from './server/services/paymentsService.js';

dotenv.config();
const router = express.Router();

const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// 1. Create Order Endpoint. Requires a verified user; the order is created
// with a return_url that sends the buyer to PayPal's own approval page.
// Previously this had no user-approval step at all - capture-order was
// called immediately after create-order with no redirect in between,
// which isn't how a real PayPal payment ever gets authorized.
router.post('/api/v1/paypal/create-order', authenticateUser, express.json(), async (req, res) => {
    try {
        const { packageId } = req.body;
        const pkg = getPackageById(packageId);
        if (!pkg) {
            return res.status(400).json({ success: false, error: 'Unknown packageId' });
        }

        const accessToken = await getPayPalAccessToken();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: pkg.priceUSD.toString()
                    }
                }],
                application_context: {
                    return_url: `${frontendUrl}/dashboard?paypal_return=true`,
                    cancel_url: `${frontendUrl}/dashboard?paypal_cancel=true`,
                    user_action: 'PAY_NOW',
                },
            })
        });

        const order = await response.json();
        if (!order.id) {
            return res.status(502).json({ success: false, error: 'PayPal did not return an order id' });
        }

        // Record what this order should credit BEFORE the buyer ever
        // reaches PayPal's approval page. Capture below only trusts this
        // record, never a client-supplied credit amount.
        await createPendingPayment({
            gateway: 'paypal',
            gatewayRef: order.id,
            userId: req.user.uid,
            creditHours: pkg.hours,
            amount: pkg.priceUSD,
            currency: 'USD',
        });

        const approveLink = (order.links || []).find(l => l.rel === 'approve')?.href;
        res.json({ success: true, orderId: order.id, approveUrl: approveLink });
    } catch (err) {
        console.error('PayPal Create Order Error:', err);
        res.status(500).json({ success: false, error: 'Could not create PayPal order' });
    }
});

// 2. Capture Order Endpoint. Only ever credits based on the pendingPayments
// record created above - never from anything the client sends here - and
// only after PayPal itself confirms the capture actually completed.
// 2. Capture Order Endpoint. Previously this captured with PayPal first,
// then credited from whatever the pending record said - with NO check
// that the pending record actually belonged to the caller, and no check
// that what PayPal actually captured matched what was promised. An
// authenticated user who obtained (or guessed) another user's orderID
// could have triggered a capture against someone else's pending payment.
router.post('/api/v1/paypal/capture-order', authenticateUser, express.json(), async (req, res) => {
    try {
        const { orderID } = req.body;
        if (!orderID) return res.status(400).json({ success: false, error: 'orderID is required' });

        const pending = await getPendingPayment('paypal', orderID);
        if (!pending) {
            return res.status(404).json({ success: false, error: 'No pending payment found for this order' });
        }
        if (pending.userId !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'This order does not belong to you' });
        }
        if (pending.status !== 'pending') {
            return res.status(409).json({ success: false, error: `Order already ${pending.status}` });
        }

        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await response.json();
        const capture = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
        const captureStatus = capture?.status || captureData?.status;

        if (captureStatus !== 'COMPLETED') {
            return res.status(402).json({ success: false, error: 'Payment was not completed', captureData });
        }

        // Verify PayPal actually captured the amount/currency we expected
        // for this package - never issue credits based on the pending
        // record alone without confirming the real payment matches it.
        const capturedAmount = parseFloat(capture?.amount?.value);
        const capturedCurrency = capture?.amount?.currency_code;
        if (
            capturedCurrency !== pending.currency ||
            Math.abs(capturedAmount - pending.amount) > 0.01
        ) {
            console.error(
                `[paypal] Amount/currency mismatch for order ${orderID}: ` +
                `expected ${pending.amount} ${pending.currency}, captured ${capturedAmount} ${capturedCurrency}`
            );
            return res.status(409).json({ success: false, error: 'Captured amount does not match expected package price' });
        }

        const credited = await fulfillPendingPayment('paypal', orderID, capture?.id);
        res.json({ success: true, captureId: capture?.id, credited });
    } catch (err) {
        console.error('PayPal Capture Error:', err);
        res.status(500).json({ success: false, error: 'Could not capture PayPal order' });
    }
});

export default router;
