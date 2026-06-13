import sharp from 'sharp';
import { isDev } from '../config.js';
import type { SSEHelper } from './sse.js';
import type { AppArchitectResult } from '../types.js';

// Pixel 9 proportions: 1440×3120
const VIEWPORT_W = 1440;
const VIEWPORT_H = 3120;

function generateScreenHTML(
  screenName: string,
  index: number,
  appName: string,
  theme: AppArchitectResult['theme']
): string {
  const { primaryColor, secondaryColor, backgroundColor, fontFamily } = theme;
  const displayName = screenName.replace('Screen', '');

  const contents = [
    // Home screen
    `<div class="hero"><div class="icon">🏠</div><h1>${appName}</h1><p class="tagline">Your daily companion</p>
     <div class="card"><h3>Today's Progress</h3><div class="progress-bar"><div class="progress-fill" style="width:73%"></div></div><p>7 / 10 habits completed</p></div>
     <div class="grid"><div class="stat"><span class="num">7</span><span class="label">Day Streak</span></div><div class="stat"><span class="num">73%</span><span class="label">Completion</span></div><div class="stat"><span class="num">24</span><span class="label">Total Done</span></div></div></div>`,
    // Detail screen
    `<div class="hero"><div class="icon">📊</div><h1>${displayName}</h1><p class="tagline">Track your progress</p>
     ${Array.from({ length: 5 }, (_, i) => `<div class="list-item"><span class="check">✓</span><span>Goal ${i + 1}</span><span class="badge">${70 + i * 5}%</span></div>`).join('')}</div>`,
    // Stats screen
    `<div class="hero"><div class="icon">📈</div><h1>Statistics</h1><p class="tagline">Your achievements</p>
     <div class="chart-placeholder">📉 Weekly Chart</div>
     <div class="grid"><div class="stat"><span class="num">30</span><span class="label">Best Streak</span></div><div class="stat"><span class="num">156</span><span class="label">Total Days</span></div></div></div>`,
    // Settings screen
    `<div class="hero"><div class="icon">⚙️</div><h1>Settings</h1><p class="tagline">Customize your experience</p>
     ${['Notifications', 'Dark Mode', 'Language', 'Privacy', 'Premium'].map(s => `<div class="list-item"><span>${s}</span><span class="chevron">›</span></div>`).join('')}</div>`,
    // Onboarding screen
    `<div class="hero center"><div class="icon big">🚀</div><h1>Welcome to<br>${appName}</h1><p class="tagline">Build habits that last a lifetime</p>
     <div class="cta-btn" style="background:${primaryColor}">Get Started →</div></div>`,
  ];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${VIEWPORT_W}px; height: ${VIEWPORT_H}px; overflow: hidden;
    background: ${backgroundColor};
    color: #fff;
    font-family: '${fontFamily}', -apple-system, sans-serif;
    display: flex; flex-direction: column;
  }
  .status-bar { height: 80px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: space-between; padding: 0 60px; font-size: 36px; }
  .nav-bar { height: 120px; background: rgba(255,255,255,0.05); display: flex; align-items: center; padding: 0 60px; border-bottom: 2px solid rgba(255,255,255,0.1); }
  .nav-bar h2 { font-size: 52px; font-weight: 700; color: ${primaryColor}; }
  .content { flex: 1; padding: 80px 60px; overflow: hidden; }
  .hero { text-align: left; }
  .hero.center { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
  .icon { font-size: 120px; margin-bottom: 40px; }
  .icon.big { font-size: 200px; }
  h1 { font-size: 96px; font-weight: 800; margin-bottom: 24px; line-height: 1.1; }
  .tagline { font-size: 48px; color: rgba(255,255,255,0.6); margin-bottom: 80px; }
  .card { background: rgba(255,255,255,0.08); border-radius: 40px; padding: 60px; margin-bottom: 60px; }
  .card h3 { font-size: 48px; margin-bottom: 40px; color: ${secondaryColor}; }
  .progress-bar { background: rgba(255,255,255,0.2); border-radius: 20px; height: 24px; margin-bottom: 24px; }
  .progress-fill { background: ${primaryColor}; height: 100%; border-radius: 20px; }
  .progress-bar + p { font-size: 40px; color: rgba(255,255,255,0.7); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 40px; }
  .stat { background: rgba(255,255,255,0.08); border-radius: 32px; padding: 48px; text-align: center; }
  .stat .num { display: block; font-size: 80px; font-weight: 800; color: ${primaryColor}; }
  .stat .label { display: block; font-size: 36px; color: rgba(255,255,255,0.6); margin-top: 8px; }
  .list-item { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.06); border-radius: 24px; padding: 48px 56px; margin-bottom: 24px; font-size: 48px; }
  .check { color: ${secondaryColor}; font-size: 56px; margin-right: 24px; }
  .badge { background: ${primaryColor}; color: #fff; border-radius: 16px; padding: 8px 24px; font-size: 36px; }
  .chevron { color: rgba(255,255,255,0.4); font-size: 72px; }
  .chart-placeholder { background: rgba(255,255,255,0.08); border-radius: 40px; padding: 120px; text-align: center; font-size: 72px; margin: 40px 0 80px; }
  .cta-btn { display: inline-block; border-radius: 48px; padding: 48px 120px; font-size: 64px; font-weight: 700; margin-top: 80px; color: #fff; }
  .bottom-nav { height: 160px; background: rgba(255,255,255,0.05); display: flex; border-top: 2px solid rgba(255,255,255,0.1); }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; font-size: 32px; color: rgba(255,255,255,0.4); }
  .nav-item.active { color: ${primaryColor}; }
  .nav-item span:first-child { font-size: 60px; }
</style>
</head>
<body>
  <div class="status-bar">
    <span>9:41</span>
    <span>📶 🔋</span>
  </div>
  <div class="nav-bar"><h2>${appName}</h2></div>
  <div class="content">${contents[index] ?? contents[0]}</div>
  <div class="bottom-nav">
    <div class="nav-item ${index === 0 ? 'active' : ''}"><span>🏠</span><span>Home</span></div>
    <div class="nav-item ${index === 1 ? 'active' : ''}"><span>📋</span><span>Detail</span></div>
    <div class="nav-item ${index === 2 ? 'active' : ''}"><span>📊</span><span>Stats</span></div>
    <div class="nav-item ${index === 3 ? 'active' : ''}"><span>⚙️</span><span>Settings</span></div>
    <div class="nav-item ${index === 4 ? 'active' : ''}"><span>✨</span><span>More</span></div>
  </div>
</body>
</html>`;
}

async function addDeviceFrame(buffer: Buffer): Promise<Buffer> {
  // Add a simple rounded-rect phone frame using Sharp composite
  const frameOverlay = await sharp({
    create: {
      width: VIEWPORT_W + 80,
      height: VIEWPORT_H + 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  return sharp(frameOverlay)
    .composite([
      {
        input: buffer,
        top: 80,
        left: 40,
      },
    ])
    .png()
    .toBuffer();
}

export async function captureScreenshots(
  appName: string,
  architecture: AppArchitectResult,
  sse: SSEHelper
): Promise<string[]> {
  if (isDev) {
    sse.log('📸 [DEV] Generating placeholder screenshots (Puppeteer skipped)', 'info');
    // Return 5 tiny placeholder PNGs
    const placeholders = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const buf = await sharp({
          create: {
            width: 100,
            height: 200,
            channels: 3,
            background: { r: 124 + i * 10, g: 58, b: 237 },
          },
        })
          .png()
          .toBuffer();
        return buf.toString('base64');
      })
    );
    return placeholders;
  }

  sse.log('🚀 Launching Puppeteer...', 'info');
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    executablePath: process.env['PUPPETEER_EXECUTABLE_PATH'],
  });

  const screenshots: string[] = [];

  try {
    for (let i = 0; i < architecture.screens.length; i++) {
      const screenName = architecture.screens[i] ?? `Screen${i + 1}`;
      sse.log(`📸 Capturing screenshot ${i + 1}/5: ${screenName}...`, 'info');

      const page = await browser.newPage();
      await page.setViewport({ width: VIEWPORT_W, height: VIEWPORT_H });

      const html = generateScreenHTML(screenName, i, appName, architecture.theme);
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const buffer = await page.screenshot({ type: 'png' });
      await page.close();

      const framedBuffer = await addDeviceFrame(Buffer.from(buffer));
      screenshots.push(framedBuffer.toString('base64'));
    }
  } finally {
    await browser.close();
  }

  sse.log(`✅ ${screenshots.length} screenshots captured`, 'success');
  return screenshots;
}
