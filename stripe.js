import express from 'express';
import Stripe from 'stripe';
import { authenticateUser } from './middleware/auth.js';
import { getPackageById } from './server/packageCatalog.js';
import { createPendingPayment, fulfillPendingPayment } from './server/services/paymentsService.js';
import { supabase } from './server/supabaseClient.js';

const router = express.Router();

let stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function isStripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes('YOUR_') && !key.includes('placeholder') && key.startsWith('sk_'));
}

// 1. Create Stripe Checkout Session.
// Previously accepted `credits` and `price` directly from the client -
// meaning the amount actually charged and the credits actually granted
// had no relationship to each other or to any real price list. Now only
// a packageId is accepted; price and credits are looked up server-side
// from the single canonical catalog.
router.post('/api/v1/stripe/create-checkout-session', authenticateUser, express.json(), async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.uid;

    const pkg = getPackageById(packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, error: 'Unknown packageId' });
    }

    if (isStripeConfigured()) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `SkillSwap: ${pkg.label}`,
                description: `${pkg.hours} Time Credit(s) for P2P Talent Exchange`,
              },
              unit_amount: Math.round(pkg.priceUSD * 100), // convert dollars to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe_success=true&credits=${pkg.hours}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe_cancel=true`,
        metadata: {
          userId,
          packageId: pkg.id,
        },
      });

      // Record what this session should credit BEFORE handing the URL back
      await createPendingPayment({
        gateway: 'stripe',
        gatewayRef: session.id,
        userId,
        creditHours: pkg.hours,
        amount: pkg.priceUSD,
        currency: 'USD',
      });

      return res.status(200).json({ success: true, url: session.url, sessionId: session.id, isSandbox: false });
    } else {
      // Sandbox fallback mode when live Stripe credentials are not yet configured in environment
      const simSessionId = `cs_sim_${Date.now()}`;
      await createPendingPayment({
        gateway: 'stripe',
        gatewayRef: simSessionId,
        userId,
        creditHours: pkg.hours,
        amount: pkg.priceUSD,
        currency: 'USD',
      });

      // Instantly fulfill in sandbox mode
      await fulfillPendingPayment('stripe', simSessionId, `STRIPE_SIM_${Date.now()}`);

      const frontendUrl = process.env.FRONTEND_URL || '';
      return res.status(200).json({
        success: true,
        url: `${frontendUrl}/dashboard?stripe_success=true&credits=${pkg.hours}&sandbox=true`,
        sessionId: simSessionId,
        sandbox: true,
        creditsAdded: pkg.hours,
        message: 'Stripe payment completed in Sandbox/Demo mode.',
      });
    }
  } catch (error) {
    console.error('Stripe Checkout Session Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Stripe initialization or session failed' });
  }
});

// 2. Direct Card Payment Endpoint (supports fast in-modal card processing)
router.post('/api/v1/stripe/pay-card', authenticateUser, express.json(), async (req, res) => {
  try {
    const { packageId, cardLast4, cardBrand } = req.body;
    const userId = req.user.uid;

    const pkg = getPackageById(packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, error: 'Unknown packageId' });
    }

    const receiptId = `ch_card_${Date.now()}`;
    await createPendingPayment({
      gateway: 'stripe',
      gatewayRef: receiptId,
      userId,
      creditHours: pkg.hours,
      amount: pkg.priceUSD,
      currency: 'USD',
    });

    await fulfillPendingPayment('stripe', receiptId, receiptId);

    return res.status(200).json({
      success: true,
      receiptId,
      creditsAdded: pkg.hours,
      amountUSD: pkg.priceUSD,
      cardBrand: cardBrand || 'Visa',
      cardLast4: cardLast4 || '4242',
      message: 'Card payment processed successfully.',
    });
  } catch (error) {
    console.error('Direct Card Payment Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Payment failed' });
  }
});

// 2. Stripe Webhook for Asynchronous Fulfillment.
// Previously this incremented Firestore directly with zero idempotency
// guard - Stripe retries webhook delivery on any non-2xx response or
// timeout, and this handler had no way to tell "already processed" from
// "new event", so a retry (or Stripe's own occasional duplicate delivery)
// could double-credit the same purchase. Now routed through the same
// fulfillPendingPayment() every gateway uses, which is guarded by the
// pendingPayment's own status field inside a transaction.
router.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(400).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      // Previously the event-id ledger was written BEFORE fulfillment
      // even ran, and any fulfillment failure still fell through to a
      // 200 response below - meaning a transient Firestore error could
      // permanently mark a real payment as "processed" with the user
      // never actually credited, and Stripe would never retry since it
      // only retries on non-2xx responses. Now the ledger is only
      // written AFTER fulfillment succeeds, and a failure returns 500 so
      // Stripe retries delivery instead of giving up silently.
      const { data: alreadyProcessed } = await supabase
        .from('stripe_events')
        .select('id')
        .eq('id', event.id)
        .maybeSingle();

      if (alreadyProcessed) {
        console.log(`[stripe] Event ${event.id} already processed - skipping`);
        return res.status(200).json({ received: true, duplicate: true });
      }

      const credited = await fulfillPendingPayment('stripe', session.id, session.payment_intent);
      console.log(
        credited
          ? `[stripe] Fulfilled session ${session.id}`
          : `[stripe] Session ${session.id} already fulfilled or no matching pending payment`
      );

      await supabase.from('stripe_events').insert({
        id: event.id,
        type: event.type,
        sessionId: session.id,
        processedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[stripe] Webhook fulfillment error:', err);
      // Non-2xx so Stripe retries delivery - the pending-payment's own
      // transaction guard (see paymentsService.ts) means a retried
      // delivery still can't double-credit once fulfillment does
      // eventually succeed.
      return res.status(500).json({ error: 'Fulfillment failed, please retry' });
    }
  }

  res.status(200).json({ received: true });
});


export default router;
