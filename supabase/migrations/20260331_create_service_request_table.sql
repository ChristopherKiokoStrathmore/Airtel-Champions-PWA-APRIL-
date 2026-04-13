-- ============================================
-- CREATE SERVICE_REQUEST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_request (
  id BIGSERIAL PRIMARY KEY,
  sr_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  town_id INTEGER,
  estate TEXT,
  package TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  agent_name TEXT NOT NULL,
  agent_phone TEXT NOT NULL,
  remarks TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'on_way', 'arrived', 'completed', 'cancelled')),
  installer_id INTEGER,
  scheduled_date DATE,
  scheduled_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Source tracking for DSE/Public/Agent leads
  source_type TEXT DEFAULT 'public' CHECK (source_type IN ('dse', 'public', 'agent')),
  source_id BIGINT,
  source_name TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_request_status ON public.service_request(status);
CREATE INDEX IF NOT EXISTS idx_service_request_agent_phone ON public.service_request(agent_phone);
CREATE INDEX IF NOT EXISTS idx_service_request_town_id ON public.service_request(town_id);
CREATE INDEX IF NOT EXISTS idx_service_request_created_at ON public.service_request(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_source ON public.service_request(source_type, source_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_request_updated_at 
    BEFORE UPDATE ON public.service_request 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
