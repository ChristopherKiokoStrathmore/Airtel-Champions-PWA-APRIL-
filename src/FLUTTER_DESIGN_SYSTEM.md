# 🎨 SALES INTELLIGENCE NETWORK - FLUTTER DESIGN SYSTEM

## Complete Implementation Guide for Mobile App (Phase 1 MVP)

---

## 📦 PROJECT STRUCTURE

```
lib/
├── main.dart
├── app/
│   ├── app.dart                    # MaterialApp configuration
│   └── theme.dart                  # App theme (Material 3)
├── core/
│   ├── constants/
│   │   ├── colors.dart             # Color constants
│   │   ├── typography.dart         # Text styles
│   │   └── spacing.dart            # Spacing constants
│   └── utils/
│       ├── validators.dart         # Form validation
│       └── formatters.dart         # Data formatting
├── features/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── providers/auth_provider.dart
│   ├── home/
│   │   ├── home_screen.dart
│   │   ├── widgets/podium_widget.dart
│   │   ├── widgets/announcement_card.dart
│   │   └── widgets/mission_card.dart
│   ├── missions/
│   │   ├── mission_form_screen.dart
│   │   ├── camera_screen.dart
│   │   └── widgets/location_picker.dart
│   ├── leaderboard/
│   │   ├── leaderboard_screen.dart
│   │   └── widgets/rank_card.dart
│   └── profile/
│       ├── profile_screen.dart
│       └── widgets/stats_card.dart
├── shared/
│   └── widgets/
│       ├── custom_button.dart
│       ├── custom_text_field.dart
│       └── loading_indicator.dart
└── data/
    ├── models/
    ├── repositories/
    └── services/
```

---

## 🎨 COLOR SYSTEM

### File: `lib/core/constants/colors.dart`

```dart
import 'package:flutter/material.dart';

class AppColors {
  // PRIMARY - Airtel Red
  static const Color airtelRed = Color(0xFFE60000);
  static const Color airtelRedDark = Color(0xFFCC0000);
  static const Color airtelRedLight = Color(0xFFFF3333);
  static const Color airtelRedBg = Color(0xFFFFE6E6);

  // SECONDARY - Functional Colors
  static const Color networkBlue = Color(0xFF0066CC);
  static const Color successGreen = Color(0xFF00CC66);
  static const Color warningAmber = Color(0xFFFF9900);
  static const Color errorRed = Color(0xFFFF3333);

  // NEUTRAL - Material 3 Grays
  static const Color gray900 = Color(0xFF111827);
  static const Color gray800 = Color(0xFF1F2937);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color white = Color(0xFFFFFFFF);

  // SEMANTIC
  static const Color textPrimary = gray900;
  static const Color textSecondary = gray700;
  static const Color textHint = gray500;
  static const Color border = gray300;
  static const Color background = gray50;

  // GRADIENTS
  static const LinearGradient redGradient = LinearGradient(
    colors: [airtelRed, Color(0xFFFF6B00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient missionGradient = LinearGradient(
    colors: [Color(0xFF00D9FF), Color(0xFF0066FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
```

---

## ✍️ TYPOGRAPHY SYSTEM

### File: `lib/core/constants/typography.dart`

```dart
import 'package:flutter/material.dart';
import 'colors.dart';

class AppTypography {
  // DISPLAY
  static const TextStyle displayLarge = TextStyle(
    fontSize: 57,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle displayMedium = TextStyle(
    fontSize: 45,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle displaySmall = TextStyle(
    fontSize: 36,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  // HEADLINES
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle headlineSmall = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  // TITLE
  static const TextStyle titleLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle titleSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  // BODY
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  // LABEL
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    fontFamily: 'Inter',
    color: AppColors.textPrimary,
  );
}
```

---

## 📏 SPACING SYSTEM

### File: `lib/core/constants/spacing.dart`

```dart
class AppSpacing {
  // 4px baseline grid
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;

  // Specific use cases
  static const double cardPadding = 16.0;
  static const double screenPadding = 20.0;
  static const double cardBorderRadius = 12.0;
  static const double buttonBorderRadius = 8.0;
  static const double inputBorderRadius = 8.0;
}
```

---

## 🎨 MATERIAL 3 THEME

### File: `lib/app/theme.dart`

