# Reskin Factory — Project Instructions

## Project Overview
Monorepo TypeScript fullstack app that automates Android app creation and deployment.
- **Front** (`app-factory-ts/client/`) — React + Vite, deployed on Railway (`app-factory-front`)
- **Back** (`app-factory-ts/server/`) — Express + Node.js, deployed on Railway (`app-factory-back`)
- **Policies** (`policies/`) — Static HTML privacy policies, hosted on Vercel

## Stack
- **Runtime**: Node 20, TypeScript
- **Server**: Express, Redis (job queue), Puppeteer (screenshots), Sharp (image resize)
- **AI**: Anthropic Claude SDK (`lib/claude.ts`), OpenAI `gpt-image-1` (`lib/openai.ts`)
- **Integrations**: Firebase Admin v12 (Remote Config), GitHub API + Actions, Google Play
- **Infra**: Railway (front + back), Vercel (policies/), Redis via Railway plugin

## Key Environment Variables (Railway back)
| Variable | Purpose |
|---|---|
| `PORT` | Injected by Railway (e.g. 8080) — do NOT hardcode |
| `FRONTEND_URL` | CORS origin (e.g. `https://app-factory-front.up.railway.app`) |
| `OPENAI_API_KEY` | OpenAI logo generation |
| `ANTHROPIC_API_KEY` | Claude agents |
| `REDIS_URL` | Railway Redis plugin |
| `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` | Firebase Admin |
| `GITHUB_TOKEN` / `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | GitHub API + Actions |
| `VERCEL_PROJECT_URL` | Base URL for hosted privacy policies (default: `https://reskin-factory.vercel.app`) |
| `PASSWORD_HASH` | SHA-256 hash of access password (optional — leave empty to disable auth) |

## Key Environment Variables (Railway front)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL — **must be set as Railway build arg**, baked at build time by Vite |
| `VITE_PASSWORD_REQUIRED` | Show/hide password screen |
| `VITE_TRUE_PASSWORD` | Plaintext password for client-side check |

> ⚠️ `VITE_*` variables are baked at **build time** by `vite build`. They must be declared as `ARG`/`ENV` in the client Dockerfile builder stage, and set in Railway's Variables (which Railway injects as build args).

## Railway Networking
- Railway injects `$PORT` at runtime (e.g. 8080) — the server must listen on `process.env.PORT`
- The Railway Networking UI "Port" field must match the port the server listens on
- `EXPOSE` in Dockerfile is informational only — Railway routes based on its Networking UI setting

## Architecture — Pipeline Steps
| Step | Route | Description |
|---|---|---|
| 01 | `POST /api/agents/market-scout` | Scrape Google Play + Claude market analysis |
| 02 | `POST /api/agents/app-architect` | Claude designs app architecture |
| 03 | `POST /api/agents/logo-gen` | Claude prompt → OpenAI `gpt-image-1` → Sharp resize |
| 04 | `POST /api/agents/code-gen` | Claude generates Flutter code |
| 05 | `POST /api/agents/screenshots` | Puppeteer renders HTML → PNG screenshots |
| 06 | `POST /api/agents/aso` | Claude generates ASO content |
| 07 | `POST /api/agents/compliance` | Privacy policy HTML → pushed to `policies/` in GitHub → served by Vercel |
| 08 | `POST /api/agents/build-deploy` | Firebase Remote Config + GitHub Actions trigger + poll |

Steps 01–07 use SSE (Server-Sent Events). Step 08 uses a Redis job queue + polling (`GET /api/jobs/:jobId`).

## Important Implementation Notes

### OpenAI Image Generation
- Model: `gpt-image-1` (not `dall-e-3` — deprecated)
- Returns `b64_json` by default (no URL) — check `item.b64_json` first, fallback to `item.url`
- Do NOT pass `response_format` param — deprecated

### Firebase Admin v12
- Use modular API: `import { getRemoteConfig } from 'firebase-admin/remote-config'`
- Do NOT use `admin.remoteConfig(app)` — broken in v12
- Use `rc.createTemplateFromJSON(JSON.stringify({...}))` to avoid `isJson` internal errors
- Firebase Remote Config errors are non-blocking (wrapped in try/catch in `index.ts`)

### Privacy Policies
- Generated HTML is pushed to `policies/privacy-policy.html` in this GitHub repo
- Vercel serves the `policies/` folder with `vercel.json` rewrite: `/privacy-policy` → `/privacy-policy.html`
- URL format: `${VERCEL_PROJECT_URL}/privacy-policy`

### Health Check
- `/health` endpoint returns `{"status":"ok","mode":"...","ts":...}`
- Configured in `app-factory-ts/server/railway.toml` with 300s timeout

---

# Graphify + Node Memory Cache Policy

## Objective
Minimize token usage by combining:
- Graphify knowledge graph (source of truth)
- Node-level working memory cache (short-term mental state)

## Core Principle
The assistant must NOT re-explore the codebase repeatedly. Instead:
- Load graph structure once
- Maintain a temporary NODE_CACHE during the session
- Reuse cached nodes instead of re-reading graph or files

## Graphify First Rule (STRICT)
Before any reasoning:
1. Use Graphify output (`graphify-out/graph.json` / `graphify-out/GRAPH_REPORT.md`)
2. Identify relevant nodes
3. Load only required nodes into cache

Never start with file reads.

## Node Cache Model

```
NODE_CACHE = {
  nodes: Map<NodeId, NodeSummary>,
  edges: Map<NodeId, [dependencies]>,
  activeContext: [currently used nodes]
}
```

**Priority order: NODE_CACHE > Graphify graph > filesystem**

### Cache lifecycle
- **Add**: when node is relevant, dependency traversed, or symbol required
- **Invalidate**: when `/graphify` is re-triggered, major codebase change detected, or node mismatch

## File Access Policy (STRICT)
File reads are forbidden unless:
- Node is missing from graph
- Node is missing from cache AND graph is insufficient
- Runtime verification is required

## Reasoning Flow (MANDATORY)
1. Query Graphify graph
2. Identify relevant nodes
3. Check NODE_CACHE
4. Load missing nodes only
5. Perform reasoning using cached nodes only
6. Avoid re-traversing already cached nodes

## /graphify Behavior
When `/graphify` is executed:
1. Rebuild graph
2. CLEAR NODE_CACHE completely
3. Reload only root-level modules into cache
4. Rebuild working memory progressively from graph traversal

## Exception Rule
Bypass cache ONLY if: node is outdated, graph is inconsistent, or runtime behavior contradicts cached structure.
