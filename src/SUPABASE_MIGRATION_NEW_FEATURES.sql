-- ============================================================================
-- TAI NEW FEATURES DATABASE MIGRATION
-- Director Line + Social Feed
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. DIRECTOR MESSAGES TABLE
-- For SE to Director communication
-- ============================================================================
CREATE TABLE IF NOT EXISTS director_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES app_users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT,
  sender_zone TEXT,
  message TEXT NOT NULL,
  category TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'unread',
  response TEXT,
  response_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_director_messages_sender ON director_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_director_messages_status ON director_messages(status);
CREATE INDEX IF NOT EXISTS idx_director_messages_created ON director_messages(created_at DESC);

-- ============================================================================
-- 2. SOCIAL POSTS TABLE
-- For SE social feed (Instagram-style)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES app_users(id),
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_zone TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  comments JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_author ON social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_likes ON social_posts(likes DESC);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE POLICIES (PERMISSIVE FOR PILOT)
-- ============================================================================

-- Director Messages: Allow all users to read/write for pilot
DROP POLICY IF EXISTS "Allow all operations on director_messages" ON director_messages;
CREATE POLICY "Allow all operations on director_messages" 
  ON director_messages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Social Posts: Allow all users to read/write for pilot
DROP POLICY IF EXISTS "Allow all operations on social_posts" ON social_posts;
CREATE POLICY "Allow all operations on social_posts" 
  ON social_posts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get unread messages count for Director
