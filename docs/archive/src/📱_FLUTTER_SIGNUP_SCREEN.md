# 📱 FLUTTER SIGNUP SCREEN

**Complete signup screen for Flutter app with backend integration**

---

## 📝 FILE: lib/features/auth/screens/signup_screen.dart

```dart
import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../core/services/supabase_service.dart';
import 'login_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Clean phone number
      final cleanPhone = _phoneController.text
          .trim()
          .replaceAll(RegExp(r'[\s\-\(\)]'), '');

      print('🔄 Starting signup process...');
      print('📧 Email: ${_emailController.text}');
      print('📱 Phone: $cleanPhone');

      // Check if phone number already exists
      final existingUser = await SupabaseService.client
          .from('users')
          .select('phone_number')
          .eq('phone_number', cleanPhone)
          .maybeSingle();

      if (existingUser != null) {
        throw Exception('Phone number already registered. Please login.');
      }

      // Sign up the user
      final response = await SupabaseService.client.auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        data: {
          'full_name': _fullNameController.text.trim(),
          'phone': cleanPhone,  // ✅ Use 'phone' (not 'phone_number')
        },
      );

      if (response.user != null && mounted) {
        print('✅ Signup successful!');
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Account created successfully! You can now login.'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 3),
          ),
        );

        // Wait a bit then navigate to login
        await Future.delayed(const Duration(seconds: 1));
        
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      }
    } catch (e) {
      print('❌ Signup error: $e');
      
      String errorMessage = 'Signup failed. Please try again.';
      
      if (e.toString().contains('already registered')) {
        errorMessage = 'Phone number already registered. Please login.';
      } else if (e.toString().contains('email')) {
        errorMessage = 'Email already in use. Please use a different email.';
      } else if (e.toString().contains('weak password')) {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.signal_cellular_alt,
                    size: 48,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                const Text(
                  'Join Sales Intelligence',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create your account to start earning points',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 32),

                // Full Name Field
                TextFormField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'John Kamau',
                    prefixIcon: Icon(Icons.person),
                  ),
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Full name is required';
                    }
                    if (value.length < 3) {
                      return 'Name must be at least 3 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email Field
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'john@airtel.co.ke',
                    prefixIcon: Icon(Icons.email),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Email is required';
                    }
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Phone Number Field
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    hintText: '0712345678',
                    prefixIcon: Icon(Icons.phone),
                    helperText: 'Enter your phone number',
                  ),
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Phone number is required';
                    }
                    final cleanPhone = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
                    if (cleanPhone.length < 9) {
                      return 'Please enter a valid phone number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password Field
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    hintText: 'At least 6 characters',
                    prefixIcon: Icon(Icons.lock),
                  ),
                  obscureText: true,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password is required';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Confirm Password Field
                TextFormField(
                  controller: _confirmPasswordController,
                  decoration: const InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Re-enter your password',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _handleSignup(),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                // Signup Button
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSignup,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('CREATE ACCOUNT'),
                  ),
                ),
                const SizedBox(height: 24),

                // Info box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue[200]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[800], size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your account will be created with an auto-generated Employee ID',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue[800],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      child: const Text('Login here'),
                    ),
                  ],
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

## 🔄 UPDATE: lib/features/auth/screens/login_screen.dart

Add a "Sign Up" button to the login screen:

```dart
// Add this at the bottom of the login screen, before the closing widgets

const SizedBox(height: 16),

// Sign up link
Row(
  mainAxisAlignment: MainAxisAlignment.center,
  children: [
    Text(
      "Don't have an account? ",
      style: TextStyle(color: Colors.grey[600]),
    ),
    TextButton(
      onPressed: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const SignupScreen()),
        );
      },
      child: const Text('Sign up here'),
    ),
  ],
),
```

---

## 🔄 UPDATE: lib/main.dart

Add the import for SignupScreen:

```dart
import 'features/auth/screens/signup_screen.dart';
```

---

## ✅ HOW IT WORKS

### **Step 1: User fills signup form**
- Full Name: "John Kamau"
- Email: "john@airtel.co.ke"
- Phone: "0712345678"
- Password: "SecurePass123"
- Confirm Password: "SecurePass123"

### **Step 2: App validates data**
- All fields required
- Email must contain @
- Phone must be 9+ digits
- Password must be 6+ characters
- Passwords must match

### **Step 3: App checks for duplicates**
```dart
// Check if phone already exists
SELECT * FROM users WHERE phone_number = '0712345678'
```

### **Step 4: Create auth user**
```dart
supabase.auth.signUp(
  email: 'john@airtel.co.ke',
  password: 'SecurePass123',
  data: {
    'full_name': 'John Kamau',
    'phone': '0712345678',
  }
)
```

### **Step 5: Database trigger fires**
- Auto-creates record in `users` table
- Generates employee ID (SE1000, SE1001, etc.)
- Sets initial rank and points to 0

### **Step 6: Success!**
- User sees success message
- Redirected to login screen
- Can now login with phone + password

---

## 🎯 FEATURES INCLUDED

### **Validation**
- ✅ All fields required
- ✅ Email format check
- ✅ Phone number length check
- ✅ Password strength check
- ✅ Password match check
- ✅ Duplicate phone check

### **UX**
- ✅ Loading spinner during signup
- ✅ Error messages (specific errors)
- ✅ Success message
- ✅ Auto-redirect to login
- ✅ Back button to login
- ✅ Professional design

### **Backend**
- ✅ Creates auth user
- ✅ Stores user metadata
- ✅ Auto-generates employee ID
- ✅ Sets default region
- ✅ Initializes rank and points

---

## 🧪 TEST THE SIGNUP

### **Test User 1:**
```
Full Name: Test User One
Email: testuser1@airtel.co.ke
Phone: 0799999991
Password: Test123456!
```

### **Test User 2:**
```
Full Name: Test User Two
Email: testuser2@airtel.co.ke
Phone: 0799999992
Password: Test123456!
```

### **Expected Flow:**
1. Fill form → Click "CREATE ACCOUNT"
2. See loading spinner
3. See "Account created successfully!"
4. Redirected to login screen
5. Login with phone + password
6. See home screen!

---

## 🚨 ERROR HANDLING

### **"Phone number already registered"**
- Phone exists in database
- Tell user to login instead

### **"Email already in use"**
- Email exists in auth.users
- Ask for different email

### **"Password is too weak"**
- Password < 6 characters
- Ask for stronger password

### **"Passwords do not match"**
- Confirm password field doesn't match
- User must re-enter

---

## ✅ COMPLETE CHECKLIST

- [ ] Created `/🔧_SIGNUP_BACKEND_SETUP.sql`
- [ ] Run SQL in Supabase (creates trigger)
- [ ] Created `signup_screen.dart`
- [ ] Updated `login_screen.dart` (add signup link)
- [ ] Test signup in web app
- [ ] Test signup in Flutter app
- [ ] Verify user created in database
- [ ] Test login with new user

---

🎉 **Your users can now create their own accounts!**