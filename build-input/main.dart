import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Google Mobile Ads
  MobileAds.instance.initialize();
  
  // Initialize In-App Purchase
  InAppPurchase.instance;
  
  runApp(const MoneyMindApp());
}

class MoneyMindApp extends StatelessWidget {
  const MoneyMindApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MoneyMind',
      theme: ThemeData(
        primaryColor: const Color(0xFF2E7D32),
        useMaterial3: true,
        fontFamily: 'Poppins',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E7D32),
        ),
      ),
      home: const MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  late List<Widget> _screens;
  late RemoteConfig _remoteConfig;

  @override
  void initState() {
    super.initState();
    _screens = const [
      DashboardScreen(),
      AddExpenseScreen(),
      CategoryBreakdownScreen(),
      BudgetPlannerScreen(),
      ReportsScreen(),
    ];
    _initializeRemoteConfig();
  }

  Future<void> _initializeRemoteConfig() async {
    _remoteConfig = RemoteConfig.instance;
    await _remoteConfig.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(minutes: 1),
      minimumFetchInterval: const Duration(hours: 1),
    ));
    await _remoteConfig.fetchAndActivate();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle),
            label: 'Add Expense',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pie_chart),
            label: 'Categories',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.budget),
            label: 'Budget',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assessment),
            label: 'Reports',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFF2E7D32),
        unselectedItemColor: Colors.grey,
        onTap: (int index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Text(
                        'Total Balance',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        '\$5,234.50',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: const [
                              Text('Income', style: TextStyle(color: Colors.grey)),
                              Text('\$8,500', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Column(
                            children: const [
                              Text('Expenses', style: TextStyle(color: Colors.grey)),
                              Text('\$3,265.50', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Recent Transactions',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _buildTransactionItem('Grocery Store', '-\$45.50', 'Today'),
                  _buildTransactionItem('Salary', '+\$3,000', 'Yesterday'),
                  _buildTransactionItem('Gas', '-\$35.00', '2 days ago'),
                ],
              ),
            ),
            const BannerAdWidget(),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionItem(String title, String amount, String date) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
              Text(date, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          Text(
            amount,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: amount.startsWith('+') ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }
}

class AddExpenseScreen extends StatelessWidget {
  const AddExpenseScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Expense'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Amount',
                  prefixText: '\$ ',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'food', child: Text('Food & Dining')),
                  DropdownMenuItem(value: 'transport', child: Text('Transport')),
                  DropdownMenuItem(value: 'utilities', child: Text('Utilities')),
                  DropdownMenuItem(value: 'entertainment', child: Text('Entertainment')),
                  DropdownMenuItem(value: 'health', child: Text('Health & Medical')),
                ]
                    .toList(),
                onChanged: (_) {},
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Currency',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'usd', child: Text('USD')),
                  DropdownMenuItem(value: 'eur', child: Text('EUR')),
                  DropdownMenuItem(value: 'gbp', child: Text('GBP')),
                  DropdownMenuItem(value: 'inr', child: Text('INR')),
                ]
                    .toList(),
                onChanged: (_) {},
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Recurring Expense'),
                value: false,
                onChanged: (_) {},
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Expense added successfully')),
                    );
                  },
                  child: const Text(
                    'Add Expense',
                    style: TextStyle(fontSize: 16, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const BannerAdWidget(),
            ],
          ),
        ),
      ),
    );
  }
}

class CategoryBreakdownScreen extends StatelessWidget {
  const CategoryBreakdownScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final categories = [
      {'name': 'Food & Dining', 'amount': 450.50, 'percentage': 35},
      {'name': 'Transport', 'amount': 320.00, 'percentage': 25},
      {'name': 'Utilities', 'amount': 260.00, 'percentage': 20},
      {'name': 'Entertainment', 'amount': 195.00, 'percentage': 15},
      {'name': 'Health & Medical', 'amount': 40.00, 'percentage': 5},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Category Breakdown'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Text(
                        'This Month\'s Breakdown',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      ...categories.map((cat) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(cat['name'] as String),
                                  Text(
                                    '\$${(cat['amount'] as num).toStringAsFixed(2)}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: (cat['percentage'] as int) / 100,
                                  minHeight: 8,
                                  backgroundColor: Colors.grey[300],
                                  valueColor: const AlwaysStoppedAnimation<Color>(
                                    Color(0xFF2E7D32),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const BannerAdWidget(),
            ],
          ),
        ),
      ),
    );
  }
}

class BudgetPlannerScreen extends StatelessWidget {
  const BudgetPlannerScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final budgets = [
      {'category': 'Food & Dining', 'limit': 500, 'spent': 450.50, 'icon': Icons.restaurant},
      {'category': 'Transport', 'limit': 400, 'spent': 320.00, 'icon': Icons.directions_car},
      {'category': 'Utilities', 'limit': 300, 'spent': 260.00, 'icon': Icons.flash_on},
      {'category': 'Entertainment', 'limit': 250, 'spent': 195.00, 'icon': Icons.movie},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Budget Planner'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              ...budgets.map((budget) {
                final percentage = (budget['spent'] as num) / (budget['limit'] as num);
                final isOverBudget = percentage > 1;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(budget['icon'] as IconData,
                                  color: const Color(0xFF2E7D32)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      budget['category'] as String,
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      '\$${budget['spent']} / \$${budget['limit']}',
                                      style: const TextStyle(
                                        fontSize: 12,