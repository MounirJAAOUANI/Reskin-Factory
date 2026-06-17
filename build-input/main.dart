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
  runApp(const HabitForgeApp());
}

const Color primaryColor = Color(0xFF6366F1);

class HabitForgeApp extends StatefulWidget {
  const HabitForgeApp({super.key});
  @override
  State<HabitForgeApp> createState() => _HabitForgeAppState();
}

class _HabitForgeAppState extends State<HabitForgeApp> {
  int _currentIndex = 0;
  BannerAd? _bannerAd;
  bool _bannerLoaded = false;

  final List<Widget> _screens = const [
    OnboardingScreen(),
    DashboardScreen(),
    HabitCreationScreen(),
    ProgressTrackingScreen(),
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

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HabitForge',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
        ),
      ),
      home: Scaffold(
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
              selectedItemColor: primaryColor,
              unselectedItemColor: Colors.grey,
              type: BottomNavigationBarType.fixed,
              onTap: (index) => setState(() => _currentIndex = index),
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.start), label: 'Onboarding'),
                BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
                BottomNavigationBarItem(icon: Icon(Icons.add_circle), label: 'Create'),
                BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Progress'),
                BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
              ],
            ),
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
      appBar: AppBar(title: const Text('Welcome to HabitForge')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(child: ListTile(leading: Icon(Icons.flag, color: primaryColor), title: Text('Set Your Goals'), subtitle: Text('Define what you want to achieve daily.'))),
          Card(child: ListTile(leading: Icon(Icons.track_changes, color: primaryColor), title: Text('Track Progress'), subtitle: Text('Monitor your streaks and milestones.'))),
          Card(child: ListTile(leading: Icon(Icons.notifications_active, color: primaryColor), title: Text('Stay Reminded'), subtitle: Text('Get timely nudges to keep going.'))),
          Card(child: ListTile(leading: Icon(Icons.emoji_events, color: primaryColor), title: Text('Earn Rewards'), subtitle: Text('Unlock badges as you build habits.'))),
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
      appBar: AppBar(title: const Text('Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(child: ListTile(leading: Icon(Icons.local_fire_department, color: primaryColor), title: Text('Current Streak'), subtitle: Text('7 days in a row!'))),
          Card(child: ListTile(leading: Icon(Icons.check_circle, color: primaryColor), title: Text('Today\'s Habits'), subtitle: Text('3 of 5 completed'))),
          Card(child: ListTile(leading: Icon(Icons.star, color: primaryColor), title: Text('Top Habit'), subtitle: Text('Morning Meditation - 14 days'))),
          Card(child: ListTile(leading: Icon(Icons.insights, color: primaryColor), title: Text('Weekly Summary'), subtitle: Text('85% completion rate this week'))),
        ],
      ),
    );
  }
}

class HabitCreationScreen extends StatelessWidget {
  const HabitCreationScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Habit')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Card(child: ListTile(leading: Icon(Icons.edit, color: primaryColor), title: Text('Habit Name'), subtitle: Text('e.g. Morning Run, Read 20 Pages'))),
          const Card(child: ListTile(leading: Icon(Icons.repeat, color: primaryColor), title: Text('Frequency'), subtitle: Text('Daily / Weekly / Custom'))),
          const Card(child: ListTile(leading: Icon(Icons.alarm, color: primaryColor), title: Text('Reminder Time'), subtitle: Text('Set a daily reminder at 7:00 AM'))),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: Colors.white),
              onPressed: () {},
              child: const Text('Save Habit'),
            ),
          ),
        ],
      ),
    );
  }
}

class ProgressTrackingScreen extends StatelessWidget {
  const ProgressTrackingScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Progress Tracking')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(child: ListTile(leading: Icon(Icons.bar_chart, color: primaryColor), title: Text('Monthly Overview'), subtitle: Text('Completed 22 out of 30 days'))),
          Card(child: ListTile(leading: Icon(Icons.trending_up, color: primaryColor), title: Text('Best Streak'), subtitle: Text('14 consecutive days - Reading'))),
          Card(child: ListTile(leading: Icon(Icons.pie_chart, color: primaryColor), title: Text('Category Breakdown'), subtitle: Text('Health 40%, Learning 35%, Mindfulness 25%'))),
          Card(child: ListTile(leading: Icon(Icons.workspace_premium, color: primaryColor), title: Text('Badges Earned'), subtitle: Text('5 badges unlocked this month'))),
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
        padding: const EdgeInsets.all(16),
        children: const [
          Card(child: ListTile(leading: Icon(Icons.person, color: primaryColor), title: Text('Profile'), subtitle: Text('Manage your account details'))),
          Card(child: ListTile(leading: Icon(Icons.notifications, color: primaryColor), title: Text('Notifications'), subtitle: Text('Customize reminder preferences'))),
          Card(child: ListTile(leading: Icon(Icons.lock, color: primaryColor), title: Text('Privacy'), subtitle: Text('Control your data and permissions'))),
          Card(child: ListTile(leading: Icon(Icons.shopping_cart, color: primaryColor), title: Text('Upgrade to Pro'), subtitle: Text('Unlock unlimited habits and analytics'))),
        ],
      ),
    );
  }
}