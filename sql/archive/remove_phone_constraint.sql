-- Remove unique constraint on phone to allow duplicates
ALTER TABLE installers DROP CONSTRAINT IF EXISTS installers_phone_unique;