```dart
import 'package:flutter/material.dart';
import '../core/constants/colors.dart';
import '../core/constants/typography.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.airtelRed,
        primary: AppColors.airtelRed,
        secondary: AppColors.networkBlue,
        error: AppColors.errorRed,
        background: AppColors.background,
        surface: AppColors.white,
      ),
      
      // TYPOGRAPHY
      textTheme: const TextTheme(
        displayLarge: AppTypography.displayLarge,
        displayMedium: AppTypography.displayMedium,
        displaySmall: AppTypography.displaySmall,
        headlineLarge: AppTypography.headlineLarge,
        headlineMedium: AppTypography.headlineMedium,
        headlineSmall: AppTypography.headlineSmall,
        titleLarge: AppTypography.titleLarge,
        titleMedium: AppTypography.titleMedium,
        titleSmall: AppTypography.titleSmall,
        bodyLarge: AppTypography.bodyLarge,
        bodyMedium: AppTypography.bodyMedium,
        bodySmall: AppTypography.bodySmall,
        labelLarge: AppTypography.labelLarge,
        labelMedium: AppTypography.labelMedium,
        labelSmall: AppTypography.labelSmall,
      ),
      
      // ELEVATED BUTTON
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.airtelRed,
          foregroundColor: AppColors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),
      
      // OUTLINED BUTTON
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.airtelRed,
          side: const BorderSide(color: AppColors.airtelRed, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),
      
      // TEXT BUTTON
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.airtelRed,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: AppTypography.labelLarge,
        ),
      ),
      
      // INPUT DECORATION
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.airtelRed, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.errorRed),
        ),
        labelStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textHint),
        hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textHint),
      ),
      
      // CARD
      cardTheme: CardTheme(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        color: AppColors.white,
      ),
      
      // APP BAR
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimary,
        titleTextStyle: AppTypography.titleLarge,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),
      
      // BOTTOM NAVIGATION BAR
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.white,
        selectedItemColor: AppColors.airtelRed,
        unselectedItemColor: AppColors.gray500,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      
      // FAB
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.airtelRed,
        foregroundColor: AppColors.white,
        elevation: 4,
      ),
    );
  }
}
```

---

## 📱 SCREEN 1: LOGIN SCREEN

