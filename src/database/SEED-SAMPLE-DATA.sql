-- ============================================
-- TAI SAMPLE DATA
-- ============================================
-- Optional: Adds sample programs and users for testing
-- Run this AFTER CREATE-TABLES.sql
-- ============================================

-- SAMPLE USERS (662 Sales Executives structure)
INSERT INTO users (id, name, email, role, zone, region, employee_id, total_points) VALUES
('se001', 'John Kamau', 'john.kamau@airtel.co.ke', 'sales_executive', 'Nairobi Central', 'Central', 'SE001', 150),
('se002', 'Mary Wanjiku', 'mary.wanjiku@airtel.co.ke', 'sales_executive', 'Nairobi West', 'Central', 'SE002', 200),
('se003', 'David Omondi', 'david.omondi@airtel.co.ke', 'sales_executive', 'Mombasa', 'Coast', 'SE003', 175),
('zsm001', 'Peter Mwangi', 'peter.mwangi@airtel.co.ke', 'zonal_sales_manager', 'Nairobi Central', 'Central', 'ZSM001', 0),
('zbm001', 'Sarah Akinyi', 'sarah.akinyi@airtel.co.ke', 'zonal_business_manager', 'Central', 'Central', 'ZBM001', 0),
('hq001', 'Michael Kiprono', 'michael.kiprono@airtel.co.ke', 'hq_command_center', 'HQ', 'National', 'HQ001', 0),
('dir001', 'Grace Njeri', 'grace.njeri@airtel.co.ke', 'director', 'HQ', 'National', 'DIR001', 0)
ON CONFLICT (id) DO NOTHING;

-- SAMPLE PROGRAMS (Intelligence Gathering Missions)
INSERT INTO programs (id, title, description, icon, color, status, points, form_fields, target_roles, category, priority) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Competitor SIM Sighting',
    'Document competitor presence in retail outlets - gather intelligence on Safaricom, Telkom penetration',
    '🎯',
    '#FF6B00',
    'active',
    15,
    '[
        {"id": "outlet_name", "type": "text", "label": "Outlet Name", "required": true},
        {"id": "competitor", "type": "select", "label": "Competitor", "required": true, "options": ["Safaricom", "Telkom", "Other"]},
        {"id": "sim_count", "type": "number", "label": "Estimated SIM Cards Visible", "required": true},
        {"id": "pricing", "type": "text", "label": "Pricing Observed"},
        {"id": "promotions", "type": "textarea", "label": "Promotions or Offers Seen"},
        {"id": "photo", "type": "file", "label": "Photo Evidence", "required": true}
    ]'::jsonb,
    ARRAY['sales_executive'],
    'competitor_intelligence',
    100
),
(
    '22222222-2222-2222-2222-222222222222',
    'Retail Outlet Mapping',
    'Map and categorize retail outlets in your zone for network expansion intelligence',
    '🏪',
    '#00A5E3',
    'active',
    10,
    '[
        {"id": "outlet_name", "type": "text", "label": "Outlet Name", "required": true},
        {"id": "outlet_type", "type": "select", "label": "Outlet Type", "required": true, "options": ["Kiosk", "Shop", "Supermarket", "Mpesa Agent", "Other"]},
        {"id": "owner_name", "type": "text", "label": "Owner/Manager Name"},
        {"id": "phone", "type": "tel", "label": "Contact Phone"},
        {"id": "monthly_footfall", "type": "select", "label": "Estimated Monthly Footfall", "options": ["<100", "100-500", "500-1000", ">1000"]},
        {"id": "photo", "type": "file", "label": "Outlet Photo", "required": true}
    ]'::jsonb,
    ARRAY['sales_executive'],
    'market_intelligence',
    90
),
(
    '33333333-3333-3333-3333-333333333333',
    'Customer Pain Point Report',
    'Collect customer complaints and feedback - vital intelligence for product improvements',
    '💬',
    '#8B5CF6',
    'active',
    20,
    '[
        {"id": "customer_type", "type": "select", "label": "Customer Type", "required": true, "options": ["Existing Airtel", "Competitor User", "Dual SIM User"]},
        {"id": "pain_point", "type": "select", "label": "Main Issue", "required": true, "options": ["Network Coverage", "Data Speed", "Pricing", "Customer Service", "Other"]},
        {"id": "details", "type": "textarea", "label": "Detailed Description", "required": true},
        {"id": "location_type", "type": "select", "label": "Where was this heard?", "options": ["Retail Outlet", "Street", "Event", "Social Media"]},
        {"id": "urgency", "type": "select", "label": "Urgency Level", "options": ["Low", "Medium", "High", "Critical"]}
    ]'::jsonb,
    ARRAY['sales_executive'],
    'customer_intelligence',
    95
),
(
    '44444444-4444-4444-4444-444444444444',
    'Promotional Activity Scan',
    'Track competitor promotional activities and market campaigns',
    '📢',
    '#F59E0B',
    'active',
    15,
    '[
        {"id": "competitor", "type": "select", "label": "Competitor", "required": true, "options": ["Safaricom", "Telkom", "Other"]},
        {"id": "promo_type", "type": "select", "label": "Promotion Type", "required": true, "options": ["Price Discount", "Bonus Data", "Bonus Airtime", "Free SIM", "Device Offer", "Other"]},
        {"id": "description", "type": "textarea", "label": "Promotion Details", "required": true},
        {"id": "validity", "type": "text", "label": "Validity Period"},
        {"id": "photo", "type": "file", "label": "Photo of Promotion Material", "required": true}
    ]'::jsonb,
    ARRAY['sales_executive'],
    'competitor_intelligence',
    98
),
(
    '55555555-5555-5555-5555-555555555555',
    'Network Quality Feedback',
    'Report network performance issues from field intelligence',
    '📶',
    '#10B981',
    'active',
    10,
    '[
        {"id": "issue_type", "type": "select", "label": "Issue Type", "required": true, "options": ["No Signal", "Weak Signal", "Slow Data", "Call Drops", "Other"]},
        {"id": "location_name", "type": "text", "label": "Specific Location", "required": true},
        {"id": "frequency", "type": "select", "label": "How Often?", "options": ["Always", "Often", "Sometimes", "Rare"]},
        {"id": "description", "type": "textarea", "label": "Additional Details"}
    ]'::jsonb,
    ARRAY['sales_executive'],
    'network_intelligence',
    85
)
ON CONFLICT (id) DO NOTHING;

