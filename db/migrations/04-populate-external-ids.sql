
-- Migration: Populate externalId for existing products
-- This will generate unique external IDs for products that don't have one yet

-- Generate externalId based on product name and a unique suffix
UPDATE products 
SET "externalId" = CONCAT(
  -- Replace spaces with hyphens and convert to lowercase
  LOWER(REPLACE(name, ' ', '-')),
  '-',
  -- Add last 8 characters of UUID for uniqueness
  SUBSTRING(id::text FROM 1 FOR 8)
)
WHERE "externalId" IS NULL OR "externalId" = '';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM products WHERE "externalId" IS NOT NULL;
  SELECT COUNT(*) INTO null_count FROM products WHERE "externalId" IS NULL;
  
  RAISE NOTICE 'Products with externalId: %', updated_count;
  RAISE NOTICE 'Products without externalId: %', null_count;
END $$;

-- Show sample of generated IDs
SELECT id, name, "externalId" 
FROM products 
LIMIT 10;
