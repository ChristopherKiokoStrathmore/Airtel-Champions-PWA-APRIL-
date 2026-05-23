# 🚀 IMPLEMENTATION ROADMAP - START BUILDING NOW!

**Sales Intelligence Network - Airtel Kenya**  
**Start Date**: Week of December 30, 2024  
**Target Launch**: Week of March 10, 2025 (10 weeks)  
**Board Approval**: ✅ UNANIMOUS (13/13)

---

## 📅 10-WEEK BUILD SCHEDULE

```
Week 1-4:  Core App (No ML visible)
Week 5-6:  On-Device ML (TFLite)
Week 7-8:  Server-Side ML (Cached predictions)
Week 9-10: Advanced ML (Real-time features)

Launch:    Week 10 - Soft launch (50 SEs)
           Week 12 - Full rollout (662 SEs)
```

---

## 🎯 WEEK 1: FOUNDATION

### **Day 1: Backend Changes** (Marcus + Priya)

**Morning: Database Schema**
```sql
-- Run in Supabase SQL Editor

-- 1. ML Predictions Cache
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type VARCHAR(50) NOT NULL,  -- 'hotspot', 'behavior', 'ranking'
  entity_id UUID,  -- SE ID or region ID
  prediction_data JSONB NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  reasoning JSONB,  -- Explainability
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_type_entity ON ml_predictions(prediction_type, entity_id);
CREATE INDEX idx_predictions_valid ON ml_predictions(valid_until) WHERE valid_until > NOW();

-- 2. Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  enabled_for_all BOOLEAN DEFAULT FALSE,
  enabled_for_users UUID[] DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default flags
INSERT INTO feature_flags (feature_name, description, rollout_percentage) VALUES
  ('ml_quality_scoring', 'Real-time photo quality scoring', 0),
  ('ml_brand_detection', 'Automatic competitor brand detection', 0),
  ('ml_hotspot_predictions', 'Competitor hotspot predictions', 0),
  ('ml_behavior_insights', 'Personalized behavior insights', 0),
  ('ml_real_time_strategy', 'Real-time counter-strategy recommendations', 0);

-- 3. ML Model Versions
CREATE TABLE ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  is_active BOOLEAN DEFAULT FALSE,
  performance_metrics JSONB DEFAULT '{}',
  device_compatibility JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_name, version)
);

-- Insert placeholder models
INSERT INTO ml_model_versions (model_name, version, is_active) VALUES
  ('quality_scorer', 'v1.0.0', true),
  ('brand_detector', 'v1.0.0', true);
```

**Afternoon: Edge Functions**
```typescript
// Create: /supabase/functions/ml-gateway/index.tsx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { method, url } = req
  const { pathname } = new URL(url)

  // CORS
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Route: Get cached predictions
    if (pathname === '/predictions' && method === 'GET') {
      const { searchParams } = new URL(url)
      const type = searchParams.get('type')
      const entityId = searchParams.get('entity_id')

      // Check cache first
      const { data: cached } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('prediction_type', type)
        .eq('entity_id', entityId)
        .gt('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (cached) {
        return new Response(
          JSON.stringify({
            prediction: cached.prediction_data,
            confidence: cached.confidence,
            reasoning: cached.reasoning,
            cached: true,
            valid_until: cached.valid_until
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If not cached, fetch from ML service
      // (For now, return placeholder)
      return new Response(
        JSON.stringify({
          prediction: { value: 0.75 },
          confidence: 0.80,
          reasoning: ['Placeholder - ML service not yet deployed'],
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: Check feature flag
    if (pathname === '/feature-flag' && method === 'GET') {
      const { searchParams } = new URL(url)
      const featureName = searchParams.get('name')
      const userId = searchParams.get('user_id')

      const { data: flag } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_name', featureName)
        .single()

      if (!flag) {
        return new Response(
          JSON.stringify({ enabled: false, reason: 'Flag not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if enabled
      let enabled = false
      
      if (flag.enabled_for_all) {
        enabled = true
      } else if (flag.enabled_for_users?.includes(userId)) {
        enabled = true
      } else if (flag.rollout_percentage > 0) {
        // Simple hash-based rollout
        const hash = userId ? hashCode(userId) : 0
        enabled = (Math.abs(hash) % 100) < flag.rollout_percentage
      }

      return new Response(
        JSON.stringify({ 
          enabled,
          feature: flag.feature_name,
          description: flag.description
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Not Found', { status: 404 })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}
```

