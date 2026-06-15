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
  runApp(const SpendSmartApp());
}

class SpendSmartApp extends StatefulWidget {
  const SpendSmartApp({super.key});
  @override
  State<SpendSmartApp> createState() => _SpendSmartAppState();
}

class _SpendSmartAppState extends State<SpendSmartApp> {
  int _currentIndex = 0;
  BannerAd? _bannerAd;
  bool _bannerAdLoaded = false;
  final Color _primaryColor = const Color(0xFF2E7D32);

  final List<Widget> _screens = const [
    DashboardScreen(),
    BudgetPlannerScreen(),
    ExpenseTrackerScreen(),
    AnalyticsScreen(),
    SettingsScreen(),
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
    } catch (e) {
      debugPrint('Remote config error: $e');
    }
  }

  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) => setState(() => _bannerAdLoaded = true),
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          debugPrint('Banner ad failed: $error');
        },
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
      title: 'SpendSmart',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _primaryColor),
        appBarTheme: AppBarTheme(
          backgroundColor: _primaryColor,
          foregroundColor: Colors.white,
        ),
        useMaterial3: true,
      ),
      home: Scaffold(
        body: _screens[_currentIndex],
        bottomNavigationBar: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_bannerAdLoaded && _bannerAd != null)
              SizedBox(
                height: _bannerAd!.size.height.toDouble(),
                width: _bannerAd!.size.width.toDouble(),
                child: AdWidget(ad: _bannerAd!),
              ),
            BottomNavigationBar(
              currentIndex: _currentIndex,
              selectedItemColor: _primaryColor,
              unselectedItemColor: Colors.grey,
              type: BottomNavigationBarType.fixed,
              onTap: (index) => setState(() => _currentIndex = index),
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
                BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'Budget'),
                BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Expenses'),
                BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Analytics'),
                BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
              ],
            ),
          ],
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
      appBar: AppBar(title: const Text('Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.account_balance, color: Color(0xFF2E7D32)),
              title: const Text('Total Balance'),
              subtitle: const Text('\$4,250.00'),
              trailing: const Icon(Icons.arrow_forward_ios),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.trending_down, color: Colors.red),
              title: const Text('Monthly Spending'),
              subtitle: const Text('\$1,320.50'),
              trailing: const Icon(Icons.arrow_forward_ios),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.savings, color: Color(0xFF2E7D32)),
              title: const Text('Savings This Month'),
              subtitle: const Text('\$530.00'),
              trailing: const Icon(Icons.arrow_forward_ios),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.warning_amber, color: Colors.orange),
              title: const Text('Budget Alert'),
              subtitle: const Text('Food budget 80% used'),
              trailing: const Icon(Icons.arrow_forward_ios),
            ),
          ),
        ],
      ),
    );
  }
}

class BudgetPlannerScreen extends StatelessWidget {
  const BudgetPlannerScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Budget Planner')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.restaurant, color: Color(0xFF2E7D32)),
              title: const Text('Food & Dining'),
              subtitle: const Text('\$400 / \$500 budget'),
              trailing: const Text('80%', style: TextStyle(color: Colors.orange)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.directions_car, color: Color(0xFF2E7D32)),
              title: const Text('Transportation'),
              subtitle: const Text('\$150 / \$300 budget'),
              trailing: const Text('50%', style: TextStyle(color: Color(0xFF2E7D32))),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.movie, color: Color(0xFF2E7D32)),
              title: const Text('Entertainment'),
              subtitle: const Text('\$200 / \$200 budget'),
              trailing: const Text('100%', style: TextStyle(color: Colors.red)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.home, color: Color(0xFF2E7D32)),
              title: const Text('Housing'),
              subtitle: const Text('\$900 / \$1000 budget'),
              trailing: const Text('90%', style: TextStyle(color: Colors.orange)),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF2E7D32),
        onPressed: () {},
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class ExpenseTrackerScreen extends StatelessWidget {
  const ExpenseTrackerScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expense Tracker')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF2E7D32),
                child: Icon(Icons.local_grocery_store, color: Colors.white),
              ),
              title: const Text('Grocery Shopping'),
              subtitle: const Text('Dec 10, 2024'),
              trailing: const Text('-\$85.30', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF2E7D32),
                child: Icon(Icons.local_gas_station, color: Colors.white),
              ),
              title: const Text('Gas Station'),
              subtitle: const Text('Dec 9, 2024'),
              trailing: const Text('-\$45.00', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF2E7D32),
                child: Icon(Icons.coffee, color: Colors.white),
              ),
              title: const Text('Coffee Shop'),
              subtitle: const Text('Dec 9, 2024'),
              trailing: const Text('-\$6.75', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
          ),
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.blue,
                child: Icon(Icons.attach_money, color: Colors.white),
              ),
              title: const Text('Salary Deposit'),
              subtitle: const Text('Dec 1, 2024'),
              trailing: const Text('+\$3,200.00', style: TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF2E7D32),
        onPressed: () {},
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Spending by Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _buildCategoryRow('Food', 0.4, Colors.red),
                  _buildCategoryRow('Housing', 0.3, Colors.blue),
                  _buildCategoryRow('Transport', 0.15, Colors.orange),
                  _buildCategoryRow('Entertainment', 0.15, Colors.purple),
                ],
              ),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.trending_up, color: Color(0xFF2E7D32)),
              title: const Text('Monthly Comparison'),
              subtitle: const Text('You spent 12% less than last month'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.emoji_events, color: Colors.amber),
              title: const Text('Savings Goal'),
              subtitle: const Text('65% of \$2,000 annual goal reached'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryRow(String label, double value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label)),
          Expanded(child: LinearProgressIndicator(value: value, color: color, backgroundColor: Colors.grey[200])),
          const SizedBox(width: 8),
          Text('${(value * 100).toInt()}%'),
        ],
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.person, color: Color(0xFF2E7D32)),
            title: const Text('Profile'),
            subtitle: const Text('Manage your account details'),
            trailing: const Icon(Icons.arrow_forward_ios),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.notifications, color: Color(0xFF2E7D32)),
            title: const Text('Notifications'),
            subtitle: const Text('Budget alerts and reminders'),
            trailing: const Icon(Icons.arrow_forward_ios),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.currency_exchange, color: Color(0xFF2E7D32)),
            title: const Text('Currency'),
            subtitle: const Text('USD - US Dollar'),
            trailing: const Icon(Icons.arrow_forward_ios),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.star, color: Color(0xFF2E7D32)),
            title: const Text('Upgrade to Premium'),
            subtitle: const Text('Remove ads and unlock features'),
            trailing: const Icon(Icons.arrow_forward_ios),
            onTap: () async {
              final InAppPurchase iap = InAppPurchase.instance;
              final bool available = await iap.isAvailable();
              debugPrint('IAP available: $available');
            },
          ),
        ],
      ),
    );
  }
}