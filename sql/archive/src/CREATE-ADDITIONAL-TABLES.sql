-- ============================================================================
-- AIRTEL CHAMPIONS - Additional Tables Setup
-- ============================================================================
-- ⚠️ NOTE: Most of these tables ALREADY EXIST in your database!
-- This file is kept for reference only.
-- 
-- Your existing tables are already enabled in database-dropdown.tsx
-- ============================================================================

-- Van Database Table
CREATE TABLE IF NOT EXISTS van_db (
  id BIGSERIAL PRIMARY KEY,
  number_plate TEXT UNIQUE NOT NULL,
  capacity INTEGER,
  vendor TEXT,
  zone TEXT,
  zsm_county TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for van_db
ALTER TABLE van_db DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON van_db TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE van_db_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_van_db_number_plate ON van_db(number_plate);
CREATE INDEX IF NOT EXISTS idx_van_db_zone ON van_db(zone);
CREATE INDEX IF NOT EXISTS idx_van_db_status ON van_db(status);

-- ============================================================================

-- Ambassador Shops Table
CREATE TABLE IF NOT EXISTS amb_shops (
  id BIGSERIAL PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_code TEXT UNIQUE,
  owner_name TEXT,
  phone_number TEXT,
  location TEXT,
  territory TEXT,
  zone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE amb_shops DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON amb_shops TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE amb_shops_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_amb_shops_shop_code ON amb_shops(shop_code);
CREATE INDEX IF NOT EXISTS idx_amb_shops_zone ON amb_shops(zone);
CREATE INDEX IF NOT EXISTS idx_amb_shops_territory ON amb_shops(territory);

-- ============================================================================

-- ZSM (Zonal Sales Manager) List Table
CREATE TABLE IF NOT EXISTS zsm_list (
  id BIGSERIAL PRIMARY KEY,
  zsm_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  zone TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE zsm_list DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON zsm_list TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE zsm_list_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_zsm_list_employee_id ON zsm_list(employee_id);
CREATE INDEX IF NOT EXISTS idx_zsm_list_zone ON zsm_list(zone);

-- ============================================================================

-- Territory Database Table
CREATE TABLE IF NOT EXISTS territory_db (
  id BIGSERIAL PRIMARY KEY,
  territory_name TEXT UNIQUE NOT NULL,
  territory_code TEXT UNIQUE,
  zone TEXT NOT NULL,
  county TEXT,
  asm_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE territory_db DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON territory_db TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE territory_db_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_territory_db_territory_code ON territory_db(territory_code);
CREATE INDEX IF NOT EXISTS idx_territory_db_zone ON territory_db(zone);

-- ============================================================================

-- Shop Database Table (General Shops)
CREATE TABLE IF NOT EXISTS shop_db (
  id BIGSERIAL PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_code TEXT UNIQUE,
  shop_type TEXT,
  owner_name TEXT,
  phone_number TEXT,
  location TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  territory TEXT,
  zone TEXT,
  status TEXT DEFAULT 'active',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE shop_db DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON shop_db TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE shop_db_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_db_shop_code ON shop_db(shop_code);
CREATE INDEX IF NOT EXISTS idx_shop_db_zone ON shop_db(zone);
CREATE INDEX IF NOT EXISTS idx_shop_db_territory ON shop_db(territory);
CREATE INDEX IF NOT EXISTS idx_shop_db_verified ON shop_db(verified);

-- ============================================================================

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE,
  category TEXT,
  price DECIMAL(10, 2),
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON products TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE products_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_code TEXT UNIQUE,
  phone_number TEXT,
  email TEXT,
  location TEXT,
  territory TEXT,
  zone TEXT,
  customer_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON customers TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE customers_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_zone ON customers(zone);

-- ============================================================================

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_code TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  email TEXT,
  territory TEXT,
  zone TEXT,
  agent_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON agents TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE agents_id_seq TO anon, authenticated, service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_agent_code ON agents(agent_code);
CREATE INDEX IF NOT EXISTS idx_agents_zone ON agents(zone);
CREATE INDEX IF NOT EXISTS idx_agents_territory ON agents(territory);

-- ============================================================================
-- Sample Data (Optional - Uncomment to insert sample data)
-- ============================================================================

-- Sample Van Data
/*
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county) VALUES
  ('KCA 123A', 2000, 'Vendor A', 'Nairobi', 'Nairobi County'),
  ('KCB 456B', 1500, 'Vendor B', 'Coast', 'Mombasa County'),
  ('KCC 789C', 1800, 'Vendor C', 'Rift Valley', 'Nakuru County')
ON CONFLICT (number_plate) DO NOTHING;
*/

-- Sample Territory Data
/*
INSERT INTO territory_db (territory_name, territory_code, zone, county, asm_name) VALUES
  ('Nairobi Central', 'NBI-01', 'Nairobi', 'Nairobi County', 'John Doe'),
  ('Mombasa Island', 'MBA-01', 'Coast', 'Mombasa County', 'Jane Smith'),
  ('Nakuru Town', 'NKR-01', 'Rift Valley', 'Nakuru County', 'Bob Wilson')
ON CONFLICT (territory_name) DO NOTHING;
*/

-- ============================================================================
-- Completion Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Additional tables created successfully!';
  RAISE NOTICE '📋 Tables created: van_db, amb_shops, zsm_list, territory_db, shop_db, products, customers, agents';
  RAISE NOTICE '🔓 All tables have RLS disabled and permissions granted';
  RAISE NOTICE '📊 Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next steps:';
  RAISE NOTICE '1. Uncomment the tables you need in /supabase/functions/server/database-dropdown.tsx';
  RAISE NOTICE '2. Insert your actual data into these tables';
  RAISE NOTICE '3. Use the database dropdown feature in your program forms!';
END $$;
