# App Factory TS

Génère automatiquement des apps Flutter prêtes pour le Google Play Store à partir d'une simple idée textuelle.

**Durée :** 18-27 min | **Coût :** ~$0.073 | **Output :** AAB signé en brouillon Play Console

## Architecture

```
[Client React + Vite] → SSE (étapes 1-7) + Polling (étape 8)
[Server Node.js + Express]
[Redis JobQueue] + fallback fichier
External APIs: Claude, OpenAI, GitHub Actions, Google Play, Firebase
```

## Étapes

| # | Nom | Méthode | Durée |
|---|-----|---------|-------|
| 01 | Market Scout | SSE | 2-3 min |
| 02 | App Architect | SSE | 1-2 min |
| 03 | Logo Generator | SSE | 2-3 min |
| 04 | Flutter Code Gen | SSE | 3-4 min |
| 05 | Screenshots Creator | SSE | 3-5 min |
| 06 | ASO Optimizer | SSE | 1-2 min |
| 07 | Compliance Builder | SSE | 1-2 min |
| 08 | Build & Deploy | Polling | 4-6 min |

## Prérequis

- Node.js 20+
- Docker (pour Redis local)
- Clés API : Claude, OpenAI, GitHub, Google Play Console, Firebase

## Setup local

### 1. Redis (via Docker)

```bash
docker-compose up -d
```

### 2. Server

```bash
cd server
npm install
cp .env.example .env
# Édite .env avec tes vraies clés
npm run dev
```

### 3. Client

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Ouvre http://localhost:5173

## Déploiement Railway

### Server

```bash
cd server
npm run build
# Pousse sur Railway via Dockerfile
```

Variables d'environnement à définir dans le dashboard Railway (voir server/.env.example).

### Client

```bash
cd client
npm run build
# Déploie dist/ sur Vercel / Netlify / Railway static
```

## Variables d'environnement requises

Voir [server/.env.example](server/.env.example) et [client/.env.example](client/.env.example).

## GitHub Actions

Le repo GitHub cible doit contenir `.github/workflows/build.yml` (fourni dans ce repo).
Configure les Secrets GitHub :
- `KEYSTORE_BASE64` — keystore Android encodé en base64
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

## Mode développement

Définis `MODE_ENV=development` dans server/.env pour activer les données simulées (pas d'appels aux APIs payantes).
