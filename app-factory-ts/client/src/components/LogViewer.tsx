import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  maxHeight?: string;
}

export function LogViewer({ logs, maxHeight = '200px' }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  if (logs.length === 0) return null;

  return (
    <div className="log-viewer" style={maxHeight === 'none' ? {} : { maxHeight }}>
      {logs.map((log, i) => (
        <div key={i} className={`log-line log-${log.type}`}>
          <span className="log-ts">{new Date(log.ts).toLocaleTimeString()}</span>
          <span className="log-msg">{log.msg}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
