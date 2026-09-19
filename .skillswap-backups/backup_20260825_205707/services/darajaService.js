import axios from 'axios';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  initializeApp({ projectId });
}

const db = getFirestore();

// Determine if sandbox or production based on environment or default to sandbox
const DARAJA_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing M-Pesa consumer credentials in environment variables');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Daraja Token Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Safaricom Daraja API');
  }
}

export async function initiateStkPush({ phoneNumber, amount, accountReference, transactionDesc, escrowId, userId }) {
  const accessToken = await getAccessToken();
  
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortCode || !passkey || !callbackUrl) {
    throw new Error('Missing M-Pesa shortcode, passkey, or callback URL configuration');
  }

  // Format timestamp: YYYYMMDDHHmmss
  const date = new Date();
  const timestamp = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');

  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  // Format phone number to start with 254 (e.g. 2547XXXXXXXX)
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.slice(1);
  }

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Number(amount),
    PartyA: formattedPhone,
    PartyB: shortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference || 'SkillSwap',
    TransactionDesc: transactionDesc || 'SkillSwap Escrow Deposit',
  };

  try {
    const response = await axios.post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    if (data.ResponseCode === '0') {
      // Save pending transaction in Firestore
      const txRef = await db.collection('transactions').add({
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        userId: userId || 'anonymous',
        escrowId: escrowId || null,
        amount: Number(amount),
        phoneNumber: formattedPhone,
        status: 'PENDING',
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'STK push sent successfully. Check your phone.',
        checkoutRequestId: data.CheckoutRequestID,
        transactionDocId: txRef.id,
      };
    } else {
      throw new Error(data.errorMessage || 'Daraja STK Push rejected');
    }
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || error.message || 'Failed to trigger M-Pesa STK push');
  }
}
