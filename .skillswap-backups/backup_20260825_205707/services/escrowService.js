import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initializeApp({ projectId });
  }
}

const db = getFirestore();

export async function releaseEscrowFunds(escrowId, requesterUid) {
  const escrowRef = db.collection('escrows').doc(escrowId);

  return await db.runTransaction(async (transaction) => {
    const escrowDoc = await transaction.get(escrowRef);

    if (!escrowDoc.exists) {
      throw new Error('Escrow record not found');
    }

    const escrowData = escrowDoc.data();

    if (escrowData.buyerId !== requesterUid) {
      throw new Error('Unauthorized: Only the buyer can release escrow funds');
    }

    if (escrowData.status !== 'HELD') {
      throw new Error(`Invalid transaction state: Escrow is currently ${escrowData.status}`);
    }

    const sellerRef = db.collection('users').doc(escrowData.sellerId);
    const sellerDoc = await transaction.get(sellerRef);

    if (!sellerDoc.exists) {
      throw new Error('Seller account not found');
    }

    const currentSellerBalance = sellerDoc.data().balance || 0;
    const newSellerBalance = currentSellerBalance + escrowData.amount;

    transaction.update(escrowRef, {
      status: 'RELEASED',
      releasedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(sellerRef, {
      balance: newSellerBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, newBalance: newSellerBalance };
  });
}
