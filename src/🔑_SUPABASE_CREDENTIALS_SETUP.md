# 🔑 SUPABASE CREDENTIALS SETUP GUIDE

**Get your Supabase credentials in 2 minutes!**

---

## 📍 STEP 1: GET YOUR SUPABASE CREDENTIALS

### **Method 1: Via Supabase Dashboard (Easiest)**

1. **Go to your project settings**:
   - URL: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api
   - Or: Supabase Dashboard → Your Project → Settings (⚙️) → API

2. **You'll see this page** with two important sections:

   **Section A: Project URL**
   ```
   URL: https://xspogpfohjmkykfjadhk.supabase.co
   ```
   
   **Section B: Project API keys**
   - `anon` `public` key (this is what you need!)
   - `service_role` `secret` key (DO NOT use this in the app!)

3. **Copy these two values**:
   ```
   ✅ Project URL: https://xspogpfohjmkykfjadhk.supabase.co
   ✅ Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzcz...
   ```

   **⚠️ IMPORTANT**: 
   - Copy the **anon/public** key (starts with `eyJhbGci...`)
   - DO NOT copy the service_role key
   - The anon key is SAFE to use in the mobile app

---

## 📝 STEP 2: ADD CREDENTIALS TO FLUTTER APP

### **Option A: Direct in Code (Quick Start)**

Open `lib/core/services/supabase_service.dart` and replace:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  // 🔑 REPLACE THESE WITH YOUR ACTUAL VALUES
  static const String supabaseUrl = 'https://xspogpfohjmkykfjadhk.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzcz9wb2dmb2hqbWt5a2ZqYWRoayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0ODgxNjM1LCJleHAiOjIwNTA0NTc2MzV9.YOUR_ACTUAL_KEY_HERE';
  
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}
```

**Replace**:
- `supabaseUrl` → Your Project URL
- `supabaseAnonKey` → Your Anon/Public Key

---

### **Option B: Environment Variables (Production Recommended)**

For better security in production:

**1. Create `.env` file** in project root:
```bash
# Create .env file
touch .env

# Add to .gitignore (IMPORTANT!)
echo ".env" >> .gitignore
```

**2. Add credentials to `.env`**:
```env
SUPABASE_URL=https://xspogpfohjmkykfjadhk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ACTUAL_KEY
```

**3. Add `flutter_dotenv` package**:
```yaml
# In pubspec.yaml
dependencies:
  flutter_dotenv: ^5.1.0

# Add to flutter section
flutter:
  assets:
    - .env
```

**4. Update `supabase_service.dart`**:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static String get supabaseUrl => dotenv.env['SUPABASE_URL']!;
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY']!;
  
  static Future<void> initialize() async {
    await dotenv.load(fileName: ".env");
    
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}
```

---

## ✅ STEP 3: VERIFY IT WORKS

### **Test 1: Check Initialization**

Add this to your `main.dart` to see if Supabase initializes:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await SupabaseService.initialize();
    print('✅ Supabase initialized successfully!');
    print('Project URL: ${SupabaseService.client.supabaseUrl}');
  } catch (e) {
    print('❌ Supabase initialization failed: $e');
  }
  
  runApp(const MyApp());
}
```

**Run the app**:
```bash
flutter run
```

**Expected output in console**:
```
✅ Supabase initialized successfully!
Project URL: https://xspogpfohjmkykfjadhk.supabase.co
```

---

### **Test 2: Test Database Connection**

Add a simple test to fetch data:

```dart
// Add this function somewhere in your code
Future<void> testSupabaseConnection() async {
  try {
    // Try to fetch users count
    final response = await SupabaseService.client
        .from('users')
        .select('id')
        .limit(1);
    
    print('✅ Database connection successful!');
    print('Response: $response');
  } catch (e) {
    print('❌ Database connection failed: $e');
  }
}
```

Call it from a button or `initState()`.

---

## 🔐 SECURITY BEST PRACTICES

### **✅ DO's**:
- ✅ Use the **anon/public** key in the mobile app
- ✅ Add `.env` to `.gitignore`
- ✅ Use Row Level Security (RLS) in Supabase
- ✅ Keep service_role key SECRET (never in app)

### **❌ DON'Ts**:
- ❌ Don't commit credentials to Git
- ❌ Don't use service_role key in the app
- ❌ Don't hardcode credentials in production
- ❌ Don't share your keys publicly

---

## 🚨 TROUBLESHOOTING

### **Error: "Invalid API key"**
**Cause**: Wrong key or format issue

**Fix**:
1. Go back to Supabase Dashboard → Settings → API
2. Copy the **anon** key again (click the copy button)
3. Make sure there are no extra spaces or line breaks
4. The key should start with `eyJhbGci...`

---

### **Error: "Failed to initialize Supabase"**
**Cause**: URL or key is incorrect

**Fix**:
```dart
// Add debug prints
print('URL: ${SupabaseService.supabaseUrl}');
print('Key: ${SupabaseService.supabaseAnonKey.substring(0, 20)}...');
```

Check if:
- URL is exactly: `https://xspogpfohjmkykfjadhk.supabase.co` (no trailing slash)
- Key is the full string (usually 200+ characters)

