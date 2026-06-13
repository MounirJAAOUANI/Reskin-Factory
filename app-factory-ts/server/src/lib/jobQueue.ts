import { createClient, RedisClientType } from 'redis';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import type { Job, JobLog, JobStatus, BuildDeployResult } from '../types.js';

const JOBS_FILE = path.resolve('jobs.json');
const JOB_TTL = 86400; // 24h in seconds

let redis: RedisClientType | null = null;
let jobsMemory: Record<string, Job> = {};

// ─── Redis / File persistence ─────────────────────────────────────────────────

async function saveJob(jobId: string, job: Job): Promise<void> {
  if (redis) {
    await redis.set(`job:${jobId}`, JSON.stringify(job), { EX: JOB_TTL });
  } else {
    jobsMemory[jobId] = job;
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobsMemory, null, 2));
  }
}

async function getJob(jobId: string): Promise<Job | null> {
  if (redis) {
    const raw = await redis.get(`job:${jobId}`);
    return raw ? (JSON.parse(raw) as Job) : null;
  }
  return jobsMemory[jobId] ?? null;
}

// ─── Init (call once on server start) ────────────────────────────────────────

type GHPollerCallback = (
  jobId: string,
  workflowRunId: string,
  onComplete: (status: JobStatus, data: BuildDeployResult | null, error?: string) => Promise<void>
) => void;

let pollerFn: GHPollerCallback | null = null;

export function registerPollerFn(fn: GHPollerCallback): void {
  pollerFn = fn;
}

export async function initRedis(): Promise<RedisClientType | null> {
  if (config.redisUrl) {
    try {
      const client = createClient({
        url: config.redisUrl,
        socket: {
          connectTimeout: 3000,
          reconnectStrategy: (retries) => {
            if (retries >= 1) return false; // stop after 1 retry
            return 500;
          },
        },
      }) as RedisClientType;
      client.on('error', () => { /* suppress retry noise */ });

      // Race connection against a 4s timeout
      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis connect timeout')), 4000)
        ),
      ]);
      client.removeAllListeners('error');
      client.on('error', (err: Error) => console.warn('[Redis] error:', err.message));
      redis = client;
      console.log('✅ Redis connected');

      // Recover running jobs on startup
      const keys = await client.keys('job:*');
      for (const key of keys) {
        const raw = await client.get(key);
        if (!raw) continue;
        const job = JSON.parse(raw) as Job;
        if (job.status === 'running' && job.workflowRunId && pollerFn) {
          console.log(`[jobQueue] 🔄 Resuming poller for job: ${job.id}`);
          pollerFn(job.id, job.workflowRunId, async (status, data, error) => {
            const j = await getJob(job.id);
            if (!j) return;
            j.status = status;
            j.result = data;
            j.error = error ?? null;
            await saveJob(job.id, j);
          });
        }
      }
      return client;
    } catch (err) {
      console.warn('[Redis] connection failed, falling back to file:', (err as Error).message);
      redis = null;
      // No need to explicitly disconnect — the client never fully connected
    }
  }

  // Fallback: load from file
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    jobsMemory = JSON.parse(raw) as Record<string, Job>;
    console.log(`[jobQueue] 📄 Loaded ${Object.keys(jobsMemory).length} jobs from file`);
  } catch {
    jobsMemory = {};
  }

  return null;
}

// ─── Job handle ───────────────────────────────────────────────────────────────

export interface JobHandle {
  jobId: string;
  log(msg: string, type?: JobLog['type']): Promise<void>;
  setWorkflowRunId(runId: string): Promise<void>;
  done(data: BuildDeployResult): Promise<void>;
  fail(error: Error | string): Promise<void>;
}

export function createJob(): JobHandle {
  const jobId = randomUUID();
  const job: Job = {
    id: jobId,
    status: 'running',
    logs: [],
    result: null,
    error: null,
    workflowRunId: null,
    createdAt: Date.now(),
  };

  void saveJob(jobId, job);

  async function mutate(fn: (j: Job) => void): Promise<void> {
    const j = await getJob(jobId);
    if (!j) return;
    fn(j);
    await saveJob(jobId, j);
  }

  return {
    jobId,
    async log(msg, type = 'info') {
      await mutate((j) => {
        j.logs.push({ ts: new Date().toISOString(), msg, type });
      });
    },
    async setWorkflowRunId(runId) {
      await mutate((j) => {
        j.workflowRunId = runId;
      });
    },
    async done(data) {
      await mutate((j) => {
        j.status = 'done';
        j.result = data;
      });
    },
    async fail(error) {
      await mutate((j) => {
        j.status = 'error';
        j.error = error instanceof Error ? error.message : error;
      });
    },
  };
}

// ─── Poll response helper ─────────────────────────────────────────────────────

export async function getJobPollResponse(
  jobId: string,
  cursor: number
): Promise<{
  status: JobStatus;
  newLogs: JobLog[];
  cursor: number;
  result: BuildDeployResult | null;
  error: string | null;
} | null> {
  const job = await getJob(jobId);
  if (!job) return null;
  const newLogs = job.logs.slice(cursor);
  return {
    status: job.status,
    newLogs,
    cursor: cursor + newLogs.length,
    result: job.result,
    error: job.error,
  };
}
