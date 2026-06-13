import 'dotenv/config';

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason);
});

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { config } from './config.js';
import { initRedis, createJob, getJobPollResponse, registerPollerFn } from './lib/jobQueue.js';
import { createSSE } from './lib/sse.js';
import { scrapeCompetitors } from './lib/playstore.js';
import { analyzeMarket, designArchitecture, generateLogoPrompt, generateASO, generateFlutterCode } from './lib/claude.js';
import { generateLogo } from './lib/openai.js';
import { captureScreenshots } from './lib/screenshots.js';
import { generatePrivacyPolicyHTML, generateDataSafetyJSON } from './lib/privacypolicy.js';
import { publishPrivacyPolicy, triggerBuildWorkflow } from './lib/github.js';
import { startGitHubPoller } from './lib/github-poller.js';
import { publishRemoteConfig, buildRemoteConfigParams } from './lib/firebase.js';
import { generatePubspec } from './lib/pubspec.js';

import type {
  MarketScoutInput,
  AppArchitectInput,
  LogoGenInput,
  CodeGenInput,
  ScreenshotsInput,
  ASOInput,
  ComplianceInput,
  BuildDeployInput,
  JobStatus,
  BuildDeployResult,
} from './types.js';

// Register the poller function for job recovery on restart
registerPollerFn((jobId, workflowRunId, onComplete) => {
  const noop = async () => {};
  startGitHubPoller(jobId, workflowRunId, noop, onComplete);
});

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── Password middleware ──────────────────────────────────────────────────────

function checkPassword(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (!config.passwordHash) return next();
  const provided = req.headers['x-password'] as string | undefined;
  if (!provided) {
    res.status(401).json({ error: 'Password required' });
    return;
  }
  const hash = crypto.createHash('sha256').update(provided).digest('hex');
  if (hash !== config.passwordHash) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  next();
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: config.modeEnv, ts: Date.now() });
});

// ─── 01 Market Scout ─────────────────────────────────────────────────────────

