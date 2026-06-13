import AdmZip from 'adm-zip';
import { getWorkflowRun, downloadArtifact } from './github.js';
import { uploadToPlayConsole } from './playstore-upload.js';
import { isDev } from '../config.js';
import type { JobStatus, BuildDeployResult } from '../types.js';

type OnComplete = (
  status: JobStatus,
  data: BuildDeployResult | null,
  error?: string
) => Promise<void>;

type LogFn = (msg: string, type?: 'info' | 'error' | 'success') => Promise<void>;

const POLL_INTERVAL_MS = 10_000; // 10s
const MAX_POLLS = 90; // 15 min max

export function startGitHubPoller(
  jobId: string,
  workflowRunId: string,
  log: LogFn,
  onComplete: OnComplete
): void {
  if (isDev) {
    void simulateDevBuild(jobId, workflowRunId, log, onComplete);
    return;
  }

  void runPoller(jobId, workflowRunId, log, onComplete);
}

async function simulateDevBuild(
  _jobId: string,
  runId: string,
  log: LogFn,
  onComplete: OnComplete
): Promise<void> {
  await log('🔨 [DEV] Simulating Flutter build...', 'info');
  await sleep(2000);
  await log('📦 [DEV] Compiling Dart code...', 'info');
  await sleep(2000);
  await log('🔑 [DEV] Signing APK with debug keystore...', 'info');
  await sleep(1500);
  await log('☁️ [DEV] Uploading to Play Console...', 'info');
  await sleep(1000);
  await log('✅ [DEV] Build complete!', 'success');

  await onComplete('done', {
    apkUrl: 'https://example.com/dev-app-release.aab',
    apkName: 'app-release.aab',
    apkSize: 12_500_000,
    playConsoleStatus: 'DRAFT',
    draftUrl: 'https://play.google.com/console/u/0/developers/dev/app-list',
    workflowRunUrl: `https://github.com/dev/repo/actions/runs/${runId}`,
  });
}

async function runPoller(
  _jobId: string,
  runId: string,
  log: LogFn,
  onComplete: OnComplete
): Promise<void> {
  let polls = 0;

  while (polls < MAX_POLLS) {
    await sleep(POLL_INTERVAL_MS);
    polls++;

    try {
      const run = await getWorkflowRun(runId);
      await log(`⏳ Build status: ${run.status} (poll ${polls}/${MAX_POLLS})`, 'info');

      if (run.status === 'completed') {
        if (run.conclusion !== 'success') {
          await onComplete('error', null, `GitHub Actions build ${run.conclusion ?? 'failed'}`);
          return;
        }

        await log('✅ Build succeeded! Downloading artifact...', 'success');
        const zipBuffer = await downloadArtifact(runId);

        await log('📦 Extracting AAB...', 'info');
        const zip = new AdmZip(zipBuffer);
        const aabEntry = zip.getEntries().find((e) => e.entryName.endsWith('.aab'));
        if (!aabEntry) throw new Error('No .aab file found in artifact');

        const aabBuffer = aabEntry.getData();
        await log(`📤 Uploading ${aabEntry.entryName} to Play Console...`, 'info');
        const draftUrl = await uploadToPlayConsole(aabBuffer);

        await log('🎉 App uploaded to Play Console as DRAFT!', 'success');
        await onComplete('done', {
          apkUrl: run.html_url,
          apkName: aabEntry.entryName,
          apkSize: aabBuffer.length,
          playConsoleStatus: 'DRAFT',
          draftUrl,
          workflowRunUrl: run.html_url,
        });
        return;
      }
    } catch (err) {
      await log(`⚠️ Poll error: ${(err as Error).message}`, 'error');
    }
  }

  await onComplete('error', null, 'Build timeout: exceeded 15 minutes');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