### File: `lib/features/auth/login_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/typography.dart';
import '../../core/constants/spacing.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      
      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));
      
      // Navigate to home (implement navigation)
      if (mounted) {
        setState(() => _isLoading = false);
        // Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.airtelRed,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.security,
                    size: 48,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                
                // Title
                Text(
                  'Sales Intelligence Network',
                  style: AppTypography.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Sign in to continue',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xxxl),
                
                // Login Form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // Phone Number Field
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Phone Number',
                          hintText: '+254 7XX XXX XXX',
                          prefixIcon: Icon(Icons.phone),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your phone number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      
                      // PIN Field
                      TextFormField(
                        controller: _pinController,
                        keyboardType: TextInputType.number,
                        obscureText: true,
                        maxLength: 6,
                        decoration: const InputDecoration(
                          labelText: 'PIN',
                          hintText: 'Enter 6-digit PIN',
                          prefixIcon: Icon(Icons.lock),
                          counterText: '',
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your PIN';
                          }
                          if (value.length != 6) {
                            return 'PIN must be 6 digits';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      
                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: AppColors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('Sign In'),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      
                      // Forgot PIN
                      TextButton(
                        onPressed: () {},
                        child: const Text('Forgot PIN?'),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: AppSpacing.xxxl),
                
                // Demo Info
                Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE3F2FD),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF2196F3)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Demo Credentials',
                        style: AppTypography.labelMedium.copyWith(
                          color: const Color(0xFF1565C0),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Phone: +254 712 345 678\nPIN: 123456',
                        style: AppTypography.bodySmall.copyWith(
                          color: const Color(0xFF1976D2),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 📱 SCREEN 2: HOME SCREEN (SIMPLIFIED MVP)

### File: `lib/features/home/home_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/typography.dart';
import '../../core/constants/spacing.dart';
import 'widgets/mission_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Intel HQ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.delayed(const Duration(seconds: 1));
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.screenPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Text(
                '👋 Hello, John',
                style: AppTypography.headlineSmall,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Ready to gather intelligence?',
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              
              // User Rank Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  gradient: AppColors.redGradient,
                  borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '⚡ 3,450 POINTS',
                              style: AppTypography.headlineMedium.copyWith(
                                color: AppColors.white,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              '🏆 Rank: #23 of 662',
                              style: AppTypography.titleMedium.copyWith(
                                color: AppColors.white.withOpacity(0.9),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Progress Bar
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '↑ Climbed 2 spots today',
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.white.withOpacity(0.9),
                              ),
                            ),
                            Text(
                              '73%',
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.white.withOpacity(0.9),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: 0.73,
                            backgroundColor: AppColors.white.withOpacity(0.3),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.white,
                            ),
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '1,320 pts to Intelligence Expert',
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              
              // Quick Stats
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      label: 'This Week',
                      value: '12',
                      icon: Icons.check_circle_outline,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _buildStatCard(
                      label: 'Streak',
                      value: '🔥 5',
                      icon: Icons.local_fire_department_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xxl),
              
              // Missions Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Programs',
                    style: AppTypography.titleLarge,
                  ),
                  Text(
                    '📍 3 Near You',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              
              // Mission Cards
              MissionCard(
                title: 'Network Experience',
                description: 'Check network quality',
                points: 80,
                icon: Icons.network_cell,
                onTap: () {
                  // Navigate to mission form
                },
              ),
              const SizedBox(height: AppSpacing.md),
              
              MissionCard(
                title: 'Competition Conversion',
                description: 'Customer won from competitor',
                points: 200,
                icon: Icons.people_outline,
                isPremium: true,
                onTap: () {},
              ),
              const SizedBox(height: AppSpacing.md),
              
              MissionCard(
                title: 'New Site Launch',
                description: 'New store activation',
                points: 150,
                icon: Icons.storefront,
                onTap: () {},
              ),
              const SizedBox(height: AppSpacing.md),
              
              MissionCard(
                title: 'AMB Visitations',
                description: 'Brand ambassador visit',
                points: 100,
                icon: Icons.person_pin_circle_outlined,
                onTap: () {},
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Missions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Camera',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.leaderboard),
            label: 'Leaderboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 20),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
```

### File: `lib/features/home/widgets/mission_card.dart`

```dart
import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../core/constants/typography.dart';
import '../../../core/constants/spacing.dart';

class MissionCard extends StatelessWidget {
  final String title;
  final String description;
  final int points;
  final IconData icon;
  final bool isPremium;
  final VoidCallback onTap;

  const MissionCard({
    Key? key,
    required this.title,
    required this.description,
    required this.points,
    required this.icon,
    this.isPremium = false,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.cardBorderRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.airtelRedBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: AppColors.airtelRed,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: AppTypography.titleMedium,
                          ),
                        ),
                        if (isPremium)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.warningAmber.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '💎',
                              style: AppTypography.bodySmall,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      description,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Text(
                          '⚡ $points pts',
                          style: AppTypography.labelMedium.copyWith(
                            color: AppColors.airtelRed,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Arrow
              const Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppColors.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 📚 REUSABLE COMPONENTS

### Custom Button

```dart
// lib/shared/widgets/custom_button.dart
import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/typography.dart';

enum ButtonType { primary, secondary, danger }

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonType type;
  final bool isLoading;
  final IconData? icon;

  const CustomButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.type = ButtonType.primary,
    this.isLoading = false,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;

    switch (type) {
      case ButtonType.primary:
        backgroundColor = AppColors.airtelRed;
        textColor = AppColors.white;
        break;
      case ButtonType.secondary:
        backgroundColor = AppColors.networkBlue;
        textColor = AppColors.white;
        break;
      case ButtonType.danger:
        backgroundColor = AppColors.errorRed;
        textColor = AppColors.white;
        break;
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: textColor,
          disabledBackgroundColor: backgroundColor.withOpacity(0.5),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20),
                    const SizedBox(width: 8),
                  ],
                  Text(text),
                ],
              ),
      ),
    );
  }
}
```

---

## 📦 DEPENDENCIES (pubspec.yaml)

```yaml
name: sales_intelligence_network
description: Airtel Kenya Sales Intelligence Network
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  
  # Navigation
  go_router: ^12.1.0
  
  # Local Storage (Offline-first)
  sqflite: ^2.3.0
  shared_preferences: ^2.2.2
  
  # Camera & Image
  camera: ^0.10.5+5
  image_picker: ^1.0.4
  image: ^4.1.3
  
  # Location
  geolocator: ^10.1.0
  geocoding: ^2.1.1
  google_maps_flutter: ^2.5.0
  
  # Backend (Supabase)
  supabase_flutter: ^2.0.0
  
  # Connectivity
  connectivity_plus: ^5.0.1
  
  # UI/UX
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  lottie: ^2.7.0
  
  # Utilities
  intl: ^0.18.1
  uuid: ^4.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  
  fonts:
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
          weight: 400
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Flutter 3.16+)
- [ ] Design system implementation (colors, typography, spacing)
- [ ] Material 3 theme configuration
- [ ] Reusable component library
- [ ] Supabase integration setup
- [ ] Offline database (SQLite) setup

### Phase 2: Authentication (Week 1)
- [ ] Login screen UI
- [ ] Phone + PIN authentication
- [ ] Biometric login (optional)
- [ ] Offline PIN verification
- [ ] Session management

### Phase 3: Core Screens (Week 2)
- [ ] Home screen (simplified)
- [ ] Mission form (Network Experience only)
- [ ] Camera integration
- [ ] Location picker
- [ ] Basic leaderboard (list view)
- [ ] Profile screen

### Phase 4: Offline Sync (Week 2-3)
- [ ] SQLite database schema
- [ ] Offline queue management
- [ ] Background sync service
- [ ] Photo compression & upload
- [ ] Conflict resolution

### Phase 5: Testing & Polish (Week 3)
- [ ] Unit tests
- [ ] Widget tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] 2G/3G testing
- [ ] Battery optimization

---

This design system provides everything needed to build the Flutter mobile app. The React admin dashboard is already complete above! 🚀
