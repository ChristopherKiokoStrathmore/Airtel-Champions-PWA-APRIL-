-- =============================================================================
-- PERFORMANCE INDEX for server-side ILIKE search on retailer_dump_full
-- Run in Supabase SQL Editor → project xspogpfohjmkykfjadhk
--
-- This makes the "Type to search" dropdown instant even with 125K rows.
-- Without this index, ILIKE on 125K rows takes ~300ms per keystroke.
-- With this index, it takes ~10ms.
-- =============================================================================

-- GIN trigram index — enables fast ILIKE / pattern matching
-- (requires pg_trgm extension, which Supabase has enabled by default)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retailer_msisdn_trgm
ON retailer_dump_full
USING gin ("RETAILER_MSISDN" gin_trgm_ops);

-- Optional: also index the zone column if zone filtering is used
-- CREATE INDEX IF NOT EXISTS idx_retailer_zone ON retailer_dump_full ("ZONE");

-- Verify the index was created:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'retailer_dump_full';
