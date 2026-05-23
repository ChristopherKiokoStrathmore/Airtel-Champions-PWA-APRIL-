# 🗄️ WEEK 1 DAY 1 - BACKEND SQL SCRIPTS

**Run these in Supabase SQL Editor**  
**Project**: xspogpfohjmkykfjadhk.supabase.co

---

## 📍 WHERE TO RUN THESE SCRIPTS

1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**
4. Copy-paste each script below
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

---

## 🗃️ SCRIPT 1: ML PREDICTIONS CACHE TABLE

```sql
-- ML Predictions Cache Table
-- Purpose: Store ML predictions to avoid repeated API calls
-- Used by: Flutter app (Tier 2), ML Gateway

CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What type of prediction?
  prediction_type VARCHAR(50) NOT NULL,  -- 'hotspot', 'behavior', 'ranking', 'strategy'
  
  -- For which entity? (SE, region, team, etc.)
  entity_id UUID,
  
  -- The actual prediction data (flexible JSON)
  prediction_data JSONB NOT NULL,
  
  -- How confident is the model? (0.0 - 1.0)
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Explainability: Why was this predicted?
  reasoning JSONB,
  
  -- Cache expiration
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_predictions_type_entity 
  ON ml_predictions(prediction_type, entity_id);

-- Index on valid_until for cache expiration queries
-- Note: Removed NOW() predicate as it's not immutable
CREATE INDEX idx_predictions_valid 
  ON ml_predictions(valid_until);

-- Comments for documentation
COMMENT ON TABLE ml_predictions IS 'Cache for ML model predictions to improve mobile app performance';
COMMENT ON COLUMN ml_predictions.prediction_type IS 'Type: hotspot, behavior, ranking, strategy';
COMMENT ON COLUMN ml_predictions.reasoning IS 'Explainability data for transparent AI';
```

**Example Data**:
```sql
-- Insert a sample hotspot prediction
INSERT INTO ml_predictions (
  prediction_type,
  entity_id,
  prediction_data,
  confidence,
  reasoning,
  valid_until
) VALUES (
  'hotspot',
  'e8c9f3a7-1234-5678-9abc-def012345678',  -- Region ID
  '{"location": "Westlands", "intensity": 0.87, "recommended_ses": 5}'::jsonb,
  0.87,
  '["Safaricom launched 3 promotions here last Friday", "Similar pattern to December 2023"]'::jsonb,
  NOW() + INTERVAL '24 hours'
);
```

---

## 🚩 SCRIPT 2: FEATURE FLAGS TABLE

```sql
-- Feature Flags Table
-- Purpose: Control ML feature rollout with A/B testing
-- Used by: Flutter app, ML Gateway

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Unique feature name
  feature_name VARCHAR(100) UNIQUE NOT NULL,
  
  -- Human-readable description
  description TEXT,
  
  -- Enable for everyone?
  enabled_for_all BOOLEAN DEFAULT FALSE,
  
  -- Enable for specific users (UUID array)
  enabled_for_users UUID[] DEFAULT '{}',
  
  -- Gradual rollout percentage (0-100)
  rollout_percentage INTEGER DEFAULT 0 
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- Additional metadata (for analytics, targeting, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on feature name for fast lookups
CREATE INDEX idx_feature_flags_name ON feature_flags(feature_name);

-- Comments
COMMENT ON TABLE feature_flags IS 'Feature flags for A/B testing and gradual rollout';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who see this feature (0-100)';
```

**Insert Default Flags**:
```sql
-- Insert all ML feature flags (initially disabled)
INSERT INTO feature_flags (feature_name, description, rollout_percentage) VALUES
  ('ml_quality_scoring', 'Real-time photo quality scoring using TFLite', 0),
  ('ml_brand_detection', 'Automatic competitor brand detection', 0),
  ('ml_hotspot_predictions', 'Competitor hotspot predictions', 0),
  ('ml_behavior_insights', 'Personalized behavior insights', 0),
  ('ml_real_time_strategy', 'Real-time counter-strategy recommendations', 0),
  ('ml_rank_predictions', 'Leaderboard rank predictions', 0),
  ('ml_personalized_goals', 'ML-powered personalized daily goals', 0);

-- Verify insertion
SELECT feature_name, rollout_percentage, enabled_for_all 
FROM feature_flags 
ORDER BY feature_name;
```

---

## 📦 SCRIPT 3: ML MODEL VERSIONS TABLE

