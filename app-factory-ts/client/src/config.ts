export const API_URL = import.meta.env['VITE_API_URL'] as string ?? 'http://localhost:4000';
export const MODE_ENV = import.meta.env['VITE_MODE_ENV'] as string ?? 'development';
export const PASSWORD_REQUIRED = import.meta.env['VITE_PASSWORD_REQUIRED'] === 'true';
export const TRUE_PASSWORD = import.meta.env['VITE_TRUE_PASSWORD'] as string ?? '';

export const TOTAL_COST_USD = 0.073;
export const TOTAL_TIME_MIN = { min: 18, max: 27 };

export interface StepConfig {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: 'sse' | 'poll';
  estimatedMin: number;
  estimatedMax: number;
  costUSD: number;
}

export const STEPS: StepConfig[] = [
  {
    id: 'market-scout',
    label: '01 — Market Scout',
    description: 'Analyze competitors and validate niche viability',
    endpoint: '/api/agents/market-scout',
    method: 'sse',
    estimatedMin: 2,
    estimatedMax: 3,
    costUSD: 0.004,
  },
  {
    id: 'app-architect',
    label: '02 — App Architect',
    description: 'Design app name, screens, theme and architecture',
    endpoint: '/api/agents/app-architect',
    method: 'sse',
    estimatedMin: 1,
    estimatedMax: 2,
    costUSD: 0.003,
  },
  {
    id: 'logo-gen',
    label: '03 — Logo Generator',
    description: 'Generate app icon with DALL-E in 4 sizes',
    endpoint: '/api/agents/logo-gen',
    method: 'sse',
    estimatedMin: 2,
    estimatedMax: 3,
    costUSD: 0.020,
  },
  {
    id: 'code-gen',
    label: '04 — Flutter Code Gen',
    description: 'Generate main.dart + pubspec.yaml with AdMob, Firebase, IAP',
    endpoint: '/api/agents/code-gen',
    method: 'sse',
    estimatedMin: 3,
    estimatedMax: 4,
    costUSD: 0.012,
  },
  {
    id: 'screenshots',
    label: '05 — Screenshots Creator',
    description: 'Capture 5 Pixel 9 screenshots with Puppeteer',
    endpoint: '/api/agents/screenshots',
    method: 'sse',
    estimatedMin: 3,
    estimatedMax: 5,
    costUSD: 0.000,
  },
  {
    id: 'aso',
    label: '06 — ASO Optimizer',
    description: 'Generate Play Store title, description and keywords',
    endpoint: '/api/agents/aso',
    method: 'sse',
    estimatedMin: 1,
    estimatedMax: 2,
    costUSD: 0.005,
  },
  {
    id: 'compliance',
    label: '07 — Compliance Builder',
    description: 'Generate GDPR privacy policy and publish to GitHub Pages',
    endpoint: '/api/agents/compliance',
    method: 'sse',
    estimatedMin: 1,
    estimatedMax: 2,
    costUSD: 0.000,
  },
  {
    id: 'build-deploy',
    label: '08 — Build & Deploy',
    description: 'Build AAB on GitHub Actions → upload to Play Console as DRAFT',
    endpoint: '/api/agents/build-deploy',
    method: 'poll',
    estimatedMin: 4,
    estimatedMax: 6,
    costUSD: 0.029,
  },
];
