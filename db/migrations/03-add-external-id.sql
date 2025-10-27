
-- Migration: Add externalId field to products table
-- This field is used for integration with 1C system

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "externalId" VARCHAR UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products("externalId");

-- Add comment
COMMENT ON COLUMN products."externalId" IS 'External ID for 1C integration';
