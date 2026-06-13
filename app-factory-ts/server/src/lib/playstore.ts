// google-play-scraper has no official @types, use dynamic import
import { isDev } from '../config.js';
import type { SSEHelper } from './sse.js';
import type { CompetitorApp } from '../types.js';

interface GPlayApp {
  appId: string;
  title: string;
  description: string;
  score: number;
  installs: string;
  ratings: number;
}

export async function scrapeCompetitors(
  niche: string,
  sse: SSEHelper
): Promise<CompetitorApp[]> {
  if (isDev) {
    sse.log('🔍 [DEV] Returning simulated competitor data', 'info');
    return Array.from({ length: 8 }, (_, i) => ({
      name: `${niche.charAt(0).toUpperCase() + niche.slice(1)} App ${i + 1}`,
      packageId: `com.example.${niche.replace(/\s+/g, '')}${i + 1}`,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      installs: `${(10 + i * 5)}K+`,
      reviews: Math.floor(1000 + Math.random() * 50000),
      description: `A popular ${niche} tracking application with millions of users worldwide.`,
    }));
  }

  sse.log(`🔍 Searching Play Store for "${niche}"...`, 'info');

  // Dynamic import to avoid ESM/CJS issues
  const gplay = await import('google-play-scraper');

  const results = (await gplay.default.search({
    term: niche,
    num: 50,
    lang: 'en',
    country: 'us',
  })) as GPlayApp[];

  sse.log(`📊 Found ${results.length} apps, analyzing top 10...`, 'info');

  const top10 = results.slice(0, 10);
  const competitors: CompetitorApp[] = top10.map((app) => ({
    name: app.title,
    packageId: app.appId,
    rating: app.score ?? 0,
    installs: app.installs ?? 'Unknown',
    reviews: app.ratings ?? 0,
    description: (app.description ?? '').slice(0, 300),
  }));

  sse.log(`✅ Extracted ${competitors.length} competitors`, 'success');
  return competitors;
}
