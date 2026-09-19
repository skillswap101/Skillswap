import express from 'express';
import Stripe from 'stripe';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const db = getFirestore();

// 1. Create Stripe Checkout Session (explicitly parsing JSON since it mounts before global json middleware)
router.post('/api/v1/stripe/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { credits, price, packageName, userId } = req.body;

    if (!credits || !price) {
      return res.status(400).json({ success: false, error: 'Credits and price are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SkillSwap: ${packageName || 'Time Credits Bundle'}`,
              description: `${credits} Time Credit(s) for P2P Talent Exchange`,
            },
            unit_amount: Math.round(price * 100), // convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?stripe_success=true&credits=${credits}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?stripe_cancel=true`,
      metadata: {
        userId: userId || 'anonymous',
        credits: credits.toString(),
        packageName: packageName || 'Custom Bundle',
      },
    });

    res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout Session Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Stripe Webhook for Asynchronous Fulfillment
router.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits, packageName } = session.metadata;
    const creditAmount = parseInt(credits, 10);

    if (userId && creditAmount) {
      try {
        // Atomically increment user time credits in Firestore
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          timeCredits: FieldValue.increment(creditAmount),
        });

        // Record transaction log in Firestore
        await db.collection('transactions').add({
          gateway: 'stripe',
          checkoutSessionId: session.id,
          userId,
          credits: creditAmount,
          packageName,
          amountPaid: session.amount_total / 100,
          currency: session.currency,
          status: 'SUCCESS',
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`Successfully credited ${creditAmount} time units to user ${userId}`);
      } catch (dbError) {
        console.error('Firestore fulfillment error during Stripe webhook:', dbError);
      }
    }
  }

  res.status(200).json({ received: true });
});

export default router;
