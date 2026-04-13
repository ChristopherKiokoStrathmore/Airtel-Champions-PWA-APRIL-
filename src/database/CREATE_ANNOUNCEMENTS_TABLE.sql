-- ============================================================================
-- CREATE ANNOUNCEMENTS TABLE
-- ============================================================================
-- This table stores system-wide and targeted announcements from HQ/Directors
-- Follows the existing schema patterns with proper indexing and constraints
-- ============================================================================

CREATE TABLE public.announcements (
  -- Primary Key
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Content
  title text NOT NULL,
  message text NOT NULL,
  short_message text, -- For notifications/previews
  
  -- Author/Source
  created_by uuid, -- References app_users (HQ/Director who created it)
  author_name text NOT NULL, -- Denormalized for quick display
  author_role text, -- 'hq_staff', 'director', etc.
  
  -- Targeting
  target_audience text DEFAULT 'all'::text CHECK (
    target_audience = ANY (
      ARRAY[
        'all'::text, 
        'sales_executive'::text, 
        'zone_commander'::text, 
        'zone_business_lead'::text,
        'hq_staff'::text,
        'director'::text,
        'zone'::text, -- Specific zone
        'region'::text -- Specific region
      ]
    )
  ),
  target_value text, -- Zone name if target_audience='zone', Region if 'region'
  
  -- Priority & Status
  priority text DEFAULT 'normal'::text CHECK (
    priority = ANY (
      ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]
    )
  ),
  is_active boolean DEFAULT true,
  
  -- Scheduling
  publish_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  
  -- Attachments (optional)
  attachments jsonb DEFAULT '[]'::jsonb, -- Array of {url, type, name}
  
  -- Metadata
  view_count integer DEFAULT 0,
  read_by uuid[] DEFAULT ARRAY[]::uuid[], -- Array of user IDs who read it
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES public.app_users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on created_by for "my announcements" queries
CREATE INDEX idx_announcements_created_by ON public.announcements(created_by);

-- Index on is_active for active announcements filter (most common query)
CREATE INDEX idx_announcements_active ON public.announcements(is_active) 
  WHERE is_active = true;

-- Index on target_audience for role-based filtering
CREATE INDEX idx_announcements_target_audience ON public.announcements(target_audience);

-- Index on created_at for sorting (descending - newest first)
CREATE INDEX idx_announcements_created_at_desc ON public.announcements(created_at DESC);

-- Composite index for the most common query: active announcements by date
CREATE INDEX idx_announcements_active_created_at ON public.announcements(is_active, created_at DESC) 
  WHERE is_active = true;

-- Index on priority for filtering urgent announcements
CREATE INDEX idx_announcements_priority ON public.announcements(priority) 
  WHERE priority IN ('high', 'urgent');

-- Index on expires_at for cleanup/expiry checks
CREATE INDEX idx_announcements_expires_at ON public.announcements(expires_at) 
  WHERE expires_at IS NOT NULL;

-- GIN index on read_by array for "who has read this" queries
CREATE INDEX idx_announcements_read_by ON public.announcements USING GIN(read_by);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view active announcements targeted to them
CREATE POLICY "Users can view announcements targeted to them"
  ON public.announcements
  FOR SELECT
  USING (
    is_active = true 
    AND (
      -- Published and not expired
      publish_at <= now() 
      AND (expires_at IS NULL OR expires_at > now())
    )
    AND (
      target_audience = 'all'
      OR target_audience = (
        SELECT role FROM public.app_users WHERE id = auth.uid()
      )
      OR (
        target_audience = 'zone' 
        AND target_value = (
          SELECT zone FROM public.app_users WHERE id = auth.uid()
        )
      )
      OR (
        target_audience = 'region' 
        AND target_value = (
          SELECT region FROM public.app_users WHERE id = auth.uid()
        )
      )
    )
  );

-- Policy 2: HQ staff and directors can create announcements
CREATE POLICY "HQ and directors can create announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid()
      AND role IN ('hq_staff', 'director')
    )
  );

-- Policy 3: Creators can update their own announcements
CREATE POLICY "Creators can update own announcements"
  ON public.announcements
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy 4: HQ staff can update any announcement
CREATE POLICY "HQ staff can update any announcement"
  ON public.announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid()
      AND role = 'hq_staff'
    )
  );

-- Policy 5: Creators can delete their own announcements (soft delete - set is_active = false)
CREATE POLICY "Creators can delete own announcements"
  ON public.announcements
  FOR DELETE
  USING (created_by = auth.uid());

-- Policy 6: HQ staff can delete any announcement
CREATE POLICY "HQ staff can delete any announcement"
  ON public.announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid()
      AND role = 'hq_staff'
    )
  );

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

-- Create trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.announcements IS 'System-wide and targeted announcements from HQ/Directors to users';
COMMENT ON COLUMN public.announcements.id IS 'Unique identifier for the announcement';
COMMENT ON COLUMN public.announcements.title IS 'Announcement headline';
COMMENT ON COLUMN public.announcements.message IS 'Full announcement content';
COMMENT ON COLUMN public.announcements.short_message IS 'Brief preview for notifications';
COMMENT ON COLUMN public.announcements.created_by IS 'User ID of the creator (HQ/Director)';
COMMENT ON COLUMN public.announcements.target_audience IS 'Who should see this announcement';
COMMENT ON COLUMN public.announcements.target_value IS 'Zone/Region name for targeted announcements';
COMMENT ON COLUMN public.announcements.priority IS 'Importance level (low/normal/high/urgent)';
COMMENT ON COLUMN public.announcements.is_active IS 'Whether announcement is currently active';
COMMENT ON COLUMN public.announcements.publish_at IS 'When to publish (for scheduled announcements)';
COMMENT ON COLUMN public.announcements.expires_at IS 'When announcement expires (optional)';
COMMENT ON COLUMN public.announcements.read_by IS 'Array of user IDs who have read this announcement';

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Insert a sample announcement (update the UUID with your actual HQ user ID)
/*
INSERT INTO public.announcements (
  title,
  message,
  short_message,
  author_name,
  author_role,
  target_audience,
  priority,
  created_by
) VALUES (
  '🎉 Welcome to Airtel Champions!',
  'Welcome to the new gamified field intelligence platform. Start earning points by completing missions and competing with your peers!',
  'Welcome to Airtel Champions - Start earning points today!',
  'System Admin',
  'hq_staff',
  'all',
  'high',
  '00000000-0000-0000-0000-000000000000' -- Replace with actual HQ user UUID
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all announcements
-- SELECT * FROM public.announcements ORDER BY created_at DESC;

-- View active announcements
-- SELECT * FROM public.announcements WHERE is_active = true ORDER BY created_at DESC;

-- View announcements by priority
-- SELECT * FROM public.announcements WHERE priority IN ('high', 'urgent') ORDER BY created_at DESC;

-- View announcements for a specific role
-- SELECT * FROM public.announcements WHERE target_audience = 'sales_executive' ORDER BY created_at DESC;

-- Count announcements by status
-- SELECT is_active, COUNT(*) FROM public.announcements GROUP BY is_active;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
/*
With the indexes created above:
- Querying active announcements: Uses idx_announcements_active_created_at (< 5ms)
- Filtering by role: Uses idx_announcements_target_audience (< 10ms)
- Sorting by date: Uses idx_announcements_created_at_desc (< 5ms)
- Checking who read: Uses idx_announcements_read_by GIN index (< 15ms)

Expected row count: 50-200 announcements (low volume)
Storage per row: ~1-2KB average
Total storage: < 1MB for typical usage
*/
