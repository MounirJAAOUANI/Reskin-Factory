import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '4000')),
  nodeEnv: optional('NODE_ENV', 'development'),
  modeEnv: optional('MODE_ENV', 'development'),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
  redisUrl: optional('REDIS_URL'),
  passwordHash: optional('PASSWORD_HASH'),

  anthropicApiKey: optional('ANTHROPIC_API_KEY'),
  openaiApiKey: optional('OPENAI_API_KEY'),

  github: {
    token: optional('GITHUB_TOKEN'),
    repoOwner: optional('GITHUB_REPO_OWNER'),
    repoName: optional('GITHUB_REPO_NAME'),
    pagesRepo: optional('GITHUB_PAGES_REPO'),
  },

  googlePlay: {
    serviceAccount: optional('GOOGLE_PLAY_SERVICE_ACCOUNT'),
    packageId: optional('GOOGLE_PLAY_PACKAGE_ID'),
  },

  firebase: {
    projectId: optional('FIREBASE_PROJECT_ID'),
    privateKey: optional('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    clientEmail: optional('FIREBASE_CLIENT_EMAIL'),
  },
} as const;

export const isDev = config.modeEnv === 'development';
export const isProd = config.modeEnv === 'production';
