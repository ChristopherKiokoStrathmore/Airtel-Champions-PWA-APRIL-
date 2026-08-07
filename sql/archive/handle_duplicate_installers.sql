-- Handle duplicate installers by updating existing records instead of skipping them
-- This keeps the most recent data and preserves all installers

-- First, let's see what duplicates we have
SELECT phone, COUNT(*) as count 
FROM installers 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Option 1: Remove duplicates, keeping the most recent one
DELETE FROM installers 
WHERE id NOT IN (
    SELECT DISTINCT ON (phone) id 
    FROM installers 
    ORDER BY phone, created_at DESC
);

-- Option 2: If you prefer to keep all duplicates, remove the unique constraint
-- ALTER TABLE installers DROP CONSTRAINT IF EXISTS installers_phone_unique;
