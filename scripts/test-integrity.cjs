/**
 * Automated Verification & Integrity Test Suite
 * Tests server health, authentication fail-closed enforcement, rate limiting, and route integrity.
 */
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== SkillSwap Integrity & Security Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body?.status !== 'healthy') throw new Error(`Expected status: healthy, got ${res.body?.status}`);
  });

  // 2. Auth Guard Fail-Closed on Protected Routes
  await test('POST /api/escrow/release rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { swapId: 'test-swap' },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('GET /api/transactions rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/transactions');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/proposals/:id/accept rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/proposals/test-prop/accept', {
      method: 'POST',
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/sessions/:id/complete rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/sessions/test-sess/complete', {
      method: 'POST',
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Forged Token Rejection
  await test('POST /api/escrow/release rejects forged/unverified Bearer tokens (401 or 403)', async () => {
    const forgedHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhdHRhY2tlciJ9.';
    const res = await request('/api/escrow/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: forgedHeader,
      },
      body: { swapId: 'test-swap' },
    });
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
  });

  // 4. Public API listings
  await test('GET /api/listings returns array without crashing', async () => {
    const res = await request('/api/listings');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected listings array');
  });

  // 5. Public API users
  await test('GET /api/users returns array without crashing', async () => {
    const res = await request('/api/users');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected users array');
  });

  // 6. Security & Deprecated Route Gating Tests
  await test('POST /api/cloud/users/test is disabled with 410 or rejects with 401', async () => {
    const res = await request('/api/cloud/users/test', { method: 'POST' });
    if (res.status !== 410 && res.status !== 401) throw new Error(`Expected 410 or 401, got ${res.status}`);
  });

  await test('POST /api/escrow/transfer is disabled with 410 or rejects with 401', async () => {
    const res = await request('/api/escrow/transfer', { method: 'POST' });
    if (res.status !== 410 && res.status !== 401) throw new Error(`Expected 410 or 401, got ${res.status}`);
  });

  await test('POST /api/v1/stripe/pay-card is disabled with 410 or rejects with 401', async () => {
    const res = await request('/api/v1/stripe/pay-card', { method: 'POST' });
    if (res.status !== 410 && res.status !== 401) throw new Error(`Expected 410 or 401, got ${res.status}`);
  });

  await test('POST /api/v1/stripe/create-checkout-session rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { packageId: 'tier-1' },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/v1/paypal/create-order rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/v1/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { packageId: 'tier-1' },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/v1/mpesa/pay rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/v1/mpesa/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { packageId: 'tier-1', phone: '254712345678' },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/auth/sync-claims rejects unauthenticated requests (401)', async () => {
    const res = await request('/api/auth/sync-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {},
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
