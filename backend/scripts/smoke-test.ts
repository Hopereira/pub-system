/**
 * Smoke Test — Post-deploy validation
 *
 * Validates critical paths after deployment:
 * 1. Health endpoints respond
 * 2. Login works
 * 3. Authenticated list endpoints work
 * 4. WebSocket connects
 *
 * Usage:
 *   npx ts-node scripts/smoke-test.ts
 *
 * Env vars:
 *   API_URL (default: http://localhost:3000)
 *   SMOKE_EMAIL (default: admin@admin.com)
 *   SMOKE_PASSWORD (default: admin123)
 *   SMOKE_TENANT_SLUG (default: first tenant found)
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL || 'admin@admin.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'admin123';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, durationMs: Date.now() - start, error: err.message });
    console.log(`  ❌ ${name}: ${err.message} (${Date.now() - start}ms)`);
  }
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log(`\n🔥 SMOKE TEST — ${API_URL}`);
  console.log('='.repeat(50));

  // 1. Health checks
  console.log('\n📡 Health Checks:');
  await test('GET /health', async () => {
    const data = await fetchJson(`${API_URL}/health`);
    if (data.status !== 'ok') throw new Error(`status: ${data.status}`);
  });

  await test('GET /health/live', async () => {
    const data = await fetchJson(`${API_URL}/health/live`);
    if (data.status !== 'ok') throw new Error(`status: ${data.status}`);
  });

  await test('GET /health/ready', async () => {
    const data = await fetchJson(`${API_URL}/health/ready`);
    if (data.status !== 'ok') throw new Error(`status: ${data.status}`);
  });

  // 2. Auth
  console.log('\n🔐 Authentication:');
  let token = '';
  let tenantId = '';

  await test('POST /auth/login', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, senha: PASSWORD }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    token = data.access_token;
    tenantId = data.user?.tenantId || '';
    if (!token) throw new Error('No access_token in response');
  });

  if (!token) {
    console.log('\n⚠️ Skipping authenticated tests (login failed)');
  } else {
    // 3. Authenticated endpoints
    console.log('\n📋 Authenticated Endpoints:');
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const endpoints = [
      'funcionarios',
      'mesas',
      'produtos',
      'ambientes',
      'comandas',
    ];

    for (const ep of endpoints) {
      await test(`GET /${ep}`, async () => {
        await fetchJson(`${API_URL}/${ep}`, { headers: authHeaders });
      });
    }

    // 4. Internal status (if admin)
    await test('GET /internal/status', async () => {
      await fetchJson(`${API_URL}/internal/status`, { headers: authHeaders });
    });
  }

  // 5. WebSocket
  console.log('\n🔌 WebSocket:');
  await test('WebSocket connect', async () => {
    try {
      const { io } = await import('socket.io-client');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
        const socket = io(API_URL, {
          transports: ['websocket'],
          auth: token ? { token } : undefined,
          timeout: 5000,
        });
        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve();
        });
        socket.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (err: any) {
      if (err.message?.includes('Cannot find module')) {
        console.log('    (socket.io-client not available — skipped)');
        return;
      }
      throw err;
    }
  });

  // Summary
  console.log('\n📊 RESULTS');
  console.log('='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`Passed:  ${passed}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total:   ${results.length}`);
  console.log(`Time:    ${totalMs}ms`);

  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log(`\n${failed === 0 ? '✅ ALL SMOKE TESTS PASSED' : '❌ SMOKE TESTS FAILED'}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(2);
});
