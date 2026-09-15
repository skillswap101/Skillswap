// PRODUCTION HARDENING: This legacy client still defaults to localhost:5000. Prefer the current server/API client.
import { getAuth } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Helper to get the current user's Firebase ID token
 */
async function getAuthHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated on the frontend');
  }

  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Trigger an M-Pesa STK Push payment prompt
 */
export async function triggerMpesaStkPush({ phoneNumber, amount, accountReference, transactionDesc, escrowId }) {
  try {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/api/v1/mpesa/stkpush`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
        escrowId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger M-Pesa payment');
    }

    return data;
  } catch (error) {
    console.error('STK Push API Error:', error.message);
    throw error;
  }
}

/**
 * Securely release funds from escrow to the seller
 */
export async function releaseEscrow(escrowId) {
  try {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/api/v1/escrow/${escrowId}/release`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to release escrow funds');
    }

    return data;
  } catch (error) {
    console.error('Escrow Release API Error:', error.message);
    throw error;
  }
}