---

### **Error: "No internet connection"**
**Cause**: Supabase requires internet

**Fix**:
1. Check your internet connection
2. For Android emulator, make sure it has internet access
3. For iOS simulator, check network settings

---

### **Error: "Could not resolve host"**
**Cause**: DNS or network issue

**Fix** (Android):
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

---

## 📱 COMPLETE EXAMPLE

Here's a complete working `supabase_service.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  // 🔑 YOUR CREDENTIALS HERE
  static const String supabaseUrl = 'https://xspogpfohjmkykfjadhk.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzcz9wb2dmb2hqbWt5a2ZqYWRoayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0ODgxNjM1LCJleHAiOjIwNTA0NTc2MzV9.YOUR_KEY_HERE';
  
  static SupabaseClient? _client;
  
  /// Initialize Supabase (call this in main.dart)
  static Future<void> initialize() async {
    try {
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
        ),
        realtimeClientOptions: const RealtimeClientOptions(
          eventsPerSecond: 10,
        ),
      );
      
      _client = Supabase.instance.client;
      
      print('✅ Supabase initialized successfully!');
    } catch (e) {
      print('❌ Supabase initialization error: $e');
      rethrow;
    }
  }
  
  /// Get Supabase client instance
  static SupabaseClient get client {
    if (_client == null) {
      throw Exception(
        'Supabase not initialized. Call SupabaseService.initialize() first.'
      );
    }
    return _client!;
  }
  
  /// Check if user is authenticated
  static bool get isAuthenticated {
    return client.auth.currentSession != null;
  }
  
  /// Get current user
  static User? get currentUser {
    return client.auth.currentUser;
  }
}
```

---

## 🎯 QUICK CHECKLIST

Before running your app, verify:

- [ ] Copied Project URL from Supabase Dashboard
- [ ] Copied Anon/Public Key (NOT service_role key)
- [ ] Replaced both values in `supabase_service.dart`
- [ ] No extra spaces or line breaks in keys
- [ ] URL has no trailing slash
- [ ] Added `INTERNET` permission to AndroidManifest.xml
- [ ] Run `flutter pub get` after adding dependencies
- [ ] Test with `flutter run`

---

## ✅ VERIFICATION SCRIPT

Run this to verify everything is set up correctly:

```dart
// Add this to a test button or initState
Future<void> verifySupabaseSetup() async {
  print('🔍 Verifying Supabase setup...\n');
  
  // 1. Check URL
  final url = SupabaseService.supabaseUrl;
  print('✓ URL: $url');
  if (!url.startsWith('https://')) {
    print('❌ URL should start with https://');
    return;
  }
  
  // 2. Check Key
  final key = SupabaseService.supabaseAnonKey;
  print('✓ Key length: ${key.length} characters');
  if (key.length < 100) {
    print('❌ Key seems too short. Did you copy the full key?');
    return;
  }
  if (!key.startsWith('eyJ')) {
    print('❌ Key should start with "eyJ"');
    return;
  }
  
  // 3. Test connection
  try {
    final response = await SupabaseService.client
        .from('users')
        .select('count')
        .limit(1);
    print('✅ Database connection successful!');
    print('✅ ALL CHECKS PASSED! Supabase is ready to use.\n');
  } catch (e) {
    print('❌ Database connection failed: $e');
    print('Check your Row Level Security (RLS) policies.');
  }
}
```

---

## 🎉 YOU'RE DONE!

Once you see:
```
✅ Supabase initialized successfully!
✅ Database connection successful!
```

You're ready to build! 🚀

---

## 📞 NEED THE ACTUAL KEY?

Your Supabase credentials are at:
**https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api**

Or I can help you retrieve them if you're having trouble accessing the dashboard!

---

**Next Steps After Setup**:
1. ✅ Test login with an SE account
2. ✅ Test database queries
3. ✅ Start building features!

🚀 **Your app is now connected to Supabase!**
