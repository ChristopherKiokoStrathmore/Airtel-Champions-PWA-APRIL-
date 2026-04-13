-- ============================================================================
-- OFFLINE SYNC SCHEMA
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- Creates tables for offline sync functionality
-- ============================================================================

-- Add client_id column to submissions table (if not exists)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON submissions(client_id);

-- Add created_at_device column to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS created_at_device TIMESTAMPTZ;

-- ============================================================================
-- SYNC LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  client_id VARCHAR(50),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  sync_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user_created ON sync_log(user_id, created_at DESC);
CREATE INDEX idx_sync_log_client_id ON sync_log(client_id);
CREATE INDEX idx_sync_log_status ON sync_log(status, created_at DESC);

COMMENT ON TABLE sync_log IS 'Logs all sync operations for debugging and monitoring';
COMMENT ON COLUMN sync_log.operation IS 'Type of sync operation (e.g. SYNC_SUBMISSION, SYNC_DELETE)';
COMMENT ON COLUMN sync_log.entity_type IS 'Type of entity being synced (e.g. submission, achievement)';
COMMENT ON COLUMN sync_log.entity_id IS 'Server-side ID of the synced entity';
COMMENT ON COLUMN sync_log.client_id IS 'Client-side ID used for deduplication';

-- ============================================================================
-- SYNC CONFLICTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(50) NOT NULL,
  client_data JSONB NOT NULL,
  server_submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  server_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolution_strategy VARCHAR(20) CHECK (resolution_strategy IN ('use_server', 'use_client', 'merge')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_conflicts_user_status ON sync_conflicts(user_id, status);
CREATE INDEX idx_sync_conflicts_client_id ON sync_conflicts(client_id);

COMMENT ON TABLE sync_conflicts IS 'Tracks conflicts detected during offline sync';
COMMENT ON COLUMN sync_conflicts.client_data IS 'Data from mobile app (offline submission)';
COMMENT ON COLUMN sync_conflicts.server_data IS 'Existing data on server';
COMMENT ON COLUMN sync_conflicts.resolution_strategy IS 'How the conflict was resolved';

-- ============================================================================
-- DEVICE TOKENS TABLE (FOR PUSH NOTIFICATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_device_tokens_user_active ON device_tokens(user_id, is_active);
CREATE INDEX idx_device_tokens_token ON device_tokens(token) WHERE is_active = true;

COMMENT ON TABLE device_tokens IS 'Stores FCM device tokens for push notifications';
COMMENT ON COLUMN device_tokens.token IS 'FCM registration token';
COMMENT ON COLUMN device_tokens.platform IS 'Mobile platform (iOS or Android)';
COMMENT ON COLUMN device_tokens.is_active IS 'False if token is invalid or user logged out';

-- ============================================================================
-- NOTIFICATION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT true,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_history_user_sent ON notification_history(user_id, sent_at DESC);

COMMENT ON TABLE notification_history IS 'Logs all notifications sent to users';

-- ============================================================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  send_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_send_at ON scheduled_notifications(send_at) WHERE status = 'pending';
CREATE INDEX idx_scheduled_notifications_user_status ON scheduled_notifications(user_id, status);

COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled to be sent at a future time';

-- ============================================================================
-- API KEYS TABLE (FOR API KEY ROTATION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash_active ON api_keys(key_hash, is_active);
CREATE INDEX idx_api_keys_expires ON api_keys(expires_at) WHERE is_active = true;

COMMENT ON TABLE api_keys IS 'Managed API keys for secure access';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permissions (e.g. read:submissions, write:submissions)';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up old sync logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_log
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_sync_logs IS 'Deletes sync logs older than 30 days';

-- Function to clean up old notification history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_history
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Deletes notification history older than 90 days';

-- Function to deactivate expired API keys
CREATE OR REPLACE FUNCTION deactivate_expired_api_keys()
RETURNS void AS $$
BEGIN
  UPDATE api_keys
  SET is_active = false
  WHERE expires_at < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deactivate_expired_api_keys IS 'Automatically deactivates expired API keys';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data

-- sync_log policies
CREATE POLICY "Users can view their own sync logs"
  ON sync_log FOR SELECT
  USING (auth.uid() = user_id);

-- sync_conflicts policies
CREATE POLICY "Users can view their own conflicts"
  ON sync_conflicts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can resolve their own conflicts"
  ON sync_conflicts FOR UPDATE
  USING (auth.uid() = user_id);

-- device_tokens policies
CREATE POLICY "Users can manage their own devices"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id);

-- notification_history policies
CREATE POLICY "Users can view their own notifications"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- scheduled_notifications policies
CREATE POLICY "Users can view their scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- api_keys policies (admin only)
CREATE POLICY "Only admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to service role (for Edge Functions)
GRANT ALL ON sync_log TO service_role;
GRANT ALL ON sync_conflicts TO service_role;
GRANT ALL ON device_tokens TO service_role;
GRANT ALL ON notification_history TO service_role;
GRANT ALL ON scheduled_notifications TO service_role;
GRANT ALL ON api_keys TO service_role;

-- Grant read access to authenticated users (RLS will enforce)
GRANT SELECT ON sync_log TO authenticated;
GRANT SELECT, UPDATE ON sync_conflicts TO authenticated;
GRANT ALL ON device_tokens TO authenticated;
GRANT SELECT ON notification_history TO authenticated;
GRANT SELECT ON scheduled_notifications TO authenticated;

-- ============================================================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Add sample API key for development
INSERT INTO api_keys (key_hash, name, is_active, scopes)
VALUES (
  'dev-key-hash',
  'Development API Key',
  true,
  ARRAY['read:*', 'write:*']
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Offline sync schema created successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - sync_log';
  RAISE NOTICE '  - sync_conflicts';
  RAISE NOTICE '  - device_tokens';
  RAISE NOTICE '  - notification_history';
  RAISE NOTICE '  - scheduled_notifications';
  RAISE NOTICE '  - api_keys';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run materialized-views.sql';
  RAISE NOTICE '  2. Test offline sync endpoints';
  RAISE NOTICE '  3. Configure FCM_SERVER_KEY environment variable';
END $$;
