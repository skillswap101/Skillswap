import fetch from 'node-fetch';

// Configuration (Use sandbox keys for testing, change to api.safaricom.co.ke for production)
const BASE_URL = 'https://sandbox.safaricom.co.ke';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'YOUR_CONSUMER_KEY';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
const BUSINESS_SHORTCODE = process.env.MPESA_SHORTCODE || '174379'; // Sandbox default
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox default
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/v1/mpesa/callback';

// Step 1: Generate Daraja Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`
        }
    });

    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to retrieve M-Pesa access token');
    }
    return data.access_token;
}

// Step 2: Initiate STK Push Payment Prompt
export async function initiateSTKPush(phone, amount, accountReference, description) {
    try {
        const token = await getAccessToken();
        
        // Format timestamp: YYYYMMDDHHMMSS
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        
        // Generate Password
        const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        
        // Ensure phone number format is 254XXXXXXXXX
        let formattedPhone = phone.toString().trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.slice(1);
        }

        const payload = {
            BusinessShortCode: BUSINESS_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount), // M-Pesa requires integers
            PartyA: formattedPhone,
            PartyB: BUSINESS_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: CALLBACK_URL,
            AccountReference: accountReference,
            TransactionDesc: description
        };

        const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return { success: true, data: result };

    } catch (error) {
        console.error('M-Pesa STK Push Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Independently asks Safaricom whether a given STK push actually
 * succeeded, using their documented STK Push Query API - rather than
 * trusting the ResultCode a caller claims in a webhook payload. Without
 * this, anyone who obtained a valid CheckoutRequestID (which isn't a
 * secret - it's returned to the client that initiated the push) could
 * POST a forged "successful" callback directly to our public callback
 * URL and get credited with no real payment ever happening.
 */
export async function querySTKPushStatus(checkoutRequestId) {
    try {
        const token = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                BusinessShortCode: BUSINESS_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            }),
        });

        const result = await response.json();
        // Safaricom returns ResultCode "0" (string) for a confirmed
        // successful payment on this query endpoint.
        return { success: true, resultCode: result.ResultCode, resultDesc: result.ResultDesc, raw: result };
    } catch (error) {
        console.error('M-Pesa STK Query Error:', error.message);
        return { success: false, error: error.message };
    }
}
