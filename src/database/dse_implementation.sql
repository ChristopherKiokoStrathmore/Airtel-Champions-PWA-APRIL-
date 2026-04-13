-- ============================================
-- DSE IMPLEMENTATION MIGRATION
-- March 30, 2026
-- ============================================

-- 1. Add source tracking columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'public'::text CHECK (source_type = ANY (ARRAY['dse'::text, 'public'::text, 'agent'::text])),
ADD COLUMN IF NOT EXISTS source_id bigint, -- DSE ID from DSE_14TOWNS or Agent ID
ADD COLUMN IF NOT EXISTS source_name text;   -- DSE Name or Agent Name

-- 2. Add source tracking columns to service_request table
ALTER TABLE public.service_request 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'public'::text CHECK (source_type = ANY (ARRAY['dse'::text, 'public'::text, 'agent'::text])),
ADD COLUMN IF NOT EXISTS source_id bigint,
ADD COLUMN IF NOT EXISTS source_name text;

-- 3. Create index for faster DSE lead lookups
CREATE INDEX IF NOT EXISTS idx_jobs_source_type ON public.jobs(source_type);
CREATE INDEX IF NOT EXISTS idx_jobs_source_id ON public.jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_service_request_source ON public.service_request(source_type, source_id);

-- 4. Create view for DSE to see their leads with status
CREATE OR REPLACE VIEW dse_leads_view AS
SELECT 
  j.id as job_id,
  j.customer_name,
  j.customer_phone,
  j.estate_name,
  j.town,
  j.status,
  j.requested_at,
  j.assigned_at,
  j.completed_at,
  j.source_type,
  j.source_id,
  j.source_name,
  j.installer_id,
  i."Installer name" as installer_name,
  j.package,
  j.scheduled_date,
  j.scheduled_time,
  CASE 
    WHEN j.status = 'pending' THEN 'Created - Awaiting Allocation'
    WHEN j.status = 'assigned' THEN 'Assigned to Installer'
    WHEN j.status = 'on_way' THEN 'Installer On The Way'
    WHEN j.status = 'arrived' THEN 'Installer Arrived'
    WHEN j.status = 'completed' THEN 'Installation Completed'
    WHEN j.status = 'cancelled' THEN 'Order Cancelled'
    ELSE j.status
  END as status_description
FROM public.jobs j
LEFT JOIN "INHOUSE_INSTALLER_6TOWNS_MARCH" i ON j.installer_id = i."ID"
WHERE j.source_type = 'dse';

-- 5. Function to get DSE leads
CREATE OR REPLACE FUNCTION get_dse_leads(dse_id bigint)
RETURNS TABLE (
  job_id uuid,
  customer_name text,
  customer_phone text,
  estate_name text,
  town text,
  status text,
  status_description text,
  requested_at timestamp with time zone,
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  installer_name text,
  package text,
  scheduled_date text,
  scheduled_time text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.customer_name,
    j.customer_phone,
    j.estate_name,
    j.town,
    j.status,
    CASE 
      WHEN j.status = 'pending' THEN 'Created - Awaiting Allocation'
      WHEN j.status = 'assigned' THEN 'Assigned to Installer'
      WHEN j.status = 'on_way' THEN 'Installer On The Way'
      WHEN j.status = 'arrived' THEN 'Installer Arrived'
      WHEN j.status = 'completed' THEN 'Installation Completed'
      WHEN j.status = 'cancelled' THEN 'Order Cancelled'
      ELSE j.status
    END,
    j.requested_at,
    j.assigned_at,
    j.completed_at,
    i."Installer name",
    j.package,
    j.scheduled_date,
    j.scheduled_time
  FROM public.jobs j
  LEFT JOIN "INHOUSE_INSTALLER_6TOWNS_MARCH" i ON j.installer_id = i."ID"
  WHERE j.source_type = 'dse' 
    AND j.source_id = dse_id
  ORDER BY j.requested_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Update RLS policies for DSE access (if needed)
-- Note: DSE will access through Edge Functions, not direct table access

COMMENT ON TABLE public.DSE_14TOWNS IS 'Direct Sales Executives for HBB lead generation';
COMMENT ON COLUMN public.jobs.source_type IS 'Lead origin: dse (DSE created), public (self-service), agent (sales agent)';