**Deploy Edge Function:**
```bash
supabase functions deploy ml-gateway --project-ref xspogpfohjmkykfjadhk
```

---

### **Day 2-3: Flutter Project Setup** (David)

**Create Project:**
```bash
flutter create sales_intelligence_airtel
cd sales_intelligence_airtel

# Add dependencies
flutter pub add supabase_flutter
flutter pub add tflite_flutter
flutter pub add tflite_flutter_helper
flutter pub add camera
flutter pub add geolocator
flutter pub add permission_handler
flutter pub add image_picker
flutter pub add cached_network_image
flutter pub add flutter_riverpod
flutter pub add go_router
flutter pub add hive_flutter
flutter pub add shared_preferences
flutter pub add connectivity_plus
flutter pub add dio
flutter pub add flutter_animate
flutter pub add confetti
flutter pub add audioplayers
flutter pub add image
flutter pub add path_provider
flutter pub add uuid
```

**Project Structure:**
```bash
mkdir -p lib/{app,core/{services,models,utils},features/{auth,home,capture,leaderboard,profile,intelligence},widgets}
mkdir -p assets/{images,ml_models,sounds}
```

**Core Services Setup:**
```dart
// lib/core/services/supabase_service.dart

import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static const String supabaseUrl = 'https://xspogpfohjmkykfjadhk.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  
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

```dart
// lib/core/services/feature_flag_service.dart

import 'package:dio/dio.dart';

class FeatureFlagService {
  final Dio _dio = Dio();
  final String _baseUrl = 'https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/ml-gateway';
  final Map<String, bool> _cache = {};
  
  Future<bool> isEnabled(String featureName, {String? userId}) async {
    // Check cache first
    if (_cache.containsKey(featureName)) {
      return _cache[featureName]!;
    }
    
    try {
      final response = await _dio.get(
        '$_baseUrl/feature-flag',
        queryParameters: {
          'name': featureName,
          if (userId != null) 'user_id': userId,
        },
      );
      
      final enabled = response.data['enabled'] as bool;
      _cache[featureName] = enabled;
      return enabled;
    } catch (e) {
      // Fail open (enable feature) or fail closed (disable feature)?
      // For ML features, fail closed (disable on error)
      return false;
    }
  }
  
  void clearCache() {
    _cache.clear();
  }
}
```

```dart
// lib/core/services/ml_service.dart

class MLService {
  final FeatureFlagService _featureFlags;
  final String _userId;
  
  MLService(this._featureFlags, this._userId);
  
  // Tier 1: On-device (TFLite)
  Future<double?> scorePhotoQuality(File image) async {
    if (!await _featureFlags.isEnabled('ml_quality_scoring', userId: _userId)) {
      return null; // Feature disabled
    }
    
    // TODO: Implement TFLite inference (Week 5)
    return null;
  }
  
  // Tier 2: Cached (Supabase)
  Future<Map<String, dynamic>?> getHotspots(String region) async {
    if (!await _featureFlags.isEnabled('ml_hotspot_predictions', userId: _userId)) {
      return null;
    }
    
    try {
      final response = await Dio().get(
        'https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/ml-gateway/predictions',
        queryParameters: {
          'type': 'hotspot',
          'entity_id': region,
        },
      );
      
      return response.data;
    } catch (e) {
      return null;
    }
  }
  
