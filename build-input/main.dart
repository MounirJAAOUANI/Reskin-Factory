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
  runApp(const HackDailyApp());
}

class HackDailyApp extends StatefulWidget {
  const HackDailyApp({super.key});
  @override
  State<HackDailyApp> createState() => _HackDailyAppState();
}

class _HackDailyAppState extends State<HackDailyApp> {
  int _currentIndex = 0;
  BannerAd? _bannerAd;
  bool _bannerAdLoaded = false;
  final Color primaryColor = const Color(0xFFFF6B35);

  final List<Widget> _screens = const [
    HomeScreen(),
    CategoriesScreen(),
    HackDetailScreen(),
    SavedHacksScreen(),
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
        onAdLoaded: (_) => setState(() => _bannerAdLoaded = true),
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
      title: 'HackDaily',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
        useMaterial3: true,
        appBarTheme: AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
        ),
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
              selectedItemColor: primaryColor,
              unselectedItemColor: Colors.grey,
              type: BottomNavigationBarType.fixed,
              onTap: (index) => setState(() => _currentIndex = index),
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                BottomNavigationBarItem(icon: Icon(Icons.category), label: 'Categories'),
                BottomNavigationBarItem(icon: Icon(Icons.lightbulb), label: 'Detail'),
                BottomNavigationBarItem(icon: Icon(Icons.bookmark), label: 'Saved'),
                BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final hacks = [
      {'title': 'Boost Your Morning Routine', 'subtitle': 'Start your day with a 5-minute stretch'},
      {'title': 'Deep Work Technique', 'subtitle': 'Work in 90-minute focused blocks'},
      {'title': 'Sleep Optimization', 'subtitle': 'Keep room temperature at 65°F for best sleep'},
      {'title': 'Hydration Hack', 'subtitle': 'Drink water before every meal to reduce hunger'},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('HackDaily'), centerTitle: true),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: hacks.length,
        itemBuilder: (context, index) => Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            leading: const Icon(Icons.tips_and_updates, color: Color(0xFFFF6B35)),
            title: Text(hacks[index]['title']!, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(hacks[index]['subtitle']!),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          ),
        ),
      ),
    );
  }
}

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final categories = [
      {'name': 'Productivity', 'icon': Icons.speed},
      {'name': 'Health & Fitness', 'icon': Icons.fitness_center},
      {'name': 'Finance', 'icon': Icons.attach_money},
      {'name': 'Technology', 'icon': Icons.devices},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Categories'), centerTitle: true),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: categories.length,
        itemBuilder: (context, index) => Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            leading: Icon(categories[index]['icon'] as IconData, color: const Color(0xFFFF6B35)),
            title: Text(categories[index]['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right),
          ),
        ),
      ),
    );
  }
}

class HackDetailScreen extends StatelessWidget {
  const HackDetailScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hack Detail'), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Deep Work Technique', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Work in 90-minute focused blocks with no distractions to maximize productivity and cognitive output.'),
                ],
              ),
            ),
          ),
          SizedBox(height: 8),
          ListTile(leading: Icon(Icons.check_circle, color: Color(0xFFFF6B35)), title: Text('Turn off notifications')),
          ListTile(leading: Icon(Icons.check_circle, color: Color(0xFFFF6B35)), title: Text('Use a timer for 90 minutes')),
          ListTile(leading: Icon(Icons.check_circle, color: Color(0xFFFF6B35)), title: Text('Take a 20-minute break after')),
        ],
      ),
    );
  }
}

class SavedHacksScreen extends StatelessWidget {
  const SavedHacksScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final saved = [
      'Boost Your Morning Routine',
      'Sleep Optimization',
      'The 2-Minute Rule',
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Saved Hacks'), centerTitle: true),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: saved.length,
        itemBuilder: (context, index) => Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            leading: const Icon(Icons.bookmark, color: Color(0xFFFF6B35)),
            title: Text(saved[index], style: const TextStyle(fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.delete_outline, color: Colors.redAccent),
          ),
        ),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings'), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(8),
        children: const [
          ListTile(leading: Icon(Icons.notifications, color: Color(0xFFFF6B35)), title: Text('Notifications'), trailing: Icon(Icons.chevron_right)),
          ListTile(leading: Icon(Icons.dark_mode, color: Color(0xFFFF6B35)), title: Text('Dark Mode'), trailing: Icon(Icons.chevron_right)),
          ListTile(leading: Icon(Icons.star, color: Color(0xFFFF6B35)), title: Text('Rate Us'), trailing: Icon(Icons.chevron_right)),
          ListTile(leading: Icon(Icons.info, color: Color(0xFFFF6B35)), title: Text('About'), trailing: Icon(Icons.chevron_right)),
        ],
      ),
    );
  }
}