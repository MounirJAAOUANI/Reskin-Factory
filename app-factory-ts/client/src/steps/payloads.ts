import type {
  MarketScoutResult,
  AppArchitectResult,
  LogoGenResult,
  CodeGenResult,
  ScreenshotsResult,
  ASOResult,
  ComplianceResult,
} from '../types';

export function buildMarketScoutPayload(niche: string): object {
  return { niche };
}

export function buildAppArchitectPayload(niche: string, marketData: MarketScoutResult): object {
  return { niche, marketData };
}

export function buildLogoGenPayload(architecture: AppArchitectResult, niche: string): object {
  return {
    appName: architecture.appName,
    niche,
    primaryColor: architecture.theme.primaryColor,
  };
}

export function buildCodeGenPayload(architecture: AppArchitectResult): object {
  return {
    appName: architecture.appName,
    packageId: architecture.packageId,
    architecture,
  };
}

export function buildScreenshotsPayload(
  architecture: AppArchitectResult,
  codeGen: CodeGenResult
): object {
  return {
    appName: architecture.appName,
    architecture,
    codeSnapshot: codeGen.files['lib/main.dart'].slice(0, 500),
  };
}

export function buildASOPayload(
  architecture: AppArchitectResult,
  niche: string,
  marketData: MarketScoutResult
): object {
  return {
    appName: architecture.appName,
    niche,
    marketData,
    architecture,
  };
}

export function buildCompliancePayload(architecture: AppArchitectResult): object {
  return {
    appName: architecture.appName,
    packageId: architecture.packageId,
    features: architecture.features,
    primaryColor: architecture.theme.primaryColor,
  };
}

export function buildBuildDeployPayload(
  architecture: AppArchitectResult,
  code: CodeGenResult,
  logo: LogoGenResult,
  screenshots: ScreenshotsResult,
  aso: ASOResult,
  compliance: ComplianceResult
): object {
  return {
    appName: architecture.appName,
    packageId: architecture.packageId,
    architecture,
    code,
    logo,
    screenshots,
    aso,
    compliance,
  };
}
