// Example Express.js route to handle M-Pesa webhooks
import express from 'express';
const router = express.Router();

router.post('/api/v1/mpesa/callback', (req, res) => {
    const callbackData = req.body.Body?.stkCallback;

    if (!callbackData) {
        return res.status(400).json({ error: 'Invalid callback payload' });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;

    if (ResultCode === 0) {
        // Payment Successful!
        const items = CallbackMetadata.Item;
        const amountPaid = items.find(i => i.Name === 'Amount').Value;
        const mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber').Value;
        const phoneNumber = items.find(i => i.Name === 'PhoneNumber').Value;

        console.log(`Payment received! Receipt: ${mpesaReceiptNumber}, Amount: ${amountPaid}, Phone: ${phoneNumber}`);
        
        // TODO: Update your database transaction state to 'COMPLETED'
    } else {
        // Payment Failed or Cancelled by User (e.g., ResultCode 1032)
        console.log(`Payment failed/cancelled: ${ResultDesc} (Code: ${ResultCode})`);
        
        // TODO: Update your database transaction state to 'FAILED'
    }

    // Always respond with 200 OK so Safaricom stops retrying
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});

export default router;
