// M-Pesa Daraja STK Push callback (webhook) handler.
import express from 'express';
import { fulfillPendingPayment, markPendingPaymentFailed } from './server/services/paymentsService.js';
import { querySTKPushStatus } from './mpesa.js';

const router = express.Router();

router.post('/api/v1/mpesa/callback', async (req, res) => {
    const callbackData = req.body.Body?.stkCallback;

    if (!callbackData) {
        return res.status(400).json({ error: 'Invalid callback payload' });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;

    try {
        if (ResultCode === 0) {
            // Previously this trusted ResultCode === 0 from the callback
            // body alone. This endpoint is public (Safaricom needs to be
            // able to reach it with no auth) and CheckoutRequestID isn't
            // secret - it's returned directly to whoever initiated the
            // push. That meant anyone could POST a forged "success"
            // callback with a real CheckoutRequestID they'd obtained and
            // get credited with no actual payment. Now the callback is
            // only a trigger to go ASK Safaricom directly whether that
            // specific transaction actually succeeded - only their answer
            // is trusted.
            const verification = await querySTKPushStatus(CheckoutRequestID);
            const confirmedSuccess = verification.success && String(verification.resultCode) === '0';

            if (!confirmedSuccess) {
                console.warn(
                    `[mpesa] Callback claimed success for ${CheckoutRequestID} but independent ` +
                    `Safaricom query did not confirm it (${verification.resultDesc || verification.error}). ` +
                    `Not crediting.`
                );
                await markPendingPaymentFailed('mpesa', CheckoutRequestID, 'Independent verification failed');
                return res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' });
            }

            const items = CallbackMetadata?.Item || [];
            const mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

            const credited = await fulfillPendingPayment('mpesa', CheckoutRequestID, mpesaReceiptNumber);
            console.log(
                credited
                    ? `[mpesa] Fulfilled ${CheckoutRequestID} (independently verified), receipt ${mpesaReceiptNumber}`
                    : `[mpesa] ${CheckoutRequestID} already fulfilled or no matching pending payment`
            );
        } else {
            console.log(`[mpesa] Payment failed/cancelled: ${ResultDesc} (Code: ${ResultCode})`);
            await markPendingPaymentFailed('mpesa', CheckoutRequestID, ResultDesc);
        }
    } catch (err) {
        console.error('[mpesa] Callback fulfillment error:', err);
        // Still respond 200 below - Safaricom will retry on non-200, and
        // a transient Firestore error shouldn't cause unbounded retries
        // of a webhook we can't easily deduplicate beyond our own guard.
    }

    // Always respond with 200 OK so Safaricom stops retrying.
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});

export default router;
