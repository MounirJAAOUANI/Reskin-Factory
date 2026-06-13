import { LogViewer } from './LogViewer';
import type { StepConfig } from '../config';
import type { StepState, BuildDeployResult, LogoGenResult, ScreenshotsResult } from '../types';

interface Props {
  config: StepConfig;
  state: StepState;
  isActive: boolean;
  canRun: boolean;
  onRun: () => void;
}

function StatusBadge({ status }: { status: StepState['status'] }) {
  const map = {
    idle: { label: 'Waiting', cls: 'badge-idle' },
    running: { label: 'Running...', cls: 'badge-running' },
    done: { label: 'Done', cls: 'badge-done' },
    error: { label: 'Error', cls: 'badge-error' },
  };
  const { label, cls } = map[status];
  return <span className={`status-badge ${cls}`}>{label}</span>;
}

function ResultPreview({ stepId, result }: { stepId: string; result: unknown }) {
  if (!result) return null;

  if (stepId === 'market-scout') {
    const r = result as { recommendation: string; topCompetitors: Array<{ name: string; rating: number }> };
    return (
      <div className="result-preview">
        <p><strong>Recommendation:</strong> <span className={`rec-${r.recommendation.toLowerCase()}`}>{r.recommendation}</span></p>
        <p><strong>Top competitors:</strong> {r.topCompetitors.slice(0, 3).map(c => `${c.name} (${c.rating}★)`).join(', ')}</p>
      </div>
    );
  }

  if (stepId === 'app-architect') {
    const r = result as { appName: string; packageId: string; tagline: string };
    return (
      <div className="result-preview">
        <p><strong>{r.appName}</strong> — {r.tagline}</p>
        <p className="mono">{r.packageId}</p>
      </div>
    );
  }

  if (stepId === 'logo-gen') {
    const r = result as LogoGenResult;
    return (
      <div className="result-preview">
        <img src={`data:image/png;base64,${r.formats['192']}`} alt="Logo" className="logo-preview" />
      </div>
    );
  }

  if (stepId === 'screenshots') {
    const r = result as ScreenshotsResult;
    return (
      <div className="result-preview screenshots-row">
        {r.screenshots.slice(0, 3).map((b64, i) => (
          <img key={i} src={`data:image/png;base64,${b64}`} alt={`Screenshot ${i + 1}`} className="screenshot-thumb" />
        ))}
      </div>
    );
  }

  if (stepId === 'aso') {
    const r = result as { title: string; shortDescription: string };
    return (
      <div className="result-preview">
        <p><strong>{r.title}</strong></p>
        <p>{r.shortDescription}</p>
      </div>
    );
  }

  if (stepId === 'compliance') {
    const r = result as { policyUrl: string };
    return (
      <div className="result-preview">
        <a href={r.policyUrl} target="_blank" rel="noreferrer">{r.policyUrl}</a>
      </div>
    );
  }

  if (stepId === 'build-deploy') {
    const r = result as BuildDeployResult;
    return (
      <div className="result-preview">
        <p>Status: <strong>{r.playConsoleStatus}</strong></p>
        <p>Size: {(r.apkSize / 1_000_000).toFixed(1)} MB</p>
        <a href={r.draftUrl} target="_blank" rel="noreferrer">Open Play Console →</a>
        <br />
        <a href={r.workflowRunUrl} target="_blank" rel="noreferrer">View GitHub Actions →</a>
      </div>
    );
  }

  return null;
}

function copyLogsToClipboard(stepLabel: string, logs: StepState['logs'], error: string | null) {
  const lines: string[] = [`=== ${stepLabel} — Error Report ===`, ''];
  if (error) lines.push(`ERROR: ${error}`, '');
  lines.push('--- Logs ---');
  logs.forEach((l) => {
    const ts = new Date(l.ts).toISOString();
    lines.push(`[${ts}] [${l.type.toUpperCase()}] ${l.msg}`);
  });
  void navigator.clipboard.writeText(lines.join('\n'));
}

export function StepCard({ config: stepCfg, state, isActive, canRun, onRun }: Props) {
  const elapsed =
    state.startedAt && state.status === 'running'
      ? Math.round((Date.now() - state.startedAt) / 1000)
      : state.startedAt && state.completedAt
      ? Math.round((state.completedAt - state.startedAt) / 1000)
      : null;

  const isError = state.status === 'error';

  return (
    <div className={`step-card step-${state.status} ${isActive ? 'step-active' : ''}`}>
      <div className="step-header">
        <div className="step-meta">
          <h3 className="step-label">{stepCfg.label}</h3>
          <p className="step-desc">{stepCfg.description}</p>
        </div>
        <div className="step-right">
          <StatusBadge status={state.status} />
          <span className="step-time">{stepCfg.estimatedMin}-{stepCfg.estimatedMax} min</span>
          {elapsed !== null && (
            <span className="step-elapsed">{elapsed}s</span>
          )}
        </div>
      </div>

      {state.status === 'idle' && canRun && (
        <button className="btn-run" onClick={onRun}>
          {stepCfg.method === 'poll' ? '🚀 Start Build' : '▶ Run'}
        </button>
      )}

      {isError && (
        <div className="error-box">
          <div className="error-box-header">
            <strong>Error:</strong> {state.error}
            <div className="error-actions">
              {canRun && (
                <button className="btn-retry" onClick={onRun}>↺ Retry</button>
              )}
              {state.logs.length > 0 && (
                <button
                  className="btn-copy-logs"
                  onClick={() => copyLogsToClipboard(stepCfg.label, state.logs, state.error)}
                  title="Copy full logs to clipboard"
                >
                  📋 Copy logs
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Normal log viewer — collapsed during normal run */}
      {!isError && (
        <LogViewer logs={state.logs} maxHeight="180px" />
      )}

      {/* Full expanded log viewer on error — no height cap */}
      {isError && state.logs.length > 0 && (
        <div className="error-log-section">
          <div className="error-log-title">Full technical logs</div>
          <LogViewer logs={state.logs} maxHeight="none" />
        </div>
      )}

      <ResultPreview stepId={stepCfg.id} result={state.result} />
    </div>
  );
}