CREATE OR REPLACE FUNCTION get_unread_director_messages_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM director_messages WHERE status = 'unread');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top posts (most liked)
CREATE OR REPLACE FUNCTION get_top_posts(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  author_name TEXT,
  content TEXT,
  image_url TEXT,
  likes INTEGER,
  comments JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_name,
    p.content,
    p.image_url,
    p.likes,
    p.comments,
    p.created_at
  FROM social_posts p
  ORDER BY p.likes DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. INSERT SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Sample Director Messages
INSERT INTO director_messages (sender_name, sender_role, sender_zone, message, category, status)
VALUES 
  ('Test SE', 'sales_executive', 'Nairobi West', 'Testing the Director Line feature! This is amazing.', '💡 Idea', 'unread')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPREHENSIVE SAMPLE SOCIAL POSTS (20+ Posts to Make Feed Look Live!)
-- ============================================================================

INSERT INTO social_posts (author_name, author_role, author_zone, content, image_url, likes, liked_by, comments, created_at)
VALUES 
  -- Post 1: High Performance Win WITH PHOTO
  (
    'Sarah Njeri', 
    'sales_executive', 
    'Mombasa', 
    'Just hit 120% of my monthly target in 3 weeks! 🎯🔥 My secret: Early morning visits to construction sites. Builders are making decisions at 7am, not 2pm!',
    'https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    156,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "⭐ VERIFIED TIP - This is gold! Construction site timing is brilliant. Everyone copy this! 👑",
        "created_at": "2026-01-01T07:30:00Z"
      },
      {
        "id": "2",
        "author_name": "James Omondi",
        "author_role": "sales_executive",
        "content": "Trying this tomorrow! Thanks Sarah 🙏",
        "created_at": "2026-01-01T08:15:00Z"
      },
      {
        "id": "3",
        "author_name": "Grace Wanjiku",
        "author_role": "zonal_sales_manager",
        "content": "Sarah crushing it as always! 💪",
        "created_at": "2026-01-01T09:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '2 hours'
  ),
  
  -- Post 2: Airtel Money Activation Technique WITH PHOTO
  (
    'John Mwangi', 
    'sales_executive', 
    'Nairobi West', 
    'Activated 22 Airtel Money accounts at Gikomba Market today! 💰 My pitch: "Send money home for FREE with Airtel Money." Works every time with traders!',
    'https://images.unsplash.com/photo-1650499311129-5dc75c1038e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    93,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "David Kimani",
        "author_role": "sales_executive",
        "content": "The FREE angle is perfect! Using this! 🚀",
        "created_at": "2026-01-01T11:45:00Z"
      },
      {
        "id": "2",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "Excellent work John! This pitch resonates with traders. 💯",
        "created_at": "2026-01-01T12:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '4 hours'
  ),

  -- Post 3: Objection Handling
  (
    'Grace Wanjiku',
    'zonal_sales_manager',
    'Nairobi Central',
    'To all my SEs: When a customer says "I already have Safaricom", respond with "Perfect! Now you can have BOTH networks for better coverage!" Never compete, complement! 📱',
    201,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "👑 Grace teaching the team! This is how ZSMs should lead. Brilliant reframe! ⭐",
        "created_at": "2026-01-01T10:30:00Z"
      },
      {
        "id": "2",
        "author_name": "Peter Otieno",
        "author_role": "sales_executive",
        "content": "Mind blown 🤯 Using this TODAY!",
        "created_at": "2026-01-01T11:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '6 hours'
  ),

  -- Post 4: Network Experience Intelligence
  (
    'James Omondi',
    'sales_executive',
    'Kisumu',
    'Spotted 3 Safaricom agents at the bus station offering NEW SIM for 50 KES. They are VERY aggressive today. Heads up team! 🚨',
    67,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "Lucy Achieng",
        "author_role": "sales_executive",
        "content": "Same in Nakuru! They''re pushing hard this week.",
        "created_at": "2026-01-01T13:20:00Z"
      },
      {
        "id": "2",
        "author_name": "Michael Odhiambo",
        "author_role": "zonal_business_manager",
        "content": "Good intelligence James. Counter with our unlimited data bundles!",
        "created_at": "2026-01-01T13:45:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '8 hours'
  ),

  -- Post 5: Personal Achievement
  (
    'Lucy Achieng',
    'sales_executive',
    'Nakuru',
    'MY FIRST WEEK AT TAI! 🎉 Already made 45 activations and learned SO much from this feed. Thank you all for sharing your tips! 🙏❤️',
    178,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "Welcome to the TAI family Lucy! 45 activations in Week 1 is outstanding! 👏",
        "created_at": "2026-01-01T15:00:00Z"
      },
      {
        "id": "2",
        "author_name": "Sarah Njeri",
        "author_role": "sales_executive",
        "content": "You''re a natural Lucy! Keep crushing it! 💪",
        "created_at": "2026-01-01T15:30:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '10 hours'
  ),

  -- Post 6: Data Bundle Tip
  (
    'Peter Otieno',
    'sales_executive',
    'Eldoret',
    'Pro tip: When selling data bundles, ask "How much data do you use per week?" instead of showing prices. Let THEM tell you what they need. Sales went up 40%! 📊',
    124,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "John Mwangi",
        "author_role": "sales_executive",
        "content": "Brilliant! Questions > Pitches. Love it!",
        "created_at": "2026-01-01T16:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '12 hours'
  ),

  -- Post 7: Competition Intel
  (
    'David Kimani',
    'sales_executive',
    'Thika',
    'Telkom is offering 15GB for 500 KES at the mall. We need to counter! Our 20GB for 599 KES is WAY better value. Emphasize MORE DATA! 📱',
    82,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "Grace Wanjiku",
        "author_role": "zonal_sales_manager",
        "content": "Great intel David! Team, use the VALUE angle: 5GB more for only 99 KES!",
        "created_at": "2026-01-01T14:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '14 hours'
  ),

  -- Post 8: Motivational Win
  (
    'Mary Wambui',
    'sales_executive',
    'Nairobi East',
    'Converted a LOYAL Safaricom customer of 12 years today! 🏆 She said our customer service was friendlier. Remember: PEOPLE buy from PEOPLE! 😊',
    167,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "THIS is what TAI is about! Human connection wins every time. Beautiful work Mary! 💯",
        "created_at": "2026-01-01T09:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '16 hours'
  ),

  -- Post 9: Closing Technique
  (
    'Michael Odhiambo',
    'zonal_business_manager',
    'Coast Region',
    'ZBM Tip: When customer is hesitating, use the "trial close" → "How about we start with just 1 line today? You can add more next week." Reduces perceived risk! 🎯',
    143,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "James Omondi",
        "author_role": "sales_executive",
        "content": "Michael dropping gems! 💎",
        "created_at": "2026-01-01T10:30:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '18 hours'
  ),

  -- Post 10: Market Intelligence
  (
    'Rose Akinyi',
    'sales_executive',
    'Kisii',
    'GOLD MINE ALERT! 🚨 New estate in Kisii (Mwembe area) just got connected. 200+ houses, NO Airtel presence yet. Going there tomorrow 6am. Who wants to join? 🏃‍♀️',
    95,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "Lucy Achieng",
        "author_role": "sales_executive",
        "content": "I''m IN! Let''s dominate that estate! 🔥",
        "created_at": "2026-01-01T18:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '20 hours'
  ),

  -- Post 11: Customer Service Win
  (
    'Daniel Kariuki',
    'sales_executive',
    'Nyeri',
    'Helped an elderly customer port her number from Safaricom today. She was SO grateful she gave me 5 referrals! 👵❤️ Kindness = Business! 🙏',
    189,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "Daniel, you embody our values! This is beautiful. 5 referrals is the ultimate reward! 👑",
        "created_at": "2026-01-01T08:30:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '1 day'
  ),

  -- Post 12: Team Collaboration
  (
    'Nancy Chebet',
    'sales_executive',
    'Kitale',
    'Shoutout to Peter from Eldoret! Used his "ask questions first" technique and closed 12 data bundles in 2 hours! 🎉 This feed is POWERFUL! 💪',
    76,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 2 hours'
  ),

  -- Post 13: Quick Tip
  (
    'Brian Mutua',
    'sales_executive',
    'Machakos',
    'Quick tip: Always carry a phone charger. Customers LOVE when you help charge their phones while explaining our offers. They stay longer = More sales! 🔌📱',
    134,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 4 hours'
  ),

  -- Post 14: Competition Analysis
  (
    'Faith Muthoni',
    'sales_executive',
    'Kiambu',
    'Faiba is struggling with network in Kiambu. Customers complaining about dropped calls. Our network is SOLID here! Use this in your pitch! 📶✅',
    58,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 6 hours'
  ),

  -- Post 15: Selling Technique
  (
    'Anthony Njuguna',
    'sales_executive',
    'Ruiru',
    'When selling to businesses, lead with "How much are you spending on airtime monthly?" Then show them how to SAVE 30% with our corporate plans. It''s irresistible! 💼',
    112,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "Michael Odhiambo",
        "author_role": "zonal_business_manager",
        "content": "Perfect approach Anthony! SAVINGS always win in B2B!",
        "created_at": "2025-12-31T14:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '1 day 8 hours'
  ),

  -- Post 16: Market Opportunity
  (
    'Elizabeth Wangari',
    'sales_executive',
    'Nanyuki',
    'University of Nanyuki students back on campus next week! 📚 Preparing 200 student bundles. Who else is targeting campuses? Let''s share strategies! 🎓',
    87,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 10 hours'
  ),

  -- Post 17: Personal Best
  (
    'Kevin Ouma',
    'sales_executive',
    'Busia',
    'NEW PERSONAL RECORD! 🏆 35 activations in one day! My legs are tired but my spirit is HIGH! Thank you TAI family for the daily motivation! 🙌',
    198,
    '{}',
    '[
      {
        "id": "1",
        "author_id": "director-001",
        "author_name": "Ashish Azad",
        "author_role": "director",
        "content": "LEGENDARY performance Kevin! 35 in one day is elite level! Rest well, champion! 👑",
        "created_at": "2025-12-31T18:00:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '1 day 12 hours'
  ),

  -- Post 18: Customer Retention
  (
    'Jane Mutheu',
    'sales_executive',
    'Meru',
    'Follow-up is KEY! 📞 Called 10 customers from last month. 7 needed data top-ups, 3 gave referrals. Never forget your existing customers! 💚',
    103,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 14 hours'
  ),

  -- Post 19: Competitive Intelligence
  (
    'Patrick Mwangi',
    'sales_executive',
    'Nyahururu',
    'Saw Safaricom billboard claiming "Best Network Coverage". Showed customers our coverage map - we cover the SAME areas + better pricing! Truth wins! 📊',
    71,
    '{}',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day 16 hours'
  ),

  -- Post 20: Inspirational
  (
    'Ashish Azad',
    'director',
    'Nairobi HQ',
    'Proud of this team! 💜 Reading your posts every day inspires me. You are not just selling SIM cards - you are CONNECTING KENYA! Keep sharing, keep winning, keep inspiring each other. This is OUR time! 🚀🇰🇪',
    312,
    '{}',
    '[
      {
        "id": "1",
        "author_name": "Sarah Njeri",
        "author_role": "sales_executive",
        "content": "Best Director ever! 🙏❤️",
        "created_at": "2025-12-31T08:00:00Z"
      },
      {
        "id": "2",
        "author_name": "Grace Wanjiku",
        "author_role": "zonal_sales_manager",
        "content": "Leadership at its finest! Thank you Ashish! 👑",
        "created_at": "2025-12-31T08:30:00Z"
      }
    ]'::jsonb,
    NOW() - INTERVAL '1 day 18 hours'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_unread_director_messages_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_posts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_director_messages_count() TO anon;
GRANT EXECUTE ON FUNCTION get_top_posts(INTEGER) TO anon;

-- ============================================================================
-- MIGRATION COMPLETE! ✅
-- ============================================================================

-- Verify tables were created
SELECT 
  'director_messages' as table_name, 
  COUNT(*) as row_count 
FROM director_messages
UNION ALL
SELECT 
  'social_posts' as table_name, 
  COUNT(*) as row_count 
FROM social_posts;

-- Show message
DO $$
BEGIN
  RAISE NOTICE '✅ TAI New Features Migration Complete!';
  RAISE NOTICE '📊 Tables created: director_messages, social_posts';
  RAISE NOTICE '🔒 RLS enabled and policies configured';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Helper functions ready';
  RAISE NOTICE '📝 Sample data inserted for testing';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to launch Director Line & Social Feed!';
END $$;