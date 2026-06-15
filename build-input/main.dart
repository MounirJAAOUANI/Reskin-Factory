import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await MobileAds.instance.initialize();
  runApp(const WealthFlowApp());
}

const Color kPrimary = Color(0xFF6366F1);

class WealthFlowApp extends StatefulWidget {
  const WealthFlowApp({super.key});
  @override
  State<WealthFlowApp> createState() => _WealthFlowAppState();
}

class _WealthFlowAppState extends State<WealthFlowApp> {
  int _currentIndex = 0;
  BannerAd? _bannerAd;
  bool _bannerReady = false;

  final List<Widget> _screens = const [
    OnboardingScreen(),
    DashboardScreen(),
    ExpenseScreen(),
    FamilyScreen(),
    ChallengesScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initRemoteConfig();
    _loadBannerAd();
  }

  Future<void> _initRemoteConfig() async {
    try {
      final remoteConfig = FirebaseRemoteConfig.instance;
      await remoteConfig.setConfigSettings(RemoteConfigSettings(
        fetchTimeout: const Duration(seconds: 10),
        minimumFetchInterval: const Duration(hours: 1),
      ));
      await remoteConfig.fetchAndActivate();
    } catch (_) {}
  }

  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) => setState(() => _bannerReady = true),
        onAdFailedToLoad: (ad, __) => ad.dispose(),
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WealthFlow',
      theme: ThemeData(
        colorSchemeSeed: kPrimary,
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: kPrimary,
          foregroundColor: Colors.white,
        ),
      ),
      home: Scaffold(
        body: Column(
          children: [
            Expanded(child: _screens[_currentIndex]),
            if (_bannerReady && _bannerAd != null)
              SizedBox(
                height: _bannerAd!.size.height.toDouble(),
                width: _bannerAd!.size.width.toDouble(),
                child: AdWidget(ad: _bannerAd!),
              ),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          selectedItemColor: kPrimary,
          unselectedItemColor: Colors.grey,
          type: BottomNavigationBarType.fixed,
          onTap: (i) => setState(() => _currentIndex = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.flag), label: 'Goals'),
            BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Expenses'),
            BottomNavigationBarItem(icon: Icon(Icons.group), label: 'Family'),
            BottomNavigationBarItem(icon: Icon(Icons.emoji_events), label: 'Challenges'),
          ],
        ),
      ),
    );
  }
}

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Onboarding & Goal Setup')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.savings, color: kPrimary),
              title: const Text('Save for Vacation'),
              subtitle: const Text('Target: \$3,000 by Dec 2025'),
              trailing: const Text('40%'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.home, color: kPrimary),
              title: const Text('Home Down Payment'),
              subtitle: const Text('Target: \$20,000 by Jun 2026'),
              trailing: const Text('15%'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.school, color: kPrimary),
              title: const Text('Education Fund'),
              subtitle: const Text('Target: \$10,000 by Jan 2027'),
              trailing: const Text('60%'),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white),
              onPressed: () {},
              child: const Text('Add New Goal'),
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard & AI Insights')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: kPrimary,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Text('Monthly Budget', style: TextStyle(color: Colors.white70)),
                SizedBox(height: 4),
                Text('\$4,200 / \$5,000', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.auto_awesome, color: kPrimary),
              title: const Text('AI Insight'),
              subtitle: const Text('You spend 30% more on dining on weekends. Consider meal prepping!'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.trending_up, color: Colors.green),
              title: const Text('Savings Rate'),
              subtitle: const Text('You saved 18% of income this month — above your 15% goal!'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.warning_amber, color: Colors.orange),
              title: const Text('Budget Alert'),
              subtitle: const Text('Entertainment budget 85% used with 10 days remaining.'),
            ),
          ),
        ],
      ),
    );
  }
}

class ExpenseScreen extends StatelessWidget {
  const ExpenseScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expense Entry')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: kPrimary,
        onPressed: () {},
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.red, child: Icon(Icons.restaurant, color: Colors.white)),
              title: const Text('Chipotle'),
              subtitle: const Text('Auto-categorized: Dining'),
              trailing: const Text('-\$14.50', style: TextStyle(color: Colors.red)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.blue, child: Icon(Icons.directions_car, color: Colors.white)),
              title: const Text('Shell Gas Station'),
              subtitle: const Text('Auto-categorized: Transport'),
              trailing: const Text('-\$52.00', style: TextStyle(color: Colors.red)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.green, child: Icon(Icons.shopping_cart, color: Colors.white)),
              title: const Text('Whole Foods'),
              subtitle: const Text('Auto-categorized: Groceries'),
              trailing: const Text('-\$87.30', style: TextStyle(color: Colors.red)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.purple, child: Icon(Icons.movie, color: Colors.white)),
              title: const Text('Netflix'),
              subtitle: const Text('Auto-categorized: Entertainment'),
              trailing: const Text('-\$15.99', style: TextStyle(color: Colors.red)),
            ),
          ),
        ],
      ),
    );
  }
}

class FamilyScreen extends StatelessWidget {
  const FamilyScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Family Collaboration Hub')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: kPrimary, child: Text('A', style: TextStyle(color: Colors.white))),
              title: const Text('Alex (You)'),
              subtitle: const Text('Spent \$1,240 this month'),
              trailing: const Icon(Icons.check_circle, color: Colors.green),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.teal, child: Text('J', style: TextStyle(color: Colors.white))),
              title: const Text('Jamie'),
              subtitle: const Text('Spent \$980 this month'),
              trailing: const Icon(Icons.check_circle, color: Colors.green),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(backgroundColor: Colors.orange, child: Text('S', style: TextStyle(color: Colors.white))),
              title: const Text('Sam'),
              subtitle: const Text('Allowance: \$200 / \$200 used'),
              trailing: const Icon(Icons.warning_amber, color: Colors.orange),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.add_circle_outline, color: kPrimary),
              title: const Text('Invite Family Member'),
              subtitle: const Text('Share budgets and goals together'),
              onTap: () {},
            ),
          ),
        ],
      ),
    );
  }
}

class ChallengesScreen extends StatelessWidget {
  const ChallengesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Savings Challenges')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.emoji_events, color: Colors.amber),
              title: const Text('No-Spend Weekend'),
              subtitle: const Text('Completed! Saved \$120 — Rank #3'),
              trailing: const Text('🥉', style: TextStyle(fontSize: 24)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.local_cafe, color: Colors.brown),
              title: const Text('Skip Coffee for 7 Days'),
              subtitle: const Text('5/7 days completed — Rank #1'),
              trailing: const Text('🥇', style: TextStyle(fontSize: 24)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.fitness_center, color: Colors.blue),
              title: const Text('Cook at Home Challenge'),
              subtitle: const Text('Potential savings: \$200 this month'),
              trailing: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
                onPressed: () {},
                child: const Text('Join', style: TextStyle(color: Colors.white)),
              ),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.leaderboard, color: kPrimary),
              title: const Text('Leaderboard — This Week'),
              subtitle: const Text('1. Jordan \$340  2. Riley \$290  3. You \$250'),
            ),
          ),
        ],
      ),
    );
  }
}