/**
 * Test Suite: Atomic Payment Fulfillment & Idempotency Assurance
 * 
 * Verifies:
 * 1. fulfillPendingPayment calls the atomic PostgreSQL RPC with exact parameters (p_payment_id, p_gateway_receipt).
 * 2. Successful RPC execution fulfills payment and sets in-memory status to 'completed'.
 * 3. Idempotent repeated fulfillment: Subsequent calls with the same paymentId return false and never double-credit.
 * 4. Concurrent fulfillment race condition prevention: Simultaneous calls resolve with exactly one winner.
 * 5. RPC error / failure handling: Fail-closed behavior — no balance update fallback, status remains uncompleted.
 * 6. Edge cases: Non-existent payments and already failed payments are rejected.
 */
import {
  createPendingPayment,
  fulfillPendingPayment,
  getPendingPaymentStatus,
  markPendingPaymentFailed,
} from '../server/services/paymentsService.js';
import { supabase } from '../server/supabaseClient.js';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

async function run() {
  console.log('=== SkillSwap Atomic Payment Fulfillment Test Suite ===\n');

  // Save original supabase methods
  const originalRpc = supabase.rpc.bind(supabase);
  const originalFrom = supabase.from.bind(supabase);

  // In unit test without live DB connection, mock supabase.from to prevent fetch timeout to placeholder
  (supabase as any).from = (tableName: string) => {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      upsert: async () => ({ error: null }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
      insert: async () => ({ error: null }),
    };
  };

  // 1. Parameter Alignment & Successful Fulfillment
  await test('fulfillPendingPayment passes exact RPC parameters (p_payment_id, p_gateway_receipt)', async () => {
    let capturedArgs: any = null;
    (supabase as any).rpc = async (fnName: string, args: any) => {
      if (fnName === 'fulfill_pending_payment') {
        capturedArgs = args;
        return { data: true, error: null };
      }
      return { data: null, error: new Error('Unknown RPC') };
    };

    const ref = `test_ref_${Date.now()}`;
    await createPendingPayment({
      gateway: 'stripe',
      gatewayRef: ref,
      userId: 'user_atomic_1',
      creditHours: 5,
      amount: 49.99,
      currency: 'USD',
    });

    const success = await fulfillPendingPayment('stripe', ref, 'receipt_stripe_999');
    if (!success) throw new Error('Expected fulfillPendingPayment to return true on RPC success');

    if (!capturedArgs) throw new Error('RPC was not called');
    if (capturedArgs.p_payment_id !== `stripe_${ref}`) {
      throw new Error(`Expected p_payment_id to be stripe_${ref}, got ${capturedArgs.p_payment_id}`);
    }
    if (capturedArgs.p_gateway_receipt !== 'receipt_stripe_999') {
      throw new Error(`Expected p_gateway_receipt to be receipt_stripe_999, got ${capturedArgs.p_gateway_receipt}`);
    }

    const status = await getPendingPaymentStatus('stripe', ref);
    if (status !== 'completed') {
      throw new Error(`Expected in-memory status to be 'completed', got '${status}'`);
    }
  });

  // 2. Repeated Fulfillment / Idempotency
  await test('Repeated fulfillment of an already completed payment returns false (idempotent)', async () => {
    let rpcCallCount = 0;
    (supabase as any).rpc = async (fnName: string) => {
      if (fnName === 'fulfill_pending_payment') {
        rpcCallCount++;
        return { data: true, error: null };
      }
      return { data: null, error: null };
    };

    const ref = `idemp_ref_${Date.now()}`;
    await createPendingPayment({
      gateway: 'mpesa',
      gatewayRef: ref,
      userId: 'user_idemp_2',
      creditHours: 2,
      amount: 19.99,
      currency: 'KES',
    });

    // First call
    const firstCall = await fulfillPendingPayment('mpesa', ref, 'MPESA_REC_1');
    if (!firstCall) throw new Error('First call should succeed');
    if (rpcCallCount !== 1) throw new Error(`Expected 1 RPC call, got ${rpcCallCount}`);

    // Second call (duplicate webhook or replay)
    const secondCall = await fulfillPendingPayment('mpesa', ref, 'MPESA_REC_1');
    if (secondCall !== false) {
      throw new Error('Repeated call should return false to prevent duplicate credit processing');
    }
    // RPC shouldn't even be called again if already marked completed
    if (rpcCallCount !== 1) {
      throw new Error(`Repeated call should not re-invoke RPC (rpcCallCount was ${rpcCallCount})`);
    }
  });

  // 3. Concurrent Fulfillment Race Condition Guard
  await test('Simultaneous concurrent fulfillment calls grant credit exactly once', async () => {
    // Simulate database row-level locking (SELECT ... FOR UPDATE)
    // Only the first call that acquires the lock transitions from pending -> completed
    let isFulfilledInDb = false;

    (supabase as any).rpc = async (fnName: string) => {
      if (fnName === 'fulfill_pending_payment') {
        // Small async delay to simulate network/database latency
        await new Promise((r) => setTimeout(r, 20));
        if (isFulfilledInDb) {
          // Row lock sees status is no longer 'pending'
          return { data: false, error: null };
        }
        isFulfilledInDb = true;
        return { data: true, error: null };
      }
      return { data: null, error: null };
    };

    const ref = `concurrent_ref_${Date.now()}`;
    await createPendingPayment({
      gateway: 'paypal',
      gatewayRef: ref,
      userId: 'user_concurrent_3',
      creditHours: 10,
      amount: 89.99,
      currency: 'USD',
    });

    // Dispatch 5 concurrent requests simultaneously
    const results = await Promise.all([
      fulfillPendingPayment('paypal', ref, 'capture_1'),
      fulfillPendingPayment('paypal', ref, 'capture_2'),
      fulfillPendingPayment('paypal', ref, 'capture_3'),
      fulfillPendingPayment('paypal', ref, 'capture_4'),
      fulfillPendingPayment('paypal', ref, 'capture_5'),
    ]);

    const successes = results.filter((r) => r === true).length;
    const failures = results.filter((r) => r === false).length;

    if (successes !== 1) {
      throw new Error(`Expected exactly 1 success under concurrent execution, got ${successes}`);
    }
    if (failures !== 4) {
      throw new Error(`Expected 4 rejections under concurrent execution, got ${failures}`);
    }
  });

  // 4. Fail-Closed on RPC Error / Rejection (No Unsafe Fallback)
  await test('Fails closed on database RPC error: returns false and leaves payment uncompleted', async () => {
    (supabase as any).rpc = async () => {
      return {
        data: null,
        error: { message: 'Database connection failure / lock timeout', details: 'PL/pgSQL error' },
      };
    };

    const ref = `fail_closed_ref_${Date.now()}`;
    await createPendingPayment({
      gateway: 'stripe',
      gatewayRef: ref,
      userId: 'user_fail_closed_4',
      creditHours: 3,
      amount: 29.99,
      currency: 'USD',
    });

    const result = await fulfillPendingPayment('stripe', ref, 'receipt_fail');
    if (result !== false) {
      throw new Error('fulfillPendingPayment must return false when atomic RPC errors');
    }

    const status = await getPendingPaymentStatus('stripe', ref);
    if (status === 'completed') {
      throw new Error('Payment status must NOT be set to completed when RPC fails');
    }
  });

  // 5. Non-Existent Payment
  await test('Returns false for non-existent payment reference', async () => {
    const result = await fulfillPendingPayment('stripe', `non_existent_${Date.now()}`);
    if (result !== false) throw new Error('Expected false for non-existent payment');
  });

  // 6. Already Failed Payment
  await test('Returns false for payment marked as failed', async () => {
    const ref = `failed_ref_${Date.now()}`;
    await createPendingPayment({
      gateway: 'mpesa',
      gatewayRef: ref,
      userId: 'user_failed_6',
      creditHours: 1,
      amount: 9.99,
      currency: 'KES',
    });

    await markPendingPaymentFailed('mpesa', ref, 'User cancelled STK push');
    const status = await getPendingPaymentStatus('mpesa', ref);
    if (status !== 'failed') throw new Error(`Expected status 'failed', got '${status}'`);

    const result = await fulfillPendingPayment('mpesa', ref, 'receipt_late');
    if (result !== false) throw new Error('Expected false when attempting to fulfill failed payment');
  });

  // Restore original supabase methods
  (supabase as any).rpc = originalRpc;
  (supabase as any).from = originalFrom;

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