-- SAMPLE SUBMISSIONS (for testing analytics)
INSERT INTO submissions (
    program_id, 
    user_id, 
    user_name, 
    user_role, 
    zone, 
    region, 
    form_data, 
    points_awarded,
    status,
    created_at
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'se001',
    'John Kamau',
    'sales_executive',
    'Nairobi Central',
    'Central',
    '{"outlet_name": "Kimathi Street Kiosk", "competitor": "Safaricom", "sim_count": "50", "pricing": "Ksh 50", "promotions": "Get 1GB free with new SIM"}'::jsonb,
    15,
    'approved',
    NOW() - INTERVAL '2 days'
),
(
    '22222222-2222-2222-2222-222222222222',
    'se002',
    'Mary Wanjiku',
    'sales_executive',
    'Nairobi West',
    'Central',
    '{"outlet_name": "Westlands Supermart", "outlet_type": "Supermarket", "owner_name": "James Ochieng", "phone": "0712345678", "monthly_footfall": "500-1000"}'::jsonb,
    10,
    'approved',
    NOW() - INTERVAL '1 day'
),
(
    '33333333-3333-3333-3333-333333333333',
    'se003',
    'David Omondi',
    'sales_executive',
    'Mombasa',
    'Coast',
    '{"customer_type": "Competitor User", "pain_point": "Data Speed", "details": "Customer complains Safaricom data is slow in Nyali area, considering switching", "location_type": "Retail Outlet", "urgency": "Medium"}'::jsonb,
    20,
    'approved',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT DO NOTHING;

-- Update user points based on submissions
UPDATE users SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM submissions
    WHERE submissions.user_id = users.id
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ SAMPLE DATA LOADED!' as status;

SELECT 'Programs:' as category, COUNT(*) as count FROM programs
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Submissions:', COUNT(*) FROM submissions;

SELECT '🚀 READY TO TEST - REFRESH YOUR APP!' as message;
