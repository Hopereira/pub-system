/**
 * k6 HTTP Load Test — Pub System
 *
 * Usage:
 *   k6 run scripts/load-test/http-load.js
 *   k6 run --vus 20 --duration 60s scripts/load-test/http-load.js
 *
 * Env vars:
 *   BASE_URL (default: http://localhost:3000)
 *   TENANT_ID (required — UUID of a test tenant)
 *   ADMIN_EMAIL / ADMIN_PASSWORD
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANT_ID = __ENV.TENANT_ID || '';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const listDuration = new Trend('list_duration', true);

export const options = {
  scenarios: {
    single_tenant: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.1'],
  },
};

export function setup() {
  // Login once, share token
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID,
      },
    },
  );
  loginDuration.add(res.timings.duration);

  check(res, { 'login status 201': (r) => r.status === 201 });
  if (res.status !== 201) {
    console.error(`Login failed: ${res.status} ${res.body}`);
    return {};
  }
  return { token: JSON.parse(res.body).access_token };
}

export default function (data) {
  if (!data.token) return;

  const headers = {
    Authorization: `Bearer ${data.token}`,
    'x-tenant-id': TENANT_ID,
    'Content-Type': 'application/json',
  };

  // 1. Health check (public)
  const healthRes = http.get(`${BASE_URL}/health/live`);
  check(healthRes, { 'health 200': (r) => r.status === 200 });

  // 2. List mesas
  const mesasRes = http.get(`${BASE_URL}/mesas`, { headers });
  listDuration.add(mesasRes.timings.duration);
  check(mesasRes, { 'mesas 200': (r) => r.status === 200 });
  errorRate.add(mesasRes.status !== 200);

  // 3. List produtos
  const produtosRes = http.get(`${BASE_URL}/produtos`, { headers });
  listDuration.add(produtosRes.timings.duration);
  check(produtosRes, { 'produtos 200': (r) => r.status === 200 });
  errorRate.add(produtosRes.status !== 200);

  // 4. List comandas
  const comandasRes = http.get(`${BASE_URL}/comandas`, { headers });
  listDuration.add(comandasRes.timings.duration);
  check(comandasRes, { 'comandas 200': (r) => r.status === 200 });
  errorRate.add(comandasRes.status !== 200);

  // 5. List funcionarios
  const funcRes = http.get(`${BASE_URL}/funcionarios`, { headers });
  listDuration.add(funcRes.timings.duration);
  check(funcRes, { 'funcionarios 200': (r) => r.status === 200 });
  errorRate.add(funcRes.status !== 200);

  // 6. List ambientes
  const ambRes = http.get(`${BASE_URL}/ambientes`, { headers });
  listDuration.add(ambRes.timings.duration);
  check(ambRes, { 'ambientes 200': (r) => r.status === 200 });
  errorRate.add(ambRes.status !== 200);

  sleep(0.5);
}

export function handleSummary(data) {
  console.log('\n📊 LOAD TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Avg response: ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms`);
  console.log(`P95 response: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log(`Error rate: ${(data.metrics.errors?.values?.rate || 0 * 100).toFixed(2)}%`);
  return {};
}
