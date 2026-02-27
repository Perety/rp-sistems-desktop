-- AGREGAR COLUMNA imagen_url A PRODUCTOS PARA URLs DIRECTAS

-- 1. Verificar si la columna imagen_url existe en productos
DO $$
BEGIN
    -- Agregar columna imagen_url solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_url'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen_url TEXT;
        RAISE NOTICE 'Columna imagen_url agregada exitosamente a productos';
    ELSE
        RAISE NOTICE 'La columna imagen_url ya existe en productos';
    END IF;
END $$;

-- 2. Verificar resultado final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
