import { google } from 'googleapis';
import { config, isDev } from '../config.js';

export async function uploadToPlayConsole(aabBuffer: Buffer): Promise<string> {
  if (isDev) {
    return 'https://play.google.com/console/u/0/developers/dev/app-list';
  }

  const packageName = config.googlePlay.packageId;
  const serviceAccount = JSON.parse(config.googlePlay.serviceAccount) as object;

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidpublisher = google.androidpublisher({ version: 'v3', auth });

  // 1. Create edit
  const editRes = await androidpublisher.edits.insert({ packageName });
  const editId = editRes.data.id;
  if (!editId) throw new Error('Failed to create Play Console edit');

  // 2. Upload AAB
  const { Readable } = await import('stream');
  const stream = Readable.from(aabBuffer);

  await androidpublisher.edits.bundles.upload({
    packageName,
    editId,
    media: { mimeType: 'application/octet-stream', body: stream },
  });

  // 3. Set release track as DRAFT (internal)
  await androidpublisher.edits.tracks.update({
    packageName,
    editId,
    track: 'internal',
    requestBody: {
      track: 'internal',
      releases: [{ status: 'draft', versionCodes: [] }],
    },
  });

  // 4. Commit edit
  await androidpublisher.edits.commit({ packageName, editId });

  return `https://play.google.com/console/u/0/developers/0/app-list`;
}
