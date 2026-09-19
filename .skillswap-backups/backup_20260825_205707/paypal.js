import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';

// Helper to get PayPal OAuth Token
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// 1. Create Order Endpoint
router.post('/api/v1/paypal/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // amount in USD usually for PayPal
        const accessToken = await getPayPalAccessToken();

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
                        value: amount.toString()
                    }
                }]
            })
        });

        const order = await response.json();
        res.json({ success: true, orderId: order.id });
    } catch (err) {
        console.error('PayPal Create Order Error:', err);
        res.status(500).json({ success: false, error: 'Could not create PayPal order' });
    }
});

// 2. Capture Order Endpoint
router.post('/api/v1/paypal/capture-order', async (req, res) => {
    try {
        const { orderID } = req.body;
        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await response.json();
        res.json({ success: true, captureData });
    } catch (err) {
        console.error('PayPal Capture Error:', err);
        res.status(500).json({ success: false, error: 'Could not capture PayPal order' });
    }
});

export default router;
