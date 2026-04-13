-- Add director reaction and reply columns to director_messages table
-- Run this in your Supabase SQL Editor

-- Add director_reaction column
ALTER TABLE director_messages 
ADD COLUMN IF NOT EXISTS director_reaction TEXT;

-- Add reply columns (for director responses)
ALTER TABLE director_messages 
ADD COLUMN IF NOT EXISTS ashish_reply TEXT;

ALTER TABLE director_messages 
ADD COLUMN IF NOT EXISTS ashish_reply_time TIMESTAMPTZ;

-- Update any existing ashish_reaction data to director_reaction (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'director_messages' 
    AND column_name = 'ashish_reaction'
  ) THEN
    UPDATE director_messages 
    SET director_reaction = ashish_reaction 
    WHERE ashish_reaction IS NOT NULL AND director_reaction IS NULL;
  END IF;
END $$;

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'director_messages' 
AND column_name IN ('director_reaction', 'ashish_reply', 'ashish_reply_time')
ORDER BY column_name;