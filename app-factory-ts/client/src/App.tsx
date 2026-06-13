import { useState, useCallback, useRef } from 'react';
import { STEPS, PASSWORD_REQUIRED, TOTAL_COST_USD, TOTAL_TIME_MIN } from './config';
import { runSSEAgent, runPollingAgent } from './api';
import { useServerStatus } from './hooks/useServerStatus';
import { PasswordModal } from './components/PasswordModal';
import { PrereqPanel } from './components/PrereqPanel';
import { StepCard } from './components/StepCard';
import {
  buildMarketScoutPayload,
  buildAppArchitectPayload,
  buildLogoGenPayload,
  buildCodeGenPayload,
  buildScreenshotsPayload,
  buildASOPayload,
  buildCompliancePayload,
  buildBuildDeployPayload,
} from './steps/payloads';
import type {
  StepState,
  AppState,
  MarketScoutResult,
  AppArchitectResult,
  LogoGenResult,
  CodeGenResult,
  ScreenshotsResult,
  ASOResult,
  ComplianceResult,
  LogEntry,
} from './types';

function makeInitialStepState(id: string): StepState {
  return {
    id,
    status: 'idle',
    logs: [],
    result: null,
    error: null,
    startedAt: null,
    completedAt: null,
  };
}

function makeInitialState(): AppState {
  return {
    niche: '',
    steps: Object.fromEntries(STEPS.map((s) => [s.id, makeInitialStepState(s.id)])),
    results: {},
  };
}

