import express from 'express';
import { initiateSTKPush } from './mpesa.js';
import { authenticateUser } from './middleware/auth.js';
import { getPackageById } from './server/packageCatalog.js';
import { createPendingPayment, getPendingPaymentStatus, getPendingPayment, fulfillPendingPayment } from './server/services/paymentsService.js';

const router = express.Router();

// Endpoint called by the frontend to trigger the M-Pesa STK push prompt.
// Requires a verified Firebase user - credits are tied to the caller's
// own uid, never a client-supplied userId. Also previously accepted
// amountKES and creditHours directly from the client with no relation
// checked between them - now only packageId is accepted, and both values
// are looked up server-side from the canonical catalog.
router.post('/api/v1/mpesa/pay', authenticateUser, async (req, res) => {
    try {
        const { phone, packageId, accountReference, description } = req.body;

        if (!phone || !packageId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phone and packageId are required.'
            });
        }

        const pkg = getPackageById(packageId);
        if (!pkg) {
            return res.status(400).json({ success: false, error: 'Unknown packageId' });
        }

        const result = await initiateSTKPush(
            phone,
            pkg.priceKES,
            accountReference || 'SkillSwap5',
            description || 'SkillSwap P2P Service Exchange'
        );

        if (result.success) {
            // Record what this checkout request should credit BEFORE the
            // user's phone even shows the prompt. The callback (which we
            // don't control the timing of, and can't be spoofed by the
            // client) is the only thing that can mark this fulfilled.
            const checkoutRequestId = result.data?.CheckoutRequestID;
            if (checkoutRequestId) {
                await createPendingPayment({
                    gateway: 'mpesa',
                    gatewayRef: checkoutRequestId,
                    userId: req.user.uid,
                    creditHours: pkg.hours,
                    amount: pkg.priceKES,
                    currency: 'KES',
                });

                // In sandbox / simulated mode, auto-fulfill after a brief pause
                // so the user experiences the full phone approval lifecycle.
                if (result.sandbox || checkoutRequestId.startsWith('ws_CO_SIM_')) {
                    setTimeout(async () => {
                        try {
                            await fulfillPendingPayment('mpesa', checkoutRequestId, `MPESA_SIM_${Date.now()}`);
                            console.log(`[mpesa] Auto-fulfilled sandbox payment ${checkoutRequestId}`);
                        } catch (e) {
                            console.error('[mpesa] Sandbox auto-fulfillment error:', e.message);
                        }
                    }, 3500);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'STK push sent successfully. Check your phone.',
                checkoutRequestId,
                isSandbox: Boolean(result.sandbox),
            });
        } else {
            return res.status(400).json({
                success: false,
                error: result.error || 'Failed to initiate STK push.'
            });
        }

    } catch (error) {
        console.error('Payment Endpoint Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during payment request.'
        });
    }
});

// Read-only status check for the frontend to poll while waiting for the
// callback. Validates that the payment belongs to the authenticated caller (prevents BOLA/IDOR).
router.get('/api/v1/mpesa/status/:checkoutRequestId', authenticateUser, async (req, res) => {
    try {
        const pending = await getPendingPayment('mpesa', req.params.checkoutRequestId);
        if (!pending) return res.status(404).json({ error: 'Payment not found' });
        if (pending.userId !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied: Payment does not belong to caller' });
        }
        return res.json({ status: pending.status });
    } catch (error) {
        return res.status(500).json({ error: 'Status check failed' });
    }
});

// Instant confirm for sandbox/test mode (STRICTLY gated: disabled in production, requires explicit flag and ownership check)
router.post('/api/v1/mpesa/simulate-confirm', authenticateUser, express.json(), async (req, res) => {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_PAYMENT_SIMULATORS !== 'true') {
        return res.status(403).json({ error: 'Payment simulator strictly disabled' });
    }

    try {
        const { checkoutRequestId } = req.body;
        if (!checkoutRequestId) {
            return res.status(400).json({ error: 'checkoutRequestId is required' });
        }

        const pending = await getPendingPayment('mpesa', checkoutRequestId);
        if (!pending) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (pending.userId !== req.user.uid) {
            return res.status(403).json({ error: 'Payment does not belong to caller' });
        }

        await fulfillPendingPayment('mpesa', checkoutRequestId, `MPESA_SIM_${Date.now()}`);
        return res.json({ success: true, message: 'Simulated M-Pesa payment confirmed.' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
