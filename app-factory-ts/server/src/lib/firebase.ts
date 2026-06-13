import admin from 'firebase-admin';
import { config, isDev } from '../config.js';

let initialized = false;

function getApp(): admin.app.App {
  if (!initialized) {
    const credential = admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    });
    admin.initializeApp({ credential });
    initialized = true;
  }
  return admin.app();
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

  const app = getApp();
  const remoteConfig = admin.remoteConfig(app);

  // Fetch existing template to get its etag, then build a clean parameter set
  const existing = await remoteConfig.getTemplate();

  const parameters: admin.remoteConfig.RemoteConfigTemplate['parameters'] = {
    ...existing.parameters,
  };

  for (const [key, value] of Object.entries(params)) {
    parameters[key] = {
      defaultValue: { value: String(value) },
      description: `Auto-generated for ${packageId}`,
      valueType: 'STRING',
    };
  }

  const template = remoteConfig.createTemplateFromJSON(
    JSON.stringify({
      parameters,
      parameterGroups: existing.parameterGroups ?? {},
      conditions: existing.conditions ?? [],
    })
  );

  const validated = await remoteConfig.validateTemplate(template);
  await remoteConfig.publishTemplate(validated);
  console.log(`[Firebase] Remote Config published for ${packageId}`);
}

export function buildRemoteConfigParams(packageId: string): RemoteConfigParams {
  return {
    admob_banner_id: 'ca-app-pub-3940256099942544/6300978111', // Test banner ID
    admob_interstitial_id: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial ID
    premium_price_usd: '2.99',
    feature_flags: JSON.stringify({
      show_ads: true,
      premium_enabled: true,
      dark_mode_default: false,
    }),
  };
}
