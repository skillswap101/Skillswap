import express from 'express';
import { initiateSTKPush } from './mpesa.js';

const router = express.Router();

// Endpoint called by your frontend app UI to trigger M-Pesa prompt
router.post('/api/v1/mpesa/pay', async (req, res) => {
    try {
        const { phone, amount, accountReference, description } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: phone and amount are required.' 
            });
        }

        console.log(`Initiating STK Push for phone: ${phone}, amount: ${amount}`);

        const result = await initiateSTKPush(
            phone, 
            amount, 
            accountReference || 'SkillSwap5', 
            description || 'SkillSwap P2P Service Exchange'
        );

        if (result.success) {
            return res.status(200).json({ 
                success: true, 
                message: 'STK push sent successfully. Check your phone.',
                data: result.data 
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

export default router;