app.post('/api/agents/market-scout', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { niche } = req.body as MarketScoutInput;
    sse.log(`🔍 Starting market research for: "${niche}"`, 'info');

    const competitors = await scrapeCompetitors(niche, sse);
    const result = await analyzeMarket(niche, competitors, sse);

    sse.log(`✅ Market analysis complete — Recommendation: ${result.recommendation}`, 'success');
    sse.done(result);
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 02 App Architect ─────────────────────────────────────────────────────────

app.post('/api/agents/app-architect', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { niche, marketData } = req.body as AppArchitectInput;
    sse.log(`🏗️ Designing architecture for "${niche}"...`, 'info');

    const result = await designArchitecture(niche, marketData, sse);

    sse.log(`✅ Architecture ready: ${result.appName} (${result.packageId})`, 'success');
    sse.done(result);
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 03 Logo Generator ───────────────────────────────────────────────────────

app.post('/api/agents/logo-gen', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { appName, niche, primaryColor } = req.body as LogoGenInput;
    sse.log(`🎨 Generating logo for "${appName}"...`, 'info');

    const imagePrompt = await generateLogoPrompt(appName, niche, primaryColor, sse);
    sse.log(`📝 Logo prompt: ${imagePrompt.slice(0, 100)}...`, 'info');

    const result = await generateLogo(imagePrompt, sse);
    sse.log('✅ Logo generated in 4 formats', 'success');
    sse.done(result);
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 04 Flutter Code Gen ─────────────────────────────────────────────────────

app.post('/api/agents/code-gen', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { appName, packageId, architecture } = req.body as CodeGenInput;
    sse.log(`💻 Generating Flutter code for "${appName}"...`, 'info');

    const dartCode = await generateFlutterCode(appName, packageId, architecture, sse);
    const pubspecYaml = generatePubspec(appName, packageId);

    sse.log('✅ Flutter code generated', 'success');
    sse.done({
      files: {
        'lib/main.dart': dartCode,
        'pubspec.yaml': pubspecYaml,
      },
    });
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 05 Screenshots Creator ──────────────────────────────────────────────────

app.post('/api/agents/screenshots', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { appName, architecture } = req.body as ScreenshotsInput;
    sse.log(`📸 Generating screenshots for "${appName}"...`, 'info');

    const screenshots = await captureScreenshots(appName, architecture, sse);
    sse.done({ screenshots });
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 06 ASO Optimizer ────────────────────────────────────────────────────────

app.post('/api/agents/aso', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { appName, niche, marketData, architecture } = req.body as ASOInput;
    sse.log(`📝 Generating ASO content for "${appName}"...`, 'info');

    const result = await generateASO(appName, niche, marketData, architecture, sse);
    sse.log('✅ ASO content ready', 'success');
    sse.done(result);
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 07 Compliance Builder ───────────────────────────────────────────────────

app.post('/api/agents/compliance', checkPassword, async (req, res) => {
  const sse = createSSE(res);
  try {
    const { appName, packageId, features, primaryColor } = req.body as ComplianceInput;
    sse.log(`📄 Generating privacy policy for "${appName}"...`, 'info');

    const placeholderUrl = `https://${config.github.repoOwner}.github.io/${config.github.repoName}/privacy-policy`;

    const html = generatePrivacyPolicyHTML({
      appName,
      packageId,
      features,
      primaryColor,
      policyUrl: placeholderUrl,
    });

    sse.log('📤 Publishing to GitHub Pages...', 'info');
    const policyUrl = await publishPrivacyPolicy(html, appName, sse);

    const dataSafety = generateDataSafetyJSON({
      appName,
      packageId,
      features,
      primaryColor,
      policyUrl,
    });

    sse.log('✅ Compliance documents ready', 'success');
    sse.done({ policyUrl, html, dataSafety });
  } catch (err) {
    sse.fail(err as Error);
  }
});

// ─── 08 Build & Deploy ───────────────────────────────────────────────────────

app.post('/api/agents/build-deploy', checkPassword, (req, res) => {
  const job = createJob();
  res.json({ jobId: job.jobId });

  const payload = req.body as BuildDeployInput;

  void (async () => {
    try {
      await job.log('🔨 Starting build & deploy pipeline...', 'info');

      // Configure Firebase Remote Config
      await job.log('🔥 Configuring Firebase Remote Config...', 'info');
      const rcParams = buildRemoteConfigParams(payload.packageId);
      await publishRemoteConfig(rcParams, payload.packageId);
      await job.log('✅ Firebase Remote Config updated', 'success');

      // Trigger GitHub Actions build
      await job.log('🚀 Triggering GitHub Actions workflow...', 'info');
      const workflowRunId = await triggerBuildWorkflow(
        {
          app_name: payload.appName,
          package_id: payload.packageId,
          dart_code: payload.code.files['lib/main.dart'],
          pubspec_yaml: payload.code.files['pubspec.yaml'],
        },
        {
          log: (msg, type) => job.log(msg, type),
          done: <T>(_data: T) => Promise.resolve(),
          fail: (_e: Error | string) => Promise.resolve(),
        }
      );

      await job.setWorkflowRunId(workflowRunId);
      await job.log(`📡 Workflow run ID: ${workflowRunId}`, 'info');

      // Start poller
      await startGitHubPoller(
        job.jobId,
        workflowRunId,
        job.log.bind(job),
        async (status: JobStatus, data: BuildDeployResult | null, error?: string) => {
          if (status === 'done' && data) {
            await job.done(data);
          } else {
            await job.fail(error ?? 'Build failed');
          }
        }
      );
    } catch (err) {
      await job.fail(err as Error);
    }
  })();
});

// ─── Job polling ──────────────────────────────────────────────────────────────

app.get('/api/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const cursor = parseInt((req.query['cursor'] as string) ?? '0', 10);

  const response = await getJobPollResponse(jobId, cursor);
  if (!response) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(response);
});

// ─── Start ────────────────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[SIGNAL] SIGTERM received — Railway is stopping the container');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('[SIGNAL] SIGINT received');
  process.exit(0);
});

async function main(): Promise<void> {
  console.log('[startup] Initializing Redis...');
  await initRedis();
  console.log('[startup] Redis done. Starting HTTP server...');

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 App Factory server running on http://0.0.0.0:${config.port}`);
    console.log(`   Mode: ${config.modeEnv} | Node: ${process.env['NODE_ENV'] ?? 'development'}`);
    console.log('[startup] Server is ready and accepting connections');
  });

  server.on('error', (err) => {
    console.error('[FATAL] HTTP server error:', err);
  });

  // Keep event loop alive
  const keepalive = setInterval(() => {
    console.log(`[heartbeat] alive — uptime: ${Math.round(process.uptime())}s`);
  }, 30_000);
  keepalive.unref(); // don't prevent natural exit if everything else closes
}

void main();
