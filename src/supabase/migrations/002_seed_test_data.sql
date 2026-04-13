-- =====================================================
-- SEED DATA FOR TESTING
-- Optional: Run this AFTER the main migration to add test data
-- =====================================================

-- Note: This creates realistic test data for the admin dashboard
-- You can run this in Supabase SQL Editor after running 001_initial_schema.sql

-- =====================================================
-- TEST SALES EXECUTIVES
-- =====================================================

-- Password for all test SEs: Test@1234
-- PIN hash is bcrypt hash of '1234'
INSERT INTO users (phone, email, full_name, role, region, team, pin_hash, avatar_url) VALUES
  ('+254701234567', 'john.kamau@airtel.co.ke', 'John Kamau', 'se', 'Nairobi', 'Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=12'),
  ('+254702234567', 'mary.wanjiku@airtel.co.ke', 'Mary Wanjiku', 'se', 'Nairobi', 'Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=25'),
  ('+254703234567', 'peter.omondi@airtel.co.ke', 'Peter Omondi', 'se', 'Kisumu', 'Beta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=33'),
  ('+254704234567', 'faith.akinyi@airtel.co.ke', 'Faith Akinyi', 'se', 'Mombasa', 'Gamma', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=44'),
  ('+254705234567', 'david.kipchoge@airtel.co.ke', 'David Kipchoge', 'se', 'Eldoret', 'Delta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=52'),
  ('+254706234567', 'grace.muthoni@airtel.co.ke', 'Grace Muthoni', 'se', 'Nakuru', 'Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=26'),
  ('+254707234567', 'james.otieno@airtel.co.ke', 'James Otieno', 'se', 'Nairobi', 'Beta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=11'),
  ('+254708234567', 'lucy.njeri@airtel.co.ke', 'Lucy Njeri', 'se', 'Central', 'Gamma', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=32'),
  ('+254709234567', 'samuel.mutua@airtel.co.ke', 'Samuel Mutua', 'se', 'Eastern', 'Delta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=58'),
  ('+254710234567', 'jane.chebet@airtel.co.ke', 'Jane Chebet', 'se', 'Rift Valley', 'Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S', 'https://i.pravatar.cc/150?img=47');

-- =====================================================
-- TEST SUBMISSIONS
-- =====================================================

-- Get mission type IDs (we'll use them in submissions)
DO $$
DECLARE
  network_id UUID;
  conversion_id UUID;
  newsite_id UUID;
  amb_id UUID;
  se1_id UUID;
  se2_id UUID;
  se3_id UUID;
  se4_id UUID;
  se5_id UUID;
BEGIN
  -- Get mission type IDs
  SELECT id INTO network_id FROM mission_types WHERE name = 'Network Experience';
  SELECT id INTO conversion_id FROM mission_types WHERE name = 'Competition Conversion';
  SELECT id INTO newsite_id FROM mission_types WHERE name = 'New Site Launch';
  SELECT id INTO amb_id FROM mission_types WHERE name = 'AMB Visitations';
  
  -- Get SE IDs
  SELECT id INTO se1_id FROM users WHERE email = 'john.kamau@airtel.co.ke';
  SELECT id INTO se2_id FROM users WHERE email = 'mary.wanjiku@airtel.co.ke';
  SELECT id INTO se3_id FROM users WHERE email = 'peter.omondi@airtel.co.ke';
  SELECT id INTO se4_id FROM users WHERE email = 'faith.akinyi@airtel.co.ke';
  SELECT id INTO se5_id FROM users WHERE email = 'david.kipchoge@airtel.co.ke';

  -- John Kamau - Top performer with multiple submissions
  INSERT INTO submissions (se_id, mission_type_id, photo_url, location_lat, location_lng, location_address, notes, exif_valid, status, points_awarded, submitted_at, reviewed_at) VALUES
    (se1_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', -1.2921, 36.8219, 'Westlands, Nairobi', 'Safaricom shop - poor network signal reported by 3 customers', true, 'approved', 80, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (se1_id, conversion_id, 'https://images.unsplash.com/photo-1556742031-c6961e8560b0', -1.2864, 36.8172, 'CBD, Nairobi', 'Customer frustrated with Safaricom billing, interested in Airtel', true, 'approved', 200, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    (se1_id, newsite_id, 'https://images.unsplash.com/photo-1555421689-d68471e189f2', -1.3031, 36.8158, 'Parklands, Nairobi', 'New Safaricom retail store opening next week', true, 'approved', 150, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    (se1_id, amb_id, 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df', -1.2921, 36.8456, 'Eastleigh, Nairobi', 'Visited Airtel Money agent - active business', true, 'approved', 100, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    (se1_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', -1.2745, 36.8062, 'Kibera, Nairobi', 'Multiple complaints about network quality in this area', true, 'pending', 0, NOW() - INTERVAL '1 day', NULL);
  
  -- Mary Wanjiku - Solid performer
  INSERT INTO submissions (se_id, mission_type_id, photo_url, location_lat, location_lng, location_address, notes, exif_valid, status, points_awarded, submitted_at, reviewed_at) VALUES
    (se2_id, conversion_id, 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df', -1.3167, 36.8333, 'Kasarani, Nairobi', 'Telkom customer considering switch to Airtel', true, 'approved', 200, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
    (se2_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', -1.2500, 36.8167, 'Ruiru, Nairobi', 'Poor Safaricom coverage area', true, 'approved', 80, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    (se2_id, amb_id, 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df', -1.2833, 36.8167, 'Thika Road, Nairobi', 'AMB agent visit - good feedback', true, 'approved', 100, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');
  
  -- Peter Omondi - Kisumu region
  INSERT INTO submissions (se_id, mission_type_id, photo_url, location_lat, location_lng, location_address, notes, exif_valid, status, points_awarded, submitted_at, reviewed_at) VALUES
    (se3_id, newsite_id, 'https://images.unsplash.com/photo-1555421689-d68471e189f2', -0.0917, 34.7680, 'Kisumu City Center', 'Orange Kenya new outlet opening', true, 'approved', 150, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (se3_id, conversion_id, 'https://images.unsplash.com/photo-1556742031-c6961e8560b0', -0.1022, 34.7617, 'Kondele, Kisumu', 'Potential customer interested in data plans', true, 'approved', 200, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    (se3_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', -0.0833, 34.7500, 'Mamboleo, Kisumu', 'Network issues in residential area', true, 'pending', 0, NOW() - INTERVAL '1 day', NULL);
  
  -- Faith Akinyi - Mombasa region
  INSERT INTO submissions (se_id, mission_type_id, photo_url, location_lat, location_lng, location_address, notes, exif_valid, status, points_awarded, submitted_at, reviewed_at) VALUES
    (se4_id, amb_id, 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df', -4.0435, 39.6682, 'Nyali, Mombasa', 'AMB agent - high transaction volume', true, 'approved', 100, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    (se4_id, conversion_id, 'https://images.unsplash.com/photo-1556742031-c6961e8560b0', -4.0500, 39.6667, 'Old Town, Mombasa', 'Business customer considering Airtel for office', true, 'approved', 200, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    (se4_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', -4.0333, 39.6500, 'Likoni, Mombasa', 'Poor network coverage near ferry', true, 'rejected', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');
  
  -- David Kipchoge - Eldoret region
  INSERT INTO submissions (se_id, mission_type_id, photo_url, location_lat, location_lng, location_address, notes, exif_valid, status, points_awarded, submitted_at, reviewed_at) VALUES
    (se5_id, newsite_id, 'https://images.unsplash.com/photo-1555421689-d68471e189f2', 0.5143, 35.2698, 'Eldoret Town', 'Safaricom expanding retail presence', true, 'approved', 150, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
    (se5_id, network_id, 'https://images.unsplash.com/photo-1551650975-87deedd944c3', 0.5200, 35.2800, 'Langas, Eldoret', 'Network quality complaints', true, 'approved', 80, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');
END $$;

-- =====================================================
-- TEST COMPETITOR ACTIVITY
-- =====================================================

INSERT INTO competitor_activity (competitor_name, activity_type, location_lat, location_lng, region, description, threat_level) VALUES
  ('Safaricom', 'New Retail Store', -1.3031, 36.8158, 'Nairobi', 'Large retail outlet opening in Parklands area', 'high'),
  ('Safaricom', 'Price Promotion', -1.2921, 36.8219, 'Nairobi', 'Aggressive data bundle promotion in Westlands', 'medium'),
  ('Telkom', 'Network Upgrade', -0.0917, 34.7680, 'Kisumu', 'Installing new towers in city center', 'medium'),
  ('Orange Kenya', 'Marketing Campaign', -4.0435, 39.6682, 'Mombasa', 'Heavy billboard advertising in coastal region', 'low'),
  ('Safaricom', 'Corporate Deals', 0.5143, 35.2698, 'Eldoret', 'Targeting SMEs with bulk packages', 'high');

-- =====================================================
-- TEST ANNOUNCEMENTS
-- =====================================================

INSERT INTO announcements (title, message, priority, target_audience, is_active) VALUES
  ('Weekly Challenge: Double Points Weekend!', 'Submit 5+ missions this weekend and earn 2x points on all approved submissions!', 'high', 'all', true),
  ('New Mission Type Added', 'We''ve added a new mission type: "Competitor Price Intelligence". Check it out in the app!', 'normal', 'all', true),
  ('Nairobi Region Meeting', 'All Nairobi SEs are invited to the monthly strategy meeting this Friday at 2pm.', 'normal', 'region', true),
  ('Top Performer Recognition', 'Congratulations to John Kamau for reaching 1000 points! Keep up the great work!', 'high', 'all', true);

-- =====================================================
-- TEST HOTSPOTS
-- =====================================================

INSERT INTO hotspots (name, location_lat, location_lng, region, submission_count, avg_points, dominant_competitor, trend, is_active) VALUES
  ('Westlands Commercial Area', -1.2921, 36.8219, 'Nairobi', 15, 125.50, 'Safaricom', 'up', true),
  ('CBD Main Street', -1.2864, 36.8172, 'Nairobi', 23, 142.75, 'Safaricom', 'stable', true),
  ('Kisumu City Center', -0.0917, 34.7680, 'Kisumu', 8, 110.00, 'Orange Kenya', 'down', true),
  ('Nyali Shopping Complex', -4.0435, 39.6682, 'Mombasa', 12, 135.25, 'Safaricom', 'up', true),
  ('Eldoret Town Square', 0.5143, 35.2698, 'Eldoret', 6, 98.50, 'Telkom', 'stable', true);

-- =====================================================
-- TEST DAILY CHALLENGE
-- =====================================================

INSERT INTO challenges (title, description, challenge_type, requirement, reward_points, icon, start_date, end_date, is_active) VALUES
  ('Weekend Warrior', 'Submit 5 missions this weekend', 'special', 'Submit 5 missions between Saturday and Sunday', 300, '🔥', NOW(), NOW() + INTERVAL '3 days', true),
  ('Network Scout', 'Report 3 network quality issues', 'daily', 'Submit 3 Network Experience missions', 150, '📶', NOW(), NOW() + INTERVAL '1 day', true),
  ('Conversion Master', 'Document 2 potential customer conversions', 'weekly', 'Submit 2 Competition Conversion missions', 250, '🎯', NOW(), NOW() + INTERVAL '7 days', true);

-- =====================================================
-- REFRESH MATERIALIZED VIEW
-- =====================================================

-- Refresh the leaderboard to show test data
REFRESH MATERIALIZED VIEW leaderboard;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Test data seeded successfully!';
  RAISE NOTICE '   - 10 Sales Executives created';
  RAISE NOTICE '   - 17 Submissions created (mix of pending, approved, rejected)';
  RAISE NOTICE '   - 5 Competitor activities logged';
  RAISE NOTICE '   - 4 Announcements created';
  RAISE NOTICE '   - 5 Hotspots identified';
  RAISE NOTICE '   - 3 Active challenges created';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your admin dashboard is now populated with realistic test data!';
  RAISE NOTICE '   Go to your dashboard and explore the submissions, leaderboard, and analytics.';
END $$;
