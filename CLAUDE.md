# Reskin Factory

## Session Start (MANDATORY)
At the start of every session, before answering any question:
1. Read `graphify-out/GRAPH_REPORT.md` to load the knowledge graph summary into context
2. Use it as NODE_CACHE seed — no file reads until a node is missing from the graph

## Stack
Monorepo TS. Front: React+Vite on Railway (`app-factory-ts/client/`). Back: Express+Node on Railway (`app-factory-ts/server/`). Policies: static HTML on Vercel (`policies/`).

## Critical Gotchas

**OpenAI**: model `gpt-image-1` (not dall-e-3). Returns `b64_json`, not URL. No `response_format` param.

**Firebase Admin v12**: use modular API `import { getRemoteConfig } from 'firebase-admin/remote-config'` — `admin.remoteConfig(app)` is broken. Use `rc.createTemplateFromJSON(JSON.stringify({...}))`. Firebase errors are non-blocking (try/catch in `index.ts`).

**Vite build vars**: `VITE_*` are baked at build time — must be `ARG`/`ENV` in client Dockerfile builder stage, not just Railway runtime vars.

**Railway PORT**: server listens on `process.env.PORT` (injected, e.g. 8080). Railway Networking UI port must match. `EXPOSE` is informational only.

**JobLog types**: only `'info' | 'success' | 'error'` — no `'warn'`.

## Privacy Policies
HTML pushed to `policies/privacy-policy.html` in GitHub → served by Vercel. URL: `${VERCEL_PROJECT_URL}/privacy-policy`.

## Key Env Vars (back)
`PORT`, `FRONTEND_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `REDIS_URL`, `FIREBASE_PROJECT_ID/PRIVATE_KEY/CLIENT_EMAIL`, `GITHUB_TOKEN/REPO_OWNER/REPO_NAME`, `VERCEL_PROJECT_URL`, `PASSWORD_HASH`

## Key Env Vars (front)
`VITE_API_URL` (build-time), `VITE_PASSWORD_REQUIRED`, `VITE_TRUE_PASSWORD`

---

# Graphify + Node Memory Cache Policy

**Priority order: NODE_CACHE > graphify-out/GRAPH_REPORT.md > filesystem**

File reads are forbidden unless the node is missing from the graph or runtime verification is required.

For every codebase question:
1. Check NODE_CACHE
2. Query GRAPH_REPORT.md if not cached
3. Read file only if missing from graph

When `/graphify` is executed: rebuild graph, clear NODE_CACHE, reload from new graph.

Bypass cache only if: node is outdated, graph inconsistent, or runtime contradicts cached structure.
