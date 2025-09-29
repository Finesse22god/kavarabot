
-- Add missing columns to products table if they don't exist
DO $$ 
BEGIN
    -- Add brand column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
        ALTER TABLE products ADD COLUMN brand VARCHAR;
    END IF;
    
    -- Add color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='color') THEN
        ALTER TABLE products ADD COLUMN color VARCHAR;
    END IF;
    
    -- Add sizes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sizes') THEN
        ALTER TABLE products ADD COLUMN sizes TEXT;
    END IF;
    
    -- Add images column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
        ALTER TABLE products ADD COLUMN images TEXT;
    END IF;
    
    -- Add sportTypes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sportTypes') THEN
        ALTER TABLE products ADD COLUMN "sportTypes" TEXT;
    END IF;
END $$;

-- Update existing products with default sizes for clothing items
UPDATE products SET sizes = 'S,M,L,XL' 
WHERE category IN ('Рашгарды', 'Лосины', 'Рубашки', 'Поло', 'Шорты', 'Футболки', 'Майки', 'Худи', 'Брюки', 'Жилеты', 'Олимпийки', 'Джемперы', 'Куртки', 'Свитшоты') 
AND (sizes IS NULL OR sizes = '');
