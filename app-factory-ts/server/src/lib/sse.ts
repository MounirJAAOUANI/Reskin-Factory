import type { Response } from 'express';

export interface SSEHelper {
  log(msg: string, type?: 'info' | 'success' | 'error'): void;
  done<T>(data: T): void;
  fail(err: Error | string): void;
}

export function createSSE(res: Response): SSEHelper {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Railway compatibility

  function send(payload: object): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  return {
    log(msg, type = 'info') {
      send({ msg, type });
    },
    done<T>(data: T) {
      send({ type: 'done', data });
      res.end();
    },
    fail(err) {
      const error = err instanceof Error ? err.message : err;
      send({ type: 'error', error });
      res.end();
    },
  };
}