```sql
-- ML Model Versions Table
-- Purpose: Track TFLite model versions for dynamic loading
-- Used by: Flutter app (downloads models), Admin dashboard

CREATE TABLE ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model identifier
  model_name VARCHAR(100) NOT NULL,
  
  -- Semantic version (e.g., "1.0.0", "1.2.3")
  version VARCHAR(20) NOT NULL,
  
  -- Download URL (Supabase Storage or CDN)
  file_url TEXT,
  
  -- File size in bytes
  file_size_bytes BIGINT,
  
  -- Is this the active version?
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Performance metrics from testing
  performance_metrics JSONB DEFAULT '{}',
  
  -- Device compatibility info
  device_compatibility JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique model name + version combination
  UNIQUE(model_name, version)
);

-- Index for fast lookups of active models
CREATE INDEX idx_model_versions_active 
  ON ml_model_versions(model_name, is_active) 
  WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE ml_model_versions IS 'Track TFLite model versions for dynamic loading';
COMMENT ON COLUMN ml_model_versions.performance_metrics IS 'Accuracy, latency, size metrics';
COMMENT ON COLUMN ml_model_versions.device_compatibility IS 'Min Android/iOS versions, CPU/GPU requirements';
```

**Insert Placeholder Models**:
```sql
-- Insert placeholder model versions
INSERT INTO ml_model_versions (
  model_name, 
  version, 
  is_active, 
  performance_metrics,
  device_compatibility
) VALUES 
  (
    'quality_scorer', 
    'v1.0.0', 
    TRUE,
    '{"accuracy": 0.89, "latency_ms": 45, "size_mb": 3.8}'::jsonb,
    '{"min_android": 24, "min_ios": 12, "requires_gpu": false}'::jsonb
  ),
  (
    'brand_detector', 
    'v1.0.0', 
    TRUE,
    '{"precision": 0.85, "recall": 0.82, "latency_ms": 120, "size_mb": 5.2}'::jsonb,
    '{"min_android": 24, "min_ios": 12, "requires_gpu": false}'::jsonb
  );

-- Verify insertion
SELECT model_name, version, is_active, file_size_bytes
FROM ml_model_versions
ORDER BY model_name, created_at DESC;
```

---

## 🔄 SCRIPT 4: HELPER FUNCTIONS

```sql
-- Function to get active model version
CREATE OR REPLACE FUNCTION get_active_model(model_name_param VARCHAR)
RETURNS TABLE (
  version VARCHAR,
  file_url TEXT,
  file_size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.version,
    m.file_url,
    m.file_size_bytes
  FROM ml_model_versions m
  WHERE m.model_name = model_name_param
    AND m.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if feature is enabled for user
CREATE OR REPLACE FUNCTION is_feature_enabled(
  feature_name_param VARCHAR,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  user_hash INTEGER;
BEGIN
  -- Get feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE feature_name = feature_name_param;
  
  -- If flag doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If enabled for all, return true
  IF flag_record.enabled_for_all THEN
    RETURN TRUE;
  END IF;
  
  -- If user is in enabled list, return true
  IF user_id_param = ANY(flag_record.enabled_for_users) THEN
    RETURN TRUE;
  END IF;
  
  -- Check rollout percentage using consistent hashing
  IF flag_record.rollout_percentage > 0 THEN
    -- Simple hash: sum of bytes in UUID
    user_hash := (hashtext(user_id_param::TEXT) % 100);
    IF user_hash < flag_record.rollout_percentage THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Default: disabled
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT is_feature_enabled('ml_quality_scoring', auth.uid());
```

---

## 🔒 SCRIPT 5: ROW LEVEL SECURITY (RLS)

```sql
-- Enable RLS on new tables
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_versions ENABLE ROW LEVEL SECURITY;

-- ML Predictions: SEs can read predictions for their entities
CREATE POLICY "Users can read their own predictions"
  ON ml_predictions
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if prediction is for this user
    entity_id = auth.uid()
    OR
    -- Or if prediction is for their region (check users table)
    entity_id IN (
      SELECT region FROM users WHERE id = auth.uid()
    )
    OR
    -- Or if prediction type is public (e.g., general hotspots)
    prediction_type IN ('hotspot', 'ranking')
  );

-- Only backend can insert/update predictions
CREATE POLICY "Service role can manage predictions"
  ON ml_predictions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Feature Flags: Everyone can read (for checking if feature is enabled)
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can modify feature flags"
  ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Model Versions: Everyone can read (to download models)
CREATE POLICY "Anyone can read model versions"
  ON ml_model_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can manage models
CREATE POLICY "Service role can manage models"
  ON ml_model_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## ✅ VERIFICATION QUERIES

Run these to confirm everything worked:

```sql
-- 1. Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('ml_predictions', 'feature_flags', 'ml_model_versions')
ORDER BY table_name;

