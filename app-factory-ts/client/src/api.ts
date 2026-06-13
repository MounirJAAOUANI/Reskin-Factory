import { API_URL } from './config';
import type { LogEntry } from './types';

let password = '';

export function setPassword(p: string): void {
  password = p;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (password) h['X-Password'] = password;
  return h;
}

// ─── SSE Agent runner (steps 1-7) ────────────────────────────────────────────

export function runSSEAgent(
  endpoint: string,
  payload: object,
  onLog: (entry: LogEntry) => void,
  onDone: (data: unknown) => void,
  onError: (msg: string) => void
): () => void {
  let aborted = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  (async () => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        onError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        return;
      }

      if (!res.body) {
        onError('No response body');
        return;
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw) as {
              type?: string;
              msg?: string;
              data?: unknown;
              error?: string;
            };

            if (parsed.type === 'done') {
              onDone(parsed.data);
              return;
            } else if (parsed.type === 'error') {
              onError(parsed.error ?? 'Unknown error');
              return;
            } else {
              onLog({
                ts: new Date().toISOString(),
                msg: parsed.msg ?? JSON.stringify(parsed),
                type: (parsed.type as LogEntry['type']) ?? 'info',
              });
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err) {
      if (!aborted) onError((err as Error).message);
    }
  })();

  return () => {
    aborted = true;
    reader?.cancel().catch(() => null);
  };
}

// ─── Polling Agent runner (step 8) ────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000;
const MAX_POLLS = 450; // 75 min safety

export async function runPollingAgent(
  endpoint: string,
  payload: object,
  onLog: (entry: LogEntry) => void,
  onDone: (data: unknown) => void,
  onError: (msg: string) => void,
  signal?: AbortSignal
): Promise<void> {
  // 1. Create job
  const initRes = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    signal,
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    onError(`HTTP ${initRes.status}: ${text.slice(0, 200)}`);
    return;
  }

  const { jobId } = (await initRes.json()) as { jobId: string };
  onLog({ ts: new Date().toISOString(), msg: `📋 Job created: ${jobId}`, type: 'info' });

  // Wait for Railway to stabilize
  await sleep(4000);

  let cursor = 0;
  let pollCount = 0;

  while (pollCount < MAX_POLLS) {
    if (signal?.aborted) return;

    try {
      const pollRes = await fetch(`${API_URL}/api/jobs/${jobId}?cursor=${cursor}`, {
        headers: authHeaders(),
        signal,
      });

      if (!pollRes.ok) {
        onLog({ ts: new Date().toISOString(), msg: `⚠️ Poll HTTP ${pollRes.status}`, type: 'error' });
      } else {
        const data = (await pollRes.json()) as {
          status: string;
          newLogs: LogEntry[];
          cursor: number;
          result: unknown;
          error: string | null;
        };

        data.newLogs?.forEach((log) => onLog(log));
        cursor = data.cursor;

        if (data.status === 'done') {
          onDone(data.result);
          return;
        }
        if (data.status === 'error') {
          onError(data.error ?? 'Job failed');
          return;
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      onLog({ ts: new Date().toISOString(), msg: `⚠️ Poll error: ${(err as Error).message}`, type: 'error' });
    }

    await sleep(POLL_INTERVAL_MS);
    pollCount++;
  }

  onError('Timeout: build took too long (>75 min)');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