  // More methods to be added...
}
```

---

### **Day 4-5: Authentication Flow** (David)

```dart
// lib/features/auth/screens/login_screen.dart

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _employeeIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Convert employee ID to email format
      final email = '${_employeeIdController.text}@airtel.co.ke';
      
      final response = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: _passwordController.text,
      );

      if (response.session != null) {
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/home');
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: Colors.red,
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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Airtel Logo (add to assets)
                const Icon(
                  Icons.signal_cellular_alt,
                  size: 80,
                  color: Color(0xFFE20000),
                ),
                const SizedBox(height: 40),
                
                Text(
                  'Sales Intelligence',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to start capturing intel',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 40),
                
                // Employee ID
                TextFormField(
                  controller: _employeeIdController,
                  decoration: InputDecoration(
                    labelText: 'Employee ID',
                    hintText: 'SE1000',
                    prefixIcon: const Icon(Icons.badge),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Employee ID is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Password
                TextFormField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                
                // Login Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE20000),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'SIGN IN',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _employeeIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

### **Day 6-7: Home Screen** (David)

```dart
// lib/features/home/screens/home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;
    
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(context, user),
              const SizedBox(height: 24),
              
              // Rank & Points Card
              _buildRankCard(context),
              const SizedBox(height: 24),
              
              // Main Capture Button (Steve Jobs approved!)
              _buildCaptureButton(context),
              const SizedBox(height: 24),
              
              // ML-Powered Mission (conditionally shown)
              _buildTodaysMission(context),
              const SizedBox(height: 16),
              
              // Progress
              _buildProgressSection(context),
              const SizedBox(height: 16),
              
              // Quick Stats
              _buildQuickStats(context),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  Widget _buildHeader(BuildContext context, User? user) {
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: const Color(0xFFE20000),
          child: Text(
            user?.userMetadata?['full_name']?.substring(0, 1).toUpperCase() ?? 'U',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user?.userMetadata?['full_name'] ?? 'User',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                user?.userMetadata?['employee_id'] ?? 'SE1000',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRankCard(BuildContext context) {
    // TODO: Fetch real data
    final rank = 23;
    final totalSEs = 662;
    final points = 1247;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE20000), Color(0xFFB00000)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'YOUR RANK',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '#$rank of $totalSEs',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'TOTAL POINTS',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.star, color: Color(0xFFFFD700), size: 24),
                  const SizedBox(width: 8),
                  Text(
                    '$points',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCaptureButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 120,
      child: ElevatedButton(
        onPressed: () {
          Navigator.of(context).pushNamed('/capture');
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE20000),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 4,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt, size: 48, color: Colors.white),
            const SizedBox(height: 8),
            const Text(
              '📸 CAPTURE INTEL',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Earn 50-200 points',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodaysMission(BuildContext context) {
    // TODO: Fetch from ML service (Week 7)
    // For now, placeholder
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFB74D)),
      ),
      child: Row(
        children: [
          const Icon(Icons.flag, color: Color(0xFFFF9800), size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '🎯 TODAY\'S MISSION',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFE65100),
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Focus on Westlands area',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'High competitor activity predicted',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ... more widgets
}
```

---

## 📊 SUCCESS METRICS (Week 1)

**Backend:**
- ✅ ml_predictions table created
- ✅ feature_flags table created
- ✅ ML gateway deployed
- ✅ Feature flag API working

**Flutter:**
- ✅ Project structure complete
- ✅ Supabase integration working
- ✅ Authentication flow complete
- ✅ Home screen rendering

---

## 🎯 WEEKS 2-10: FULL IMPLEMENTATION

*[Detailed day-by-day plan for remaining 9 weeks - similar structure to Week 1]*

---

## ✅ READY TO START!

**All Board Members Approved**: ✅  
**Architecture Finalized**: ✅  
**Backend Changes Defined**: ✅  
**Flutter Structure Ready**: ✅  
**10-Week Timeline**: ✅  

**START DATE**: December 30, 2024  
**TARGET LAUNCH**: March 10, 2025  

---

🚀 **LET'S BUILD THIS!** 🇰🇪
