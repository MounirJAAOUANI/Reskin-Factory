import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import 'dart:async';
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await MobileAds.instance.initialize();
  runApp(const BrainBoostApp());
}

class BrainBoostApp extends StatelessWidget {
  const BrainBoostApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BrainBoost',
      theme: ThemeData(
        primaryColor: const Color(0xFF1E3A8A),
        useMaterial3: true,
        fontFamily: 'Poppins',
        brightness: Brightness.light,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      darkTheme: ThemeData(
        primaryColor: const Color(0xFF1E3A8A),
        useMaterial3: true,
        fontFamily: 'Poppins',
        brightness: Brightness.dark,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const MainNavigation(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({Key? key}) : super(key: key);

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;
  late SharedPreferences _prefs;
  bool _isFirstLaunch = true;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    _prefs = await SharedPreferences.getInstance();
    _isFirstLaunch = _prefs.getBool('first_launch') ?? true;
    if (_isFirstLaunch) {
      _prefs.setBool('first_launch', false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      const OnboardingScreen(),
      const SleepDashboardScreen(),
      const EducationHubScreen(),
      const SleepTrackerScreen(),
      const PersonalizedTipsScreen(),
    ];

    return Scaffold(
      body: screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.grey[900]
            : Colors.white,
        selectedItemColor: const Color(0xFF1E3A8A),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school),
            label: 'Education',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.track_changes),
            label: 'Tracker',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.lightbulb),
            label: 'Tips',
          ),
        ],
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  late BannerAd _bannerAd;
  bool _bannerAdIsLoaded = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _initializeBannerAd();
  }

  void _initializeBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _bannerAdIsLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          ad.dispose();
        },
      ),
    );
    _bannerAd.load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _bannerAd.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final onboardingPages = [
      _buildOnboardingPage(
        title: 'Welcome to BrainBoost',
        description: 'Optimize your sleep and boost your cognitive performance',
        icon: Icons.moon,
      ),
      _buildOnboardingPage(
        title: 'Track Your Sleep',
        description: 'Monitor your sleep cycles and understand your patterns',
        icon: Icons.show_chart,
      ),
      _buildOnboardingPage(
        title: 'Science-Backed Tips',
        description: 'Get personalized recommendations based on sleep science',
        icon: Icons.science,
      ),
      _buildOnboardingPage(
        title: 'Improve Your Health',
        description: 'Better sleep leads to better performance and health',
        icon: Icons.favorite,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('BrainBoost'),
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentPage = index;
                });
              },
              children: onboardingPages,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                onboardingPages.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 12 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? const Color(0xFF1E3A8A)
                        : Colors.grey,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: () {
                if (_currentPage < onboardingPages.length - 1) {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Onboarding Complete!')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E3A8A),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
              child: Text(
                _currentPage < onboardingPages.length - 1
                    ? 'Next'
                    : 'Get Started',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
          if (_bannerAdIsLoaded)
            SizedBox(
              height: _bannerAd.size.height.toDouble(),
              width: _bannerAd.size.width.toDouble(),
              child: AdWidget(ad: _bannerAd),
            ),
        ],
      ),
    );
  }

  Widget _buildOnboardingPage({
    required String title,
    required String description,
    required IconData icon,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 80,
              color: const Color(0xFF1E3A8A),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E3A8A),
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class SleepDashboardScreen extends StatefulWidget {
  const SleepDashboardScreen({Key? key}) : super(key: key);

  @override
  State<SleepDashboardScreen> createState() => _SleepDashboardScreenState();
}

class _SleepDashboardScreenState extends State<SleepDashboardScreen> {
  late FirebaseRemoteConfig _remoteConfig;
  String _contentMessage = 'Loading...';
  late BannerAd _bannerAd;
  bool _bannerAdIsLoaded = false;
  double _sleepQuality = 0;
  double _sleepDuration = 0;

  @override
  void initState() {
    super.initState();
    _initializeRemoteConfig();
    _initializeBannerAd();
    _loadSleepData();
  }

  Future<void> _initializeRemoteConfig() async {
    _remoteConfig = FirebaseRemoteConfig.instance;
    await _remoteConfig.setConfigSettings(
      RemoteConfigSettings(
        fetchTimeout: const Duration(seconds: 10),
        minimumFetchInterval: const Duration(hours: 1),
      ),
    );
    try {
      await _remoteConfig.fetchAndActivate();
      setState(() {
        _contentMessage = _remoteConfig.getString('sleep_tip') ??
            'Sleep tracking is essential for health';
      });
    } catch (e) {
      setState(() {
        _contentMessage = 'Remote config failed, using defaults';
      });
    }
  }

  void _initializeBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _bannerAdIsLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          ad.dispose();
        },
      ),
    );
    _bannerAd.load();
  }

  Future<void> _loadSleepData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _sleepQuality = prefs.getDouble('sleep_quality') ?? 7.5;
      _sleepDuration = prefs.getDouble('sleep_duration') ?? 7.0;
    });
  }

  @override
  void dispose() {
    _bannerAd.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sleep Dashboard'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sleep Quality',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: SizedBox(
                          width: 150,
                          height: 150,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              CircularProgressIndicator(
                                value: _sleepQuality / 10,
                                minHeight: 12,
                                backgroundColor: Colors.grey[300],
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _sleepQuality > 7
                                      ? Colors.green
                                      : _sleepQuality > 5
                                          ? Colors.orange
                                          : Colors.red,
                                ),
                              ),
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _sleepQuality.toStringAsFixed(1),
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1E3A8A),
                                    ),
                                  ),
                                  const Text('out of 10'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sleep Duration',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_sleepDuration.toStringAsFixed(1)} hours',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E3A8A),
                            ),
                          ),
                          Icon(
                            _sleepDuration >= 7
                                ? Icons.check_circle
                                : Icons.info,
                            color: _sleepDuration >= 7
                                ? Colors.green
                                : Colors.orange,
                            size: 32,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _sleepDuration >= 7
                            ? 'Great! You got enough sleep'
                            : 'Try to get more sleep tonight',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Today\'s Tip',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _contentMessage,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (_bannerAdIsLoaded)
                SizedBox(
                  height: _bannerAd.size.height.toDouble(),
                  width: _bannerAd.size.width.toDouble(),
                  child: AdWidget(ad: _bannerAd),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class EducationHubScreen extends StatefulWidget {
  const EducationHubScreen({Key? key}) : super(key: key);

  @override
  State<EducationHubScreen> createState() => _EducationHubScreenState();
}

class _EducationHubScreenState extends State<EducationHubScreen> {
  late BannerAd _bannerAd;
  bool _bannerAdIsLoaded = false;

  final List<Map<String, String>> _articles = [
    {
      'title': 'Understanding Sleep Cycles',
      'content':
          'Sleep occurs in cycles of approximately 90 minutes. Each cycle includes light sleep, deep sleep, and REM sleep.',
      'icon': '🌙',
    },
    {
      'title': 'The Importance of REM Sleep',
      'content':
          'REM (Rapid Eye Movement) sleep is crucial for memory consolidation, emotional regulation, and brain development.',
      'icon': '👁️',
    },
    {
      'title': 'Circadian Rhythm 101',
      'content':
          'Your circadian rhythm is a 24-hour internal clock that regulates sleep-wake cycles based on light exposure.',
      'icon': '🔄',
    },
    {
      'title': 'Sleep Debt and Recovery',
      'content':
          'Sleep debt accumulates when you get less sleep than needed. Recovery sleep can help restore cognitive function.',
      'icon': '💤',
    },
  ];

  @override
  void initState() {
    super.initState();
    _initializeBannerAd();
  }

  void _initializeBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _bannerAdIsLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          ad.dispose();
        },
      ),
    );
    _bannerAd.load();
  }

  @override
  void dispose() {
    _bannerAd.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Education Hub'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Science-Backed Sleep Knowledge',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _articles.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final article = _articles[index];
                      return Card(
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    article['icon']!,
                                    style: const TextStyle(fontSize: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      article['title']!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                article['content']!,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  if (_bannerAdIsLoaded)
                    SizedBox(
                      height: _bannerAd.size.height.toDouble(),
                      width: _bannerAd.size.width.toDouble(),
                      child: AdWidget(ad: _bannerAd),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SleepTrackerScreen extends StatefulWidget {
  const SleepTrackerScreen({Key? key}) : super(key: key);

  @override
  State<SleepTrackerScreen> createState() => _SleepTrackerScreenState();
}

class _SleepTrackerScreenState extends State<SleepTrackerScreen> {
  late BannerAd _bannerAd;
  bool _bannerAdIsLoaded = false;
  late SharedPreferences _prefs;
  DateTime? _bedtime;
  DateTime? _wakeTime;
  List<Map<String, dynamic>> _sleepHistory = [];

  @override
  void initState() {
    super.initiate();
    _initializeBannerAd();
    _initializePreferences();
  }

  Future<void> _initializePreferences() async {
    _prefs = await SharedPreferences.getInstance();
    _loadSleepHistory();
  }

  void _loadSleepHistory() {
    final historyJson = _prefs.getString('sleep_history');
    if (historyJson != null) {
      final decoded = jsonDecode(historyJson) as List;
      setState(() {
        _sleepHistory = decoded
            .map((item) => {
                  'bedtime': DateTime.parse(item['bedtime'] as String),
                  'wakeTime': DateTime.parse(item['wakeTime'] as String),
                  'quality': item['quality'] as double,
                })
            .toList();
      });
    }
  }

  void _saveSleepEntry() {
    if (_bedtime != null && _wakeTime != null) {
      final duration =
          _wakeTime!.difference(_bedtime!).inMinutes / 60.0; // hours

      final entry = {
        'bedtime': _bedtime!.toIso8601String(),
        'wakeTime': _wakeTime!.toIso8601String(),
        'quality': duration > 7 ? 8.0 : duration > 5 ? 6.0 : 4.0,
      };

      _sleepHistory.add(entry);
      _prefs.setString('sleep_history', jsonEncode(_sleepHistory));

      setState(() {
        _bedtime = null;
        _wakeTime = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sleep entry recorded!')),
      );
    }
  }

  void _initializeBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111',
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _bannerAdIsLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          ad.dispose();
        },
      ),
    );
    _bannerAd.load();
  }

  @override
  void dispose() {
    _bannerAd.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sleep Tracker'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Log Your Sleep',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 24),
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bed Time',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _bedtime == null
                                  ? 'Not set'
                                  : DateFormat('HH:mm').format(_bedtime!),
                              style: const TextStyle(fontSize: 18),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: () async {
                              final time = await showTimePicker(
                                context: context,
                                initialTime: TimeOfDay.now(),
                              );
                              if (time != null) {
                                setState(() {
                                  _bedtime = DateTime.now().copyWith(
                                    hour: time.hour,
                                    minute: time.minute,
                                  );
                                });
                              }
                            },
                            icon: const Icon(Icons.access_time),
                            label: const Text('Set'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Wake Time',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _wakeTime == null
                                  ? 'Not set'
                                  : DateFormat('HH:mm').format(_wakeTime!),
                              style: const TextStyle(fontSize: 18),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: () async {
                              final time = await showTimePicker(
                                context: context,
                                initialTime: TimeOfDay.now(),
                              );
                              if (time != null) {
                                setState(() {
                                  _wakeTime = DateTime.now().copyWith(
                                    hour: time.hour,
                                    minute: time.minute,
                                  );
                                });
                              }
                            },
                            icon: const Icon(Icons.access_time),
                            label: const Text('Set'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saveSleepEntry,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E3A8A),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text(
                            'Log Sleep',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Sleep History',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              if (_sleepHistory.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Text(
                      'No sleep entries yet. Start tracking!',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _sleepHistory.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final entry = _sleepHistory[index];
                    final bedtime = entry['bedtime'] as DateTime;
                    final wakeTime = entry['wakeTime'] as DateTime;
                    final duration = wakeTime.difference(bedtime).inMinutes / 60;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  DateFormat('MMM dd').format(bedtime),
                                  style: Theme.of(context).textTheme.titleSmall,
                                ),
                                Text(
                                  '${DateFormat('HH:mm').format(bedtime)} - ${DateFormat('HH:mm').format(wakeTime)}',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                            Text(
                              '${duration.toStringAsFixed(1)}h',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E3A8A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              const SizedBox(height: 20),
              if (_bannerAdIsLoaded)
                SizedBox(
                  height: _bannerAd.size