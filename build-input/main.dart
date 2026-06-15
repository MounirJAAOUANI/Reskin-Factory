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
  runApp(const FinMindApp());
}

const Color kPrimary = Color(0xFF6366F1);

class FinMindApp extends StatefulWidget {
  const FinMindApp({super.key});
  @override
  State<FinMindApp> createState() => _FinMindAppState();
}

class _FinMindAppState extends State<FinMindApp> {
  int _currentIndex = 0;
  BannerAd? _bannerAd;
  bool _bannerLoaded = false;
  bool _showOnboarding = true;

  final List<Widget> _screens = const [
    DashboardScreen(),
    ExpenseEntryScreen(),
    AIInsightsScreen(),
    SavingsGoalsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initRemoteConfig();
    _loadBannerAd();
    _checkOnboarding();
  }

  Future<void> _initRemoteConfig() async {
    try {
      final rc = FirebaseRemoteConfig.instance;
      await rc.setConfigSettings(RemoteConfigSettings(
        fetchTimeout: const Duration(seconds: 10),
        minimumFetchInterval: const Duration(hours: 1),
      ));
      await rc.fetchAndActivate();
    } catch (_) {}
  }

  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) => setState(() => _bannerLoaded = true),
        onAdFailedToLoad: (ad, __) => ad.dispose(),
      ),
    )..load();
  }

  Future<void> _checkOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    final seen = prefs.getBool('onboarding_seen') ?? false;
    setState(() => _showOnboarding = !seen);
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
    setState(() => _showOnboarding = false);
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FinMind',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kPrimary),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: kPrimary,
          foregroundColor: Colors.white,
        ),
      ),
      home: _showOnboarding
          ? OnboardingScreen(onDone: _completeOnboarding)
          : Scaffold(
              body: _screens[_currentIndex],
              bottomNavigationBar: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_bannerLoaded && _bannerAd != null)
                    SizedBox(
                      height: _bannerAd!.size.height.toDouble(),
                      width: _bannerAd!.size.width.toDouble(),
                      child: AdWidget(ad: _bannerAd!),
                    ),
                  BottomNavigationBar(
                    currentIndex: _currentIndex,
                    onTap: (i) => setState(() => _currentIndex = i),
                    selectedItemColor: kPrimary,
                    unselectedItemColor: Colors.grey,
                    type: BottomNavigationBarType.fixed,
                    items: const [
                      BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
                      BottomNavigationBarItem(icon: Icon(Icons.add_card), label: 'Expenses'),
                      BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'AI Insights'),
                      BottomNavigationBarItem(icon: Icon(Icons.savings), label: 'Goals'),
                    ],
                  ),
                ],
              ),
            ),
    );
  }
}

class OnboardingScreen extends StatelessWidget {
  final VoidCallback onDone;
  const OnboardingScreen({super.key, required this.onDone});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kPrimary,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.account_balance_wallet, size: 100, color: Colors.white),
              const SizedBox(height: 24),
              const Text('Welcome to FinMind', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 16),
              const Text('Smart finance tracking powered by AI. Track expenses, set goals, and get personalized insights.',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.white70)),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: onDone,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: kPrimary,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Get Started', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FinMind Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: kPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: const Padding(
              padding: EdgeInsets.all(24),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Total Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                SizedBox(height: 8),
                Text('\$12,450.00', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          const Text('This Month', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.green, child: Icon(Icons.arrow_downward, color: Colors.white)),
            title: const Text('Income'),
            trailing: const Text('\$5,200.00', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
          ),
          ListTile(
            leading: const CircleAvatar(backgroundColor: Colors.red, child: Icon(Icons.arrow_upward, color: Colors.white)),
            title: const Text('Expenses'),
            trailing: const Text('\$2,340.00', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
          ListTile(
            leading: const CircleAvatar(backgroundColor: kPrimary, child: Icon(Icons.savings, color: Colors.white)),
            title: const Text('Saved'),
            trailing: const Text('\$2,860.00', style: TextStyle(color: kPrimary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

class ExpenseEntryScreen extends StatelessWidget {
  const ExpenseEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final expenses = [
      {'label': 'Groceries', 'amount': '\$85.40', 'date': 'Today', 'icon': Icons.shopping_cart},
      {'label': 'Netflix', 'amount': '\$15.99', 'date': 'Yesterday', 'icon': Icons.tv},
      {'label': 'Gas Station', 'amount': '\$52.00', 'date': 'Dec 10', 'icon': Icons.local_gas_station},
      {'label': 'Restaurant', 'amount': '\$38.75', 'date': 'Dec 9', 'icon': Icons.restaurant},
    ];
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
          const Text('Recent Expenses', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...expenses.map((e) => Card(
                child: ListTile(
                  leading: CircleAvatar(backgroundColor: kPrimary.withOpacity(0.15), child: Icon(e['icon'] as IconData, color: kPrimary)),
                  title: Text(e['label'] as String),
                  subtitle: Text(e['date'] as String),
                  trailing: Text(e['amount'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              )),
        ],
      ),
    );
  }
}

class AIInsightsScreen extends StatelessWidget {
  const AIInsightsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Insights')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: kPrimary.withOpacity(0.1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: const ListTile(
              leading: Icon(Icons.auto_awesome, color: kPrimary),
              title: Text('Spending Alert', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('You spent 20% more on dining this month compared to last month.'),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: const ListTile(
              leading: Icon(Icons.lightbulb, color: Colors.amber),
              title: Text('Smart Tip', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Cutting subscriptions could save you \$45/month.'),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: const ListTile(
              leading: Icon(Icons.trending_up, color: Colors.green),
              title: Text('Savings Forecast', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('At your current rate, you will save \$34,000 by end of next year.'),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: const ListTile(
              leading: Icon(Icons.category, color: kPrimary),
              title: Text('Top Category', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Food & Dining accounts for 35% of your total spending.'),
            ),
          ),
        ],
      ),
    );
  }
}

class SavingsGoalsScreen extends StatelessWidget {
  const SavingsGoalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final goals = [
      {'name': 'Emergency Fund', 'current': 3000.0, 'target': 5000.0, 'icon': Icons.health_and_safety},
      {'name': 'Vacation', 'current': 1200.0, 'target': 3000.0, 'icon': Icons.flight},
      {'name': 'New Laptop', 'current': 800.0, 'target': 1500.0, 'icon': Icons.laptop},
      {'name': 'Home Down Payment', 'current': 15000.0, 'target': 50000.0, 'icon': Icons.home},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Savings Goals')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: kPrimary,
        onPressed: () {},
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: goals.map((g) {
          final progress = (g['current'] as double) / (g['target'] as double);
          return Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Icon(g['icon'] as IconData, color: kPrimary),
                  const SizedBox(width: 8),
                  Text(g['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Spacer(),
                  Text('${(progress * 100).toStringAsFixed(0)}%', style: const TextStyle(color: kPrimary, fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 8),
                LinearProgressIndicator(value: progress, backgroundColor: Colors.grey.shade200, color: kPrimary, minHeight: 8,
                    borderRadius: BorderRadius.circular(4)),
                const SizedBox(height: 4),
                Text('\$${(g['current'] as double).toStringAsFixed(0)} of \$${(g['target'] as double).toStringAsFixed(0)}',
                    style: const TextStyle(color: Colors.grey)),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }
}