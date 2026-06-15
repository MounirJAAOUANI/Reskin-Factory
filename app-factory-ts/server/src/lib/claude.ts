import Anthropic from '@anthropic-ai/sdk';
import { config, isDev } from '../config.js';
import type { SSEHelper } from './sse.js';
import type {
  MarketScoutResult,
  AppArchitectResult,
  ASOResult,
  CompetitorApp,
} from '../types.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

async function ask(prompt: string, systemPrompt?: string, maxTokens = 4096, model = 'claude-haiku-4-5-20251001'): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  const res = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt ?? 'You are an expert mobile app developer and ASO specialist. Always respond with valid JSON when asked.',
    messages,
  });
  const block = res.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Claude response type');
  return block.text;
}

function extractJSON<T>(raw: string): T {
  const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/) ?? raw.match(/(\{[\s\S]+\})/);
  const jsonStr = match ? match[1] : raw;
  return JSON.parse(jsonStr.trim()) as T;
}

// ─── Market Scout ─────────────────────────────────────────────────────────────

export async function analyzeMarket(
  niche: string,
  competitors: CompetitorApp[],
  sse: SSEHelper
): Promise<MarketScoutResult> {
  if (isDev) {
    sse.log('🔬 [DEV] Returning simulated market analysis', 'info');
    return {
      recommendation: 'GO',
      topCompetitors: competitors.slice(0, 8),
      nicheGap: 'No offline-first solution exists in the top 10',
      suggestedDifferentiator: 'Minimalist design with full offline support',
      targetKeywords: ['habit tracker', 'daily goals', 'routine builder', 'productivity', 'streak counter'],
    };
  }

  sse.log('🤖 Analyzing market with Claude...', 'info');
  const prompt = `You are analyzing the "${niche}" app market on Google Play.

Here are the top ${competitors.length} competitors:
${JSON.stringify(competitors, null, 2)}

Analyze the niche saturation and return a JSON object with this exact shape:
{
  "recommendation": "GO" | "CAUTION" | "NO-GO",
  "topCompetitors": [ // top 8 from the list, with same fields
    { "name": string, "packageId": string, "rating": number, "installs": string, "reviews": number, "description": string }
  ],
  "nicheGap": "string describing what's missing in current apps",
  "suggestedDifferentiator": "string with concrete differentiation strategy",
  "targetKeywords": ["keyword1", "keyword2", ...] // 5-8 keywords
}`;

  const raw = await ask(prompt);
  return extractJSON<MarketScoutResult>(raw);
}

// ─── App Architect ────────────────────────────────────────────────────────────

export async function designArchitecture(
  niche: string,
  marketData: MarketScoutResult,
  sse: SSEHelper
): Promise<AppArchitectResult> {
  if (isDev) {
    sse.log('🏗️ [DEV] Returning simulated architecture', 'info');
    return {
      appName: 'HabitFlow',
      tagline: 'Build streaks, not excuses',
      packageId: 'com.appfactory.habitflow',
      screens: ['HomeScreen', 'HabitDetailScreen', 'StatsScreen', 'SettingsScreen', 'OnboardingScreen'],
      features: ['offline-first', 'push-notifications', 'widgets', 'dark-mode', 'iap', 'google-ads', 'firebase'],
      theme: {
        primaryColor: '#7C3AED',
        secondaryColor: '#059669',
        backgroundColor: '#0D0D17',
        fontFamily: 'Poppins',
      },
      iosTarget: '14.0',
      androidTarget: 31,
    };
  }

  sse.log('🤖 Designing app architecture with Claude...', 'info');
  const prompt = `Design a Flutter app for the "${niche}" niche.

Market analysis: ${JSON.stringify(marketData, null, 2)}

Return a JSON object with exactly this shape:
{
  "appName": "Catchy2WordName",
  "tagline": "Short tagline under 80 characters",
  "packageId": "com.appfactory.lowercasename",
  "screens": ["Screen1", "Screen2", "Screen3", "Screen4", "Screen5"],
  "features": ["offline-first", "push-notifications", ...], // include "google-ads", "firebase", "iap"
  "theme": {
    "primaryColor": "#HEXCOLOR",
    "secondaryColor": "#HEXCOLOR",
    "backgroundColor": "#HEXCOLOR",
    "fontFamily": "Poppins" or "Roboto"
  },
  "iosTarget": "14.0",
  "androidTarget": 31
}`;

  const raw = await ask(prompt);
  return extractJSON<AppArchitectResult>(raw);
}

// ─── Logo Prompt Generator ────────────────────────────────────────────────────

export async function generateLogoPrompt(
  appName: string,
  niche: string,
  primaryColor: string,
  sse: SSEHelper
): Promise<string> {
  if (isDev) {
    sse.log('🎨 [DEV] Returning simulated logo prompt', 'info');
    return `A minimalist ${niche} app icon for "${appName}", flat design, ${primaryColor} primary color, white background, simple geometric shapes, professional mobile app store icon style, no text`;
  }

  sse.log('🤖 Generating logo prompt with Claude...', 'info');
  const prompt = `Generate a DALL-E image prompt for an app icon.
App name: ${appName}
Niche: ${niche}
Primary color: ${primaryColor}

Write a concise, effective image generation prompt (2-3 sentences) for a professional app store icon.
Focus on: minimalist design, ${primaryColor} as dominant color, flat 2D style, no text, clean background.
Return ONLY the prompt text, no JSON.`;

  return await ask(prompt, 'You are an expert at writing AI image generation prompts for app icons.');
}

// ─── ASO Optimizer ───────────────────────────────────────────────────────────

export async function generateASO(
  appName: string,
  niche: string,
  marketData: MarketScoutResult,
  architecture: AppArchitectResult,
  sse: SSEHelper
): Promise<ASOResult> {
  if (isDev) {
    sse.log('📝 [DEV] Returning simulated ASO content', 'info');
    return {
      title: `${appName} - ${niche.charAt(0).toUpperCase() + niche.slice(1)} Tracker`,
      shortDescription: `Track your ${niche} goals offline. Simple, fast, powerful.`,
      longDescription: `${appName} is the most intuitive ${niche} app on the Play Store.\n\n✅ FEATURES\n• Offline-first: works without internet\n• Beautiful statistics and streak tracking\n• Customizable reminders\n• Dark mode support\n\n📊 TRACK WHAT MATTERS\nBuild lasting habits with our proven system. Join thousands of users who've transformed their daily routines.\n\n🔒 PRIVACY FIRST\nYour data stays on your device. No account required.\n\nDownload now and start building better habits today!`,
      keywords: [`${niche} tracker`, `${niche} app`, 'habit builder', 'daily goals', 'streak tracker', 'productivity', 'routine', 'self improvement', 'goal setting', 'daily planner', 'task manager', 'wellness', 'motivation'],
      whatNew: 'v1.0.0 - Initial release! Start tracking your habits today.',
    };
  }

  sse.log('🤖 Generating ASO content with Claude...', 'info');
  const prompt = `Generate Google Play Store listing for "${appName}" (${niche} app).

Architecture: ${JSON.stringify({ features: architecture.features, screens: architecture.screens }, null, 2)}
Market keywords: ${marketData.targetKeywords.join(', ')}
Differentiator: ${marketData.suggestedDifferentiator}

Return JSON:
{
  "title": "AppName - Descriptor" (max 50 chars),
  "shortDescription": "One line value prop" (max 80 chars),
  "longDescription": "Full marketing copy with emojis and sections" (max 4000 chars),
  "keywords": ["keyword1", ...], // exactly 13 keywords
  "whatNew": "v1.0: Initial launch"
}`;

  const raw = await ask(prompt);
  return extractJSON<ASOResult>(raw);
}

// ─── Flutter Code Generator ───────────────────────────────────────────────────

export async function generateFlutterCode(
  appName: string,
  packageId: string,
  architecture: AppArchitectResult,
  sse: SSEHelper
): Promise<string> {
  if (isDev) {
    sse.log('💻 [DEV] Returning simulated Flutter code', 'info');
    return generateMockDart(appName, packageId, architecture);
  }

  sse.log('🤖 Generating Flutter code with Claude...', 'info');
  const screensCode = architecture.screens.map(screen => `
class ${screen} extends StatelessWidget {
  const ${screen}({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('${screen.replace('Screen', '')}')),
      body: const Center(child: Text('${screen}')),
    );
  }
}`).join('\n');

  const ALLOWED_PACKAGES = [
    'flutter/material.dart',
    'flutter/cupertino.dart',
    'google_mobile_ads/google_mobile_ads.dart',
    'firebase_core/firebase_core.dart',
    'firebase_remote_config/firebase_remote_config.dart',
    'in_app_purchase/in_app_purchase.dart',
    'shared_preferences/shared_preferences.dart',
    'intl/intl.dart',
    'dart:io',
    'dart:async',
    'dart:convert',
  ];

  const screenNames = architecture.screens.slice(0, 5);
  const color = architecture.theme.primaryColor.replace('#', '');

  const prompt = `Generate a Flutter main.dart for "${appName}" (package: ${packageId}).
Color: #${color}. Screens: ${screenNames.join(', ')}.

Rules:
- Imports: ONLY flutter/material.dart, google_mobile_ads/google_mobile_ads.dart, firebase_core/firebase_core.dart, firebase_remote_config/firebase_remote_config.dart, in_app_purchase/in_app_purchase.dart, shared_preferences/shared_preferences.dart, dart:io
- void main() async: WidgetsFlutterBinding.ensureInitialized(), Firebase.initializeApp(), MobileAds.instance.initialize(), then runApp
- One StatefulWidget app class with BottomNavigationBar (5 tabs)
- In initState: fetch FirebaseRemoteConfig, load BannerAd (test ID ca-app-pub-3940256099942544/6300978111)
- Each screen: StatelessWidget, returns Scaffold with AppBar + body (a ListView with 3-4 relevant ListTile or Card widgets, hardcoded data is fine)
- Keep each screen body CONCISE — max 30 lines per screen
- No Icons that don't exist in Flutter material icons
- Return ONLY valid Dart code, no markdown.`;

  const code = await ask(prompt, 'You are a Flutter developer. Write concise, complete, compilable Dart code.', 6000, 'claude-sonnet-4-6');
  const match = code.match(/```dart\s*([\s\S]+?)```/) ?? code.match(/(import[\s\S]+)/);
  return match ? match[1].trim() : code.trim();
}

function generateMockDart(appName: string, packageId: string, architecture: AppArchitectResult): string {
  const screens = architecture.screens;
  return `import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await MobileAds.instance.initialize();
  runApp(const ${appName.replace(/\s+/g, '')}App());
}

class ${appName.replace(/\s+/g, '')}App extends StatelessWidget {
  const ${appName.replace(/\s+/g, '')}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${appName}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF${architecture.theme.primaryColor.replace('#', '')})),
        useMaterial3: true,
        fontFamily: '${architecture.theme.fontFamily}',
      ),
      home: const MainScaffold(),
    );
  }
}

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});
  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _selectedIndex = 0;
  final List<Widget> _screens = [
${screens.map(s => `    const ${s}(),`).join('\n')}
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: const [
${screens.map((s, i) => `          NavigationDestination(icon: Icon(Icons.circle_outlined), label: '${s.replace('Screen', '')}'),`).join('\n')}
        ],
      ),
    );
  }
}

${screens.map(s => `
class ${s} extends StatelessWidget {
  const ${s}({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('${s}', style: Theme.of(context).textTheme.headlineMedium),
      ),
    );
  }
}`).join('\n')}
`;
}
