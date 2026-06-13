// ─── Log ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  ts: string;
  msg: string;
  type: 'info' | 'success' | 'error';
}

// ─── Step state ───────────────────────────────────────────────────────────────

export type StepStatus = 'idle' | 'running' | 'done' | 'error';

export interface StepState {
  id: string;
  status: StepStatus;
  logs: LogEntry[];
  result: unknown;
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

// ─── Step 01 ──────────────────────────────────────────────────────────────────

export interface CompetitorApp {
  name: string;
  packageId: string;
  rating: number;
  installs: string;
  reviews: number;
  description: string;
}

export interface MarketScoutResult {
  recommendation: 'GO' | 'CAUTION' | 'NO-GO';
  topCompetitors: CompetitorApp[];
  nicheGap: string;
  suggestedDifferentiator: string;
  targetKeywords: string[];
}

// ─── Step 02 ──────────────────────────────────────────────────────────────────

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

export interface AppArchitectResult {
  appName: string;
  tagline: string;
  packageId: string;
  screens: string[];
  features: string[];
  theme: AppTheme;
  iosTarget: string;
  androidTarget: number;
}

// ─── Step 03 ──────────────────────────────────────────────────────────────────

export interface LogoGenResult {
  logoUrl: string;
  formats: {
    '1024': string;
    '512': string;
    '192': string;
    '48': string;
  };
}

// ─── Step 04 ──────────────────────────────────────────────────────────────────

export interface CodeGenResult {
  files: {
    'lib/main.dart': string;
    'pubspec.yaml': string;
  };
}

// ─── Step 05 ──────────────────────────────────────────────────────────────────

export interface ScreenshotsResult {
  screenshots: string[];
}

// ─── Step 06 ──────────────────────────────────────────────────────────────────

export interface ASOResult {
  title: string;
  shortDescription: string;
  longDescription: string;
  keywords: string[];
  whatNew: string;
}

// ─── Step 07 ──────────────────────────────────────────────────────────────────

export interface ComplianceResult {
  policyUrl: string;
  html: string;
  dataSafety: object;
}

// ─── Step 08 ──────────────────────────────────────────────────────────────────

export interface BuildDeployResult {
  apkUrl: string;
  apkName: string;
  apkSize: number;
  playConsoleStatus: 'DRAFT';
  draftUrl: string;
  workflowRunUrl: string;
}

// ─── App state ────────────────────────────────────────────────────────────────

export interface AppState {
  niche: string;
  steps: Record<string, StepState>;
  results: {
    marketScout?: MarketScoutResult;
    appArchitect?: AppArchitectResult;
    logoGen?: LogoGenResult;
    codeGen?: CodeGenResult;
    screenshots?: ScreenshotsResult;
    aso?: ASOResult;
    compliance?: ComplianceResult;
    buildDeploy?: BuildDeployResult;
  };
}
