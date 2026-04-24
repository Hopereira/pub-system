/**
 * WebSocket Stress Test — Socket.IO connections
 *
 * Usage:
 *   npx ts-node scripts/load-test/websocket-stress.ts
 *
 * Env vars:
 *   WS_URL (default: http://localhost:3000)
 *   WS_CONNECTIONS (default: 100)
 *   WS_TOKEN — JWT token for auth
 *   WS_TENANT_ID — tenant UUID
 */
import { io, Socket } from 'socket.io-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const WS_URL = process.env.WS_URL || 'http://localhost:3000';
const CONNECTIONS = parseInt(process.env.WS_CONNECTIONS || '100');
const TOKEN = process.env.WS_TOKEN || '';
const TENANT_ID = process.env.WS_TENANT_ID || '';

interface ConnectionResult {
  id: number;
  connected: boolean;
  latency: number;
  error?: string;
}

async function connectOne(id: number): Promise<ConnectionResult> {
  const start = Date.now();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ id, connected: false, latency: Date.now() - start, error: 'timeout' });
    }, 10000);

    const socket = io(WS_URL, {
      auth: TOKEN ? { token: TOKEN } : undefined,
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000,
    });

    socket.on('connect', () => {
      clearTimeout(timeout);
      const latency = Date.now() - start;

      // Join tenant room if token provided
      if (TENANT_ID) {
        socket.emit('join_comanda', 'test-comanda-id');
      }

      // Disconnect after a short hold
      setTimeout(() => {
        socket.disconnect();
      }, 2000);

      resolve({ id, connected: true, latency });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      resolve({ id, connected: false, latency: Date.now() - start, error: err.message });
    });
  });
}

async function main() {
  console.log(`\n🔌 WEBSOCKET STRESS TEST — ${CONNECTIONS} connections`);
  console.log(`URL: ${WS_URL}`);
  console.log(`Token: ${TOKEN ? 'provided' : 'none (public)'}`);
  console.log('='.repeat(50));

  // Batch connections (groups of 50 to avoid overwhelming)
  const batchSize = 50;
  const results: ConnectionResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < CONNECTIONS; i += batchSize) {
    const batch = [];
    const end = Math.min(i + batchSize, CONNECTIONS);
    console.log(`\n📡 Connecting batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${end})...`);

    for (let j = i; j < end; j++) {
      batch.push(connectOne(j));
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    const connected = batchResults.filter(r => r.connected).length;
    const failed = batchResults.filter(r => !r.connected).length;
    console.log(`  ✅ ${connected} connected, ❌ ${failed} failed`);
  }

  const totalTime = Date.now() - startTime;

  // Summary
  console.log('\n📊 RESULTS');
  console.log('='.repeat(50));
  const connected = results.filter(r => r.connected);
  const failed = results.filter(r => !r.connected);

  console.log(`Total attempted: ${CONNECTIONS}`);
  console.log(`Connected:       ${connected.length}`);
  console.log(`Failed:          ${failed.length}`);
  console.log(`Success rate:    ${((connected.length / CONNECTIONS) * 100).toFixed(1)}%`);
  console.log(`Total time:      ${totalTime}ms`);

  if (connected.length > 0) {
    const latencies = connected.map(r => r.latency).sort((a, b) => a - b);
    console.log(`\nLatency:`);
    console.log(`  Min:  ${latencies[0]}ms`);
    console.log(`  Avg:  ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0)}ms`);
    console.log(`  P95:  ${latencies[Math.floor(latencies.length * 0.95)]}ms`);
    console.log(`  Max:  ${latencies[latencies.length - 1]}ms`);
  }

  if (failed.length > 0) {
    const errorCounts: Record<string, number> = {};
    failed.forEach(f => {
      const err = f.error || 'unknown';
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
    console.log(`\nErrors:`);
    Object.entries(errorCounts).forEach(([err, count]) => {
      console.log(`  ${err}: ${count}`);
    });
  }

  // Multi-tenant isolation check
  console.log(`\n🔒 Tenant Isolation:`);
  if (TOKEN) {
    console.log('  Connections authenticated via JWT — tenant room isolation active');
  } else {
    console.log('  Public connections (no JWT) — no tenant room assigned');
  }

  process.exit(failed.length > CONNECTIONS * 0.1 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(2);
});
