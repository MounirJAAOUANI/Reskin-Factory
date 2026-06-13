import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export interface ServerStatus {
  online: boolean;
  mode: 'development' | 'production' | null;
  latencyMs: number | null;
}

export function useServerStatus(): ServerStatus {
  const [status, setStatus] = useState<ServerStatus>({ online: false, mode: null, latencyMs: null });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const t0 = Date.now();
      try {
        const res = await fetch(`${API_URL}/health`, {
          signal: AbortSignal.timeout(3000),
          cache: 'no-store',
        });
        if (cancelled) return;
        const latencyMs = Date.now() - t0;
        if (res.ok) {
          const data = (await res.json()) as { mode: string };
          setStatus({ online: true, mode: data.mode as 'development' | 'production', latencyMs });
        } else {
          setStatus({ online: false, mode: null, latencyMs: null });
        }
      } catch {
        if (!cancelled) setStatus({ online: false, mode: null, latencyMs: null });
      }
    }

    void check();
    const id = setInterval(() => void check(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return status;
}
