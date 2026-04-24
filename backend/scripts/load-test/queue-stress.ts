/**
 * Queue Stress Test — BullMQ audit queue
 *
 * Usage:
 *   npx ts-node scripts/load-test/queue-stress.ts
 *
 * Tests:
 *   1. Create many audit log jobs in burst
 *   2. Verify all jobs complete
 *   3. Measure throughput and latency
 */
import { Queue, QueueEvents } from 'bullmq';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const QUEUE_NAME = 'audit';
const JOB_COUNT = parseInt(process.env.STRESS_JOBS || '100');

async function main() {
  console.log(`\n🔥 QUEUE STRESS TEST — ${JOB_COUNT} jobs`);
  console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}`);
  console.log('='.repeat(50));

  const connection = { host: REDIS_HOST, port: REDIS_PORT };

  const queue = new Queue(QUEUE_NAME, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

  // Track completion
  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  queueEvents.on('completed', () => { completed++; });
  queueEvents.on('failed', () => { failed++; });

  // Burst: add all jobs at once
  console.log(`\n📨 Adding ${JOB_COUNT} jobs...`);
  const addStart = Date.now();
  const jobs = [];
  for (let i = 0; i < JOB_COUNT; i++) {
    jobs.push(
      queue.add('audit-stress', {
        action: 'STRESS_TEST',
        entityType: 'test',
        entityId: `stress-${i}`,
        tenantId: '00000000-0000-0000-0000-000000000000',
        userId: 'stress-test',
        metadata: { index: i, timestamp: Date.now() },
      }),
    );
  }
  await Promise.all(jobs);
  const addDuration = Date.now() - addStart;
  console.log(`✅ Jobs added in ${addDuration}ms (${(JOB_COUNT / (addDuration / 1000)).toFixed(0)} jobs/sec)`);

  // Wait for processing
  console.log('\n⏳ Waiting for processing...');
  const timeout = 30000;
  const pollInterval = 500;
  let waited = 0;

  while (completed + failed < JOB_COUNT && waited < timeout) {
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }

  const totalDuration = Date.now() - startTime;

  // Results
  console.log('\n📊 RESULTS');
  console.log('='.repeat(50));
  console.log(`Total jobs:     ${JOB_COUNT}`);
  console.log(`Completed:      ${completed}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Pending:        ${JOB_COUNT - completed - failed}`);
  console.log(`Total time:     ${totalDuration}ms`);
  console.log(`Throughput:     ${(completed / (totalDuration / 1000)).toFixed(0)} jobs/sec`);
  console.log(`Add latency:    ${(addDuration / JOB_COUNT).toFixed(2)}ms/job`);

  // Queue stats
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  console.log(`\nQueue state:    waiting=${counts.waiting} active=${counts.active} completed=${counts.completed} failed=${counts.failed}`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} jobs failed — check worker logs`);
  }

  if (JOB_COUNT - completed - failed > 0) {
    console.log(`\n⚠️  ${JOB_COUNT - completed - failed} jobs still pending after ${timeout / 1000}s timeout`);
    console.log('  This may indicate: no worker running, or worker is slow');
  }

  await queueEvents.close();
  await queue.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(2);
});
