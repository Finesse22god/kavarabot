-- Migration: Cleanup base64 Data URLs from products
-- Created: 2025-11-13
-- Purpose: Remove legacy base64 image data from products table

-- Удаляем base64 Data URLs из imageUrl
UPDATE products 
SET "imageUrl" = NULL 
WHERE "imageUrl" LIKE 'data:%';

-- Очищаем base64 Data URLs из массива images
UPDATE products 
SET images = ARRAY(
  SELECT unnest(images) 
  WHERE unnest NOT LIKE 'data:%'
)
WHERE images IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM unnest(images) AS img 
    WHERE img LIKE 'data:%'
  );

-- Логируем результат
DO $$
DECLARE
  affected_count integer;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Очищено % товаров с base64 изображениями', affected_count;
END $$;
