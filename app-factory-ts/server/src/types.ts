// ─── Job Queue ────────────────────────────────────────────────────────────────

export interface JobLog {
  ts: string;
  msg: string;
  type: 'info' | 'error' | 'success';
}

export type JobStatus = 'running' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  logs: JobLog[];
  result: BuildDeployResult | null;
  error: string | null;
  workflowRunId: string | null;
  createdAt: number;
}

export interface JobPollResponse {
  status: JobStatus;
  newLogs: JobLog[];
  cursor: number;
  result: BuildDeployResult | null;
  error: string | null;
}

// ─── Step 01 — Market Scout ───────────────────────────────────────────────────

export interface MarketScoutInput {
  niche: string;
}

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

// ─── Step 02 — App Architect ──────────────────────────────────────────────────

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

export interface AppArchitectInput {
  niche: string;
  marketData: MarketScoutResult;
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

// ─── Step 03 — Logo Generator ─────────────────────────────────────────────────

export interface LogoGenInput {
  appName: string;
  niche: string;
  primaryColor: string;
}

export interface LogoFormats {
  '1024': string;
  '512': string;
  '192': string;
  '48': string;
}

export interface LogoGenResult {
  logoUrl: string;
  formats: LogoFormats;
}

// ─── Step 04 — Flutter Code Gen ───────────────────────────────────────────────

export interface CodeGenInput {
  appName: string;
  packageId: string;
  architecture: AppArchitectResult;
}

export interface CodeGenResult {
  files: {
    'lib/main.dart': string;
    'pubspec.yaml': string;
  };
}

// ─── Step 05 — Screenshots ────────────────────────────────────────────────────

export interface ScreenshotsInput {
  appName: string;
  architecture: AppArchitectResult;
  codeSnapshot: string;
}

export interface ScreenshotsResult {
  screenshots: string[];
}

// ─── Step 06 — ASO Optimizer ──────────────────────────────────────────────────

export interface ASOInput {
  appName: string;
  niche: string;
  marketData: MarketScoutResult;
  architecture: AppArchitectResult;
}

export interface ASOResult {
  title: string;
  shortDescription: string;
  longDescription: string;
  keywords: string[];
  whatNew: string;
}

// ─── Step 07 — Compliance Builder ─────────────────────────────────────────────

export interface ComplianceInput {
  appName: string;
  packageId: string;
  features: string[];
  primaryColor: string;
}

export interface DataSafetyEntry {
  dataType: string;
  purposes: string[];
  retention: string;
}

export interface ComplianceResult {
  policyUrl: string;
  html: string;
  dataSafety: {
    entries: DataSafetyEntry[];
    policyUrl: string;
  };
}

// ─── Step 08 — Build & Deploy ─────────────────────────────────────────────────

export interface BuildDeployInput {
  appName: string;
  packageId: string;
  architecture: AppArchitectResult;
  code: CodeGenResult;
  logo: LogoGenResult;
  screenshots: ScreenshotsResult;
  aso: ASOResult;
  compliance: ComplianceResult;
}

export interface BuildDeployResult {
  apkUrl: string;
  apkName: string;
  apkSize: number;
  playConsoleStatus: 'DRAFT';
  draftUrl: string;
  workflowRunUrl: string;
}

// ─── SSE ──────────────────────────────────────────────────────────────────────

export interface SSEMessage {
  msg: string;
  type: 'info' | 'success' | 'error';
}

export interface SSEDone<T> {
  type: 'done';
  data: T;
}

export interface SSEError {
  type: 'error';
  error: string;
}
