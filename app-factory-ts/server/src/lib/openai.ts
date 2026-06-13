import OpenAI from 'openai';
import sharp from 'sharp';
import { config, isDev } from '../config.js';
import type { SSEHelper } from './sse.js';
import type { LogoGenResult, LogoFormats } from '../types.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

// 1x1 purple PNG used as placeholder in dev mode
const DEV_PLACEHOLDER_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function resizeToBase64(buffer: Buffer, size: number): Promise<string> {
  const resized = await sharp(buffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
  return resized.toString('base64');
}

export async function generateLogo(
  imagePrompt: string,
  sse: SSEHelper
): Promise<LogoGenResult> {
  if (isDev) {
    sse.log('🖼️ [DEV] Returning placeholder logo (skipping OpenAI call)', 'info');
    const formats: LogoFormats = {
      '1024': DEV_PLACEHOLDER_B64,
      '512': DEV_PLACEHOLDER_B64,
      '192': DEV_PLACEHOLDER_B64,
      '48': DEV_PLACEHOLDER_B64,
    };
    return { logoUrl: `data:image/png;base64,${DEV_PLACEHOLDER_B64}`, formats };
  }

  sse.log('🎨 Generating logo with DALL-E...', 'info');
  const response = await getClient().images.generate({
    model: 'gpt-image-1',
    prompt: imagePrompt,
    n: 1,
    size: '1024x1024',
  });

  const item = response.data?.[0] as { b64_json?: string; url?: string } | undefined;
  let buffer: Buffer;

  if (item?.b64_json) {
    buffer = Buffer.from(item.b64_json, 'base64');
  } else if (item?.url) {
    sse.log('⬇️ Downloading generated image...', 'info');
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error('OpenAI returned no image data');
  }

  const b64 = buffer.toString('base64');

  sse.log('🔧 Resizing logo to multiple formats...', 'info');

  const [f512, f192, f48] = await Promise.all([
    resizeToBase64(buffer, 512),
    resizeToBase64(buffer, 192),
    resizeToBase64(buffer, 48),
  ]);

  const formats: LogoFormats = {
    '1024': b64,
    '512': f512,
    '192': f192,
    '48': f48,
  };

  sse.log('✅ Logo generated in 4 sizes', 'success');
  return {
    logoUrl: `data:image/png;base64,${b64}`,
    formats,
  };
}
