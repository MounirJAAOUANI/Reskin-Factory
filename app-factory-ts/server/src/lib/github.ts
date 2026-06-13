import { config, isDev } from '../config.js';
import type { SSEHelper } from './sse.js';

const BASE = 'https://api.github.com';

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.github.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function ghFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...(init?.headers as Record<string, string> ?? {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// ─── Trigger GitHub Actions workflow ─────────────────────────────────────────

export interface WorkflowDispatchInputs {
  app_name: string;
  package_id: string;
  dart_code: string;
  pubspec_yaml: string;
}

export async function triggerBuildWorkflow(
  inputs: WorkflowDispatchInputs,
  sse: SSEHelper
): Promise<string> {
  if (isDev) {
    sse.log('🚀 [DEV] Simulating GitHub Actions trigger', 'info');
    return 'dev-workflow-run-12345';
  }

  const { repoOwner, repoName } = config.github;
  sse.log(`🚀 Triggering GitHub Actions workflow on ${repoOwner}/${repoName}...`, 'info');

  await ghFetch(`/repos/${repoOwner}/${repoName}/actions/workflows/build.yml/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'main', inputs }),
  });

  // Wait 3s then fetch the latest run
  await new Promise((r) => setTimeout(r, 3000));

  const runs = await ghFetch<{ workflow_runs: Array<{ id: number; html_url: string }> }>(
    `/repos/${repoOwner}/${repoName}/actions/runs?per_page=1&event=workflow_dispatch`
  );

  const run = runs.workflow_runs[0];
  if (!run) throw new Error('No workflow run found after dispatch');

  sse.log(`✅ Workflow started: run #${run.id}`, 'success');
  return String(run.id);
}

// ─── Get workflow run status ──────────────────────────────────────────────────

export interface WorkflowRun {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  html_url: string;
}

export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
  const { repoOwner, repoName } = config.github;
  return ghFetch<WorkflowRun>(`/repos/${repoOwner}/${repoName}/actions/runs/${runId}`);
}

// ─── Download artifact ────────────────────────────────────────────────────────

export async function downloadArtifact(runId: string): Promise<Buffer> {
  const { repoOwner, repoName } = config.github;

  const artifacts = await ghFetch<{ artifacts: Array<{ id: number; name: string }> }>(
    `/repos/${repoOwner}/${repoName}/actions/runs/${runId}/artifacts`
  );

  const artifact = artifacts.artifacts.find((a) => a.name === 'app-release-bundle');
  if (!artifact) throw new Error('No artifact named "app-release-bundle" found');

  const fetchFn = (await import('node-fetch')).default;
  const res = await fetchFn(
    `${BASE}/repos/${repoOwner}/${repoName}/actions/artifacts/${artifact.id}/zip`,
    { headers: headers(), redirect: 'follow' }
  );
  if (!res.ok) throw new Error(`Failed to download artifact: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Publish Privacy Policy to GitHub Pages ──────────────────────────────────

export async function publishPrivacyPolicy(
  html: string,
  appName: string,
  sse: SSEHelper
): Promise<string> {
  if (isDev) {
    sse.log('📄 [DEV] Simulating privacy policy publish', 'info');
    return `https://${config.github.repoOwner}.github.io/${config.github.repoName}/privacy-policy`;
  }

  const { repoOwner, repoName } = config.github;
  const filePath = 'privacy-policy.html';
  const branch = 'main';

  // Check if file already exists (to get its SHA for update)
  let sha: string | undefined;
  try {
    const existing = await ghFetch<{ sha: string }>(
      `/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`
    );
    sha = existing.sha;
  } catch {
    // File doesn't exist yet
  }

  sse.log(`📄 Publishing privacy policy to GitHub Pages...`, 'info');
  await ghFetch(`/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `docs: Update privacy policy for ${appName}`,
      content: Buffer.from(html).toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  const policyUrl = `https://${repoOwner}.github.io/${repoName}/privacy-policy`;
  sse.log(`✅ Privacy policy published at ${policyUrl}`, 'success');
  return policyUrl;
}
