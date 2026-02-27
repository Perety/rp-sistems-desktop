-- AGREGAR COLUMNA imagen_id A PRODUCTOS (VERSÓN SEGURA)

-- 1. Verificar que la tabla productos existe
DO $$
BEGIN
    -- Agregar columna imagen_id solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_id'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen_id UUID REFERENCES imagenes(id) ON DELETE SET NULL;
        RAISE NOTICE 'Columna imagen_id agregada exitosamente a productos';
    ELSE
        RAISE NOTICE 'La columna imagen_id ya existe en productos';
    END IF;
END $$;

-- 2. Verificar resultado final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