-- Should return 3 rows

-- 2. Check feature flags were inserted
SELECT 
  feature_name, 
  rollout_percentage, 
  enabled_for_all,
  description
FROM feature_flags
ORDER BY feature_name;

-- Should return 7 ML feature flags

-- 3. Check model versions
SELECT 
  model_name, 
  version, 
  is_active,
  performance_metrics->>'accuracy' as accuracy,
  performance_metrics->>'latency_ms' as latency_ms
FROM ml_model_versions
ORDER BY model_name;

-- Should return 2 models (quality_scorer, brand_detector)

-- 4. Check indexes exist
SELECT 
  indexname, 
  tablename
FROM pg_indexes
WHERE tablename IN ('ml_predictions', 'feature_flags', 'ml_model_versions')
ORDER BY tablename, indexname;

-- Should return multiple indexes

-- 5. Test helper function
SELECT get_active_model('quality_scorer');

-- Should return version info
```

---

## 🎯 EXPECTED RESULTS

After running all scripts, you should have:

✅ **3 New Tables**:
- `ml_predictions` (empty, ready for data)
- `feature_flags` (7 flags, all at 0%)
- `ml_model_versions` (2 placeholder models)

✅ **6 Indexes** for fast queries

✅ **2 Helper Functions**:
- `get_active_model(model_name)`
- `is_feature_enabled(feature_name, user_id)`

✅ **6 RLS Policies** for security

---

## 📊 SAMPLE DATA QUERIES

### Enable a Feature for Testing:
```sql
-- Enable quality scoring for 10% of users
UPDATE feature_flags 
SET rollout_percentage = 10
WHERE feature_name = 'ml_quality_scoring';
```

### Enable a Feature for Specific User:
```sql
-- Enable for specific SE (replace with actual UUID)
UPDATE feature_flags
SET enabled_for_users = array_append(enabled_for_users, 'USER_UUID_HERE'::uuid)
WHERE feature_name = 'ml_quality_scoring';
```

### Insert a Test Prediction:
```sql
-- Insert a hotspot prediction for testing
INSERT INTO ml_predictions (
  prediction_type,
  entity_id,
  prediction_data,
  confidence,
  reasoning,
  valid_until
) VALUES (
  'hotspot',
  (SELECT id FROM users WHERE employee_id = 'SE1000' LIMIT 1),
  jsonb_build_object(
    'location', 'Westlands',
    'intensity', 0.87,
    'competitor', 'Safaricom',
    'recommended_ses', 5
  ),
  0.87,
  jsonb_build_array(
    'Safaricom activity 40% above baseline',
    'Similar pattern observed last Friday',
    'Holiday season peak period'
  ),
  NOW() + INTERVAL '24 hours'
);
```

### Query Predictions:
```sql
-- Get all valid predictions
SELECT 
  prediction_type,
  prediction_data->>'location' as location,
  confidence,
  reasoning,
  valid_until
FROM ml_predictions
WHERE valid_until > NOW()
ORDER BY created_at DESC;
```

---

## 🚨 TROUBLESHOOTING

### If you get "permission denied":
```sql
-- Run as service_role or use Supabase dashboard SQL editor
-- Make sure you're logged in to Supabase
```

### If tables already exist:
```sql
-- Drop tables if you need to start fresh
DROP TABLE IF EXISTS ml_predictions CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS ml_model_versions CASCADE;

-- Then re-run the CREATE TABLE scripts
```

### To reset feature flags:
```sql
-- Set all ML features to 0%
UPDATE feature_flags 
SET rollout_percentage = 0, enabled_for_all = FALSE, enabled_for_users = '{}'
WHERE feature_name LIKE 'ml_%';
```

---

## ✅ NEXT STEP

After running these scripts successfully, proceed to:

**Day 1 Afternoon**: Deploy ML Gateway Edge Function

(Instructions in `/🚀_IMPLEMENTATION_ROADMAP.md`)

---

🚀 **Copy these scripts to Supabase SQL Editor and run them!**