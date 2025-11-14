-- Migration: Cleanup base64 Data URLs from products
-- Created: 2025-11-13
-- Purpose: Remove legacy base64 image data from products table

-- Удаляем base64 Data URLs из imageUrl
UPDATE products 
SET "imageUrl" = NULL 
WHERE "imageUrl" LIKE 'data:%';

-- Очищаем base64 Data URLs из JSON массива images
UPDATE products 
SET images = (
  SELECT json_agg(elem)
  FROM json_array_elements_text(images::json) AS elem
  WHERE elem NOT LIKE 'data:%'
)
WHERE images IS NOT NULL 
  AND images::text != 'null'
  AND EXISTS (
    SELECT 1 
    FROM json_array_elements_text(images::json) AS elem
    WHERE elem LIKE 'data:%'
  );

-- Очищаем пустые массивы
UPDATE products
SET images = '[]'::json
WHERE images IS NOT NULL 
  AND images::text = 'null';

-- Логируем результат
DO $$
DECLARE
  cleaned_imageurl integer;
  cleaned_images integer;
BEGIN
  SELECT COUNT(*) INTO cleaned_imageurl FROM products WHERE "imageUrl" IS NULL;
  SELECT COUNT(*) INTO cleaned_images FROM products WHERE images::text = '[]';
  RAISE NOTICE 'Очищено товаров: imageUrl = %, images = %', cleaned_imageurl, cleaned_images;
END $$;