export default function App() {
  const [unlocked, setUnlocked] = useState(!PASSWORD_REQUIRED);
  const [appState, setAppState] = useState<AppState>(makeInitialState);
  const [prereqCollapsed, setPrereqCollapsed] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Keep a live ref to appState so async callbacks can read latest results
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const runAllAbortRef = useRef(false);

  const serverStatus = useServerStatus();

  function patchStep(id: string, patch: Partial<StepState>) {
    setAppState((prev) => ({
      ...prev,
      steps: { ...prev.steps, [id]: { ...prev.steps[id]!, ...patch } },
    }));
  }

  function addLog(id: string, entry: LogEntry) {
    setAppState((prev) => {
      const step = prev.steps[id]!;
      return {
        ...prev,
        steps: { ...prev.steps, [id]: { ...step, logs: [...step.logs, entry] } },
      };
    });
  }

  function storeResult(stepId: string, data: unknown) {
    setAppState((prev) => {
      const newResults = { ...prev.results };
      switch (stepId) {
        case 'market-scout':  newResults.marketScout  = data as MarketScoutResult;  break;
        case 'app-architect': newResults.appArchitect = data as AppArchitectResult; break;
        case 'logo-gen':      newResults.logoGen      = data as LogoGenResult;      break;
        case 'code-gen':      newResults.codeGen      = data as CodeGenResult;      break;
        case 'screenshots':   newResults.screenshots  = data as ScreenshotsResult;  break;
        case 'aso':           newResults.aso          = data as ASOResult;          break;
        case 'compliance':    newResults.compliance   = data as ComplianceResult;   break;
        case 'build-deploy':  newResults.buildDeploy  = data as import('./types').BuildDeployResult; break;
      }
      return { ...prev, results: newResults };
    });
  }

  // Returns a Promise that resolves when the step reaches done or error
  const runStep = useCallback((stepId: string): Promise<'done' | 'error'> => {
    return new Promise((resolve) => {
      const stepCfg = STEPS.find((s) => s.id === stepId);
      if (!stepCfg) { resolve('error'); return; }

      // Read latest state from ref (safe in async context)
      const { niche, results } = appStateRef.current;

      let payload: object;
      try {
        switch (stepId) {
          case 'market-scout':  payload = buildMarketScoutPayload(niche); break;
          case 'app-architect': payload = buildAppArchitectPayload(niche, results.marketScout!); break;
          case 'logo-gen':      payload = buildLogoGenPayload(results.appArchitect!, niche); break;
          case 'code-gen':      payload = buildCodeGenPayload(results.appArchitect!); break;
          case 'screenshots':   payload = buildScreenshotsPayload(results.appArchitect!, results.codeGen!); break;
          case 'aso':           payload = buildASOPayload(results.appArchitect!, niche, results.marketScout!); break;
          case 'compliance':    payload = buildCompliancePayload(results.appArchitect!); break;
          case 'build-deploy':  payload = buildBuildDeployPayload(
            results.appArchitect!, results.codeGen!, results.logoGen!,
            results.screenshots!, results.aso!, results.compliance!
          ); break;
          default: resolve('error'); return;
        }
      } catch (err) {
        patchStep(stepId, {
          status: 'error',
          error: `Missing data from previous step: ${(err as Error).message}`,
        });
        resolve('error');
        return;
      }

      setActiveStepId(stepId);
      patchStep(stepId, { status: 'running', logs: [], error: null, startedAt: Date.now(), completedAt: null });

      function onLog(entry: LogEntry) { addLog(stepId, entry); }

      function onDone(data: unknown) {
        patchStep(stepId, { status: 'done', result: data, completedAt: Date.now() });
        storeResult(stepId, data);
        setActiveStepId(null);
        resolve('done');
      }

      function onError(msg: string) {
        patchStep(stepId, { status: 'error', error: msg, completedAt: Date.now() });
        setActiveStepId(null);
        resolve('error');
      }

      if (stepCfg.method === 'sse') {
        runSSEAgent(stepCfg.endpoint, payload, onLog, onDone, onError);
      } else {
        void runPollingAgent(stepCfg.endpoint, payload, onLog, onDone, onError);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAll() {
    runAllAbortRef.current = false;
    setIsRunningAll(true);

    for (const step of STEPS) {
      if (runAllAbortRef.current) break;

      // Skip already-done steps
      if (appStateRef.current.steps[step.id]?.status === 'done') continue;

      const outcome = await runStep(step.id);
      if (outcome === 'error') break;
    }

    setIsRunningAll(false);
    runAllAbortRef.current = false;
  }

  function stopAll() {
    runAllAbortRef.current = true;
    setIsRunningAll(false);
  }

  function canRunStep(stepId: string): boolean {
    const idx = STEPS.findIndex((s) => s.id === stepId);
    if (idx === 0) return appState.niche.trim().length >= 3;
    const prevStep = STEPS[idx - 1];
    if (!prevStep) return false;
    return appState.steps[prevStep.id]?.status === 'done';
  }

  const completedCount = STEPS.filter((s) => appState.steps[s.id]?.status === 'done').length;
  const allDone = completedCount === STEPS.length;
  const isBusy = activeStepId !== null || isRunningAll;
  const canStartAll = serverStatus.online && appState.niche.trim().length >= 3 && !isBusy && !allDone;

  if (!unlocked) {
    return <PasswordModal onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>App Factory</h1>
            <p className="header-sub">
              Flutter app → Play Store in {TOTAL_TIME_MIN.min}-{TOTAL_TIME_MIN.max} min · ~${TOTAL_COST_USD.toFixed(3)} per app
            </p>
          </div>

          <div className="header-center">
            <div className={`server-status ${serverStatus.online ? 'server-online' : 'server-offline'}`}>
              <span className="status-dot" />
              <span className="status-label">{serverStatus.online ? 'Backend online' : 'Backend offline'}</span>
              {serverStatus.latencyMs !== null && (
                <span className="status-latency">{serverStatus.latencyMs}ms</span>
              )}
            </div>
            {serverStatus.mode !== null && (
              <span className={`mode-badge mode-${serverStatus.mode}`}>
                {serverStatus.mode === 'development' ? 'DEV' : 'PROD'}
              </span>
            )}
          </div>

          <div className="header-stats">
            <span>{completedCount}/{STEPS.length} steps</span>
            <div className="global-progress">
              <div className="global-bar" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <PrereqPanel collapsed={prereqCollapsed} onToggle={() => setPrereqCollapsed(!prereqCollapsed)} />

        <div className="niche-input-section">
          <label htmlFor="niche-input">App Idea / Niche</label>
          <div className="niche-row">
            <input
              id="niche-input"
              type="text"
              placeholder="e.g. habit tracker minimaliste"
              value={appState.niche}
              onChange={(e) => setAppState((prev) => ({ ...prev, niche: e.target.value }))}
              disabled={isBusy}
            />
            {!canRunStep('market-scout') && appState.niche.trim().length > 0 && (
              <p className="hint">Enter at least 3 characters</p>
            )}
          </div>

          <div className="run-all-row">
            {!isRunningAll ? (
              <button
                className="btn-run-all"
                onClick={() => void runAll()}
                disabled={!canStartAll}
                title={
                  !serverStatus.online ? 'Backend offline'
                  : appState.niche.trim().length < 3 ? 'Enter at least 3 characters'
                  : ''
                }
              >
                ▶▶ Run Full Pipeline
              </button>
            ) : (
              <button className="btn-stop-all" onClick={stopAll}>
                ⏹ Stop after current step
              </button>
            )}
            {isRunningAll && activeStepId && (
              <span className="run-all-status">
                Running: {STEPS.find((s) => s.id === activeStepId)?.label ?? activeStepId}
              </span>
            )}
          </div>
        </div>

        <div className="steps-list">
          {STEPS.map((stepCfg) => (
            <StepCard
              key={stepCfg.id}
              config={stepCfg}
              state={appState.steps[stepCfg.id]!}
              isActive={activeStepId === stepCfg.id}
              canRun={canRunStep(stepCfg.id) && !isBusy}
              onRun={() => void runStep(stepCfg.id)}
            />
          ))}
        </div>

        {allDone && (
          <div className="success-banner">
            <h2>🎉 App Factory Complete!</h2>
            <p>Your app has been built and uploaded to Play Console as a DRAFT.</p>
            <a
              href={appState.results.buildDeploy?.draftUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Open Play Console →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
