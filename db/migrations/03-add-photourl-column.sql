-- Migration: Add photoUrl column to boxes table
-- Created: 2025-11-13
-- Purpose: Fix box update functionality by ensuring photoUrl column exists

-- Add photoUrl column if it doesn't exist
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS "photoUrl" text;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_boxes_photourl ON boxes("photoUrl");
