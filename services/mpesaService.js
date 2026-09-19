import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  initializeApp({ projectId });
}

const db = getFirestore();

export async function processMpesaCallback(callbackBody) {
  const stkCallback = callbackBody?.Body?.stkCallback;
  
  if (!stkCallback) {
    throw new Error('Invalid M-Pesa callback payload structure');
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  // Find the pending transaction linked to this CheckoutRequestID
  const transactionsRef = db.collection('transactions');
  const snapshot = await transactionsRef.where('checkoutRequestId', '==', CheckoutRequestID).limit(1).get();

  if (snapshot.empty) {
    console.warn(`[M-Pesa Warning] No matching transaction found for CheckoutRequestID: ${CheckoutRequestID}`);
    return { status: 'recorded_orphan', checkoutRequestId: CheckoutRequestID };
  }

  const txDoc = snapshot.docs[0];
  const txData = txDoc.data();

  // If already processed, ensure idempotency
  if (txData.status === 'COMPLETED' || txData.status === 'FAILED') {
    return { status: 'already_processed', checkoutRequestId: CheckoutRequestID };
  }

  if (ResultCode === 0) {
    // Payment Successful
    const items = CallbackMetadata?.Item || [];
    const getVal = (name) => items.find(i => i.Name === name)?.Value;

    const mpesaReceiptNumber = getVal('MpesaReceiptNumber');
    const amount = getVal('Amount');
    const phoneNumber = getVal('PhoneNumber');

    await db.runTransaction(async (transaction) => {
      // 1. Update Transaction Record
      transaction.update(txDoc.ref, {
        status: 'COMPLETED',
        mpesaReceiptNumber,
        amountPaid: amount,
        phoneNumber: String(phoneNumber),
        completedAt: FieldValue.serverTimestamp(),
      });

      // 2. If it's an escrow fund deposit, update escrow status to HELD
      if (txData.escrowId) {
        const escrowRef = db.collection('escrows').doc(txData.escrowId);
        transaction.update(escrowRef, {
          status: 'HELD',
          fundedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    console.log(`[M-Pesa Success] Transaction ${txDoc.id} completed. Receipt: ${mpesaReceiptNumber}`);
    return { success: true, receipt: mpesaReceiptNumber };
  } else {
    // Payment Failed or Cancelled by User
    await txDoc.ref.update({
      status: 'FAILED',
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      failedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[M-Pesa Failed] Transaction ${txDoc.id} failed: ${ResultDesc} (Code: ${ResultCode})`);
    return { success: false, reason: ResultDesc };
  }
}
