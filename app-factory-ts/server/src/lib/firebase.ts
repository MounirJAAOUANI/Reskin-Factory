import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { config, isDev } from '../config.js';

function getApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });
  }
  return getApps()[0]!;
}

export interface RemoteConfigParams {
  admob_banner_id: string;
  admob_interstitial_id: string;
  premium_price_usd: string;
  feature_flags: string;
}

export async function publishRemoteConfig(
  params: RemoteConfigParams,
  packageId: string
): Promise<void> {
  if (isDev) {
    console.log('[Firebase] [DEV] Skipping Remote Config publish');
    return;
  }

  const rc = getRemoteConfig(getApp());

  const existing = await rc.getTemplate();

  const merged = {
    parameters: { ...existing.parameters } as Record<string, object>,
    parameterGroups: existing.parameterGroups ?? {},
    conditions: existing.conditions ?? [],
  };

  for (const [key, value] of Object.entries(params)) {
    merged.parameters[key] = {
      defaultValue: { value: String(value) },
      description: `Auto-generated for ${packageId}`,
      valueType: 'STRING',
    };
  }

  const template = rc.createTemplateFromJSON(JSON.stringify(merged));
  const validated = await rc.validateTemplate(template);
  await rc.publishTemplate(validated);
  console.log(`[Firebase] Remote Config published for ${packageId}`);
}

export function buildRemoteConfigParams(packageId: string): RemoteConfigParams {
  return {
    admob_banner_id: 'ca-app-pub-3940256099942544/6300978111',
    admob_interstitial_id: 'ca-app-pub-3940256099942544/1033173712',
    premium_price_usd: '2.99',
    feature_flags: JSON.stringify({
      show_ads: true,
      premium_enabled: true,
      dark_mode_default: false,
    }),
  };
}
