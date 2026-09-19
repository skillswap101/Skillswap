const express = require('express');
const router = express.Router();
const { triggerStkPush } = require('./mpesaService');

// POST /api/v1/mpesa/stkpush - Trigger STK push to user phone
router.post('/stkpush', triggerStkPush);

// POST /api/v1/mpesa/callback - Handle Daraja callback results
router.post('/callback', async (req, res) => {
  try {
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    const callbackBody = req.body?.Body?.stkCallback;
    if (!callbackBody) return;

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackBody;
    
    if (ResultCode !== 0) {
      console.warn(`Transaction failed: ${ResultDesc}`);
      return;
    }

    const items = CallbackMetadata?.Item || [];
    const getParam = (name) => items.find(i => i.Name === name)?.Value;

    console.log(`Payment Successful! Receipt: ${getParam('MpesaReceiptNumber')}, Amount: ${getParam('Amount')}`);
    
  } catch (error) {
    console.error("Error processing callback:", error);
  }
});

module.exports = router;
