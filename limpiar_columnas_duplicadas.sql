-- LIMPIAR COLUMNAS DUPLICADAS EN TABLA PRODUCTOS

-- 1. Verificar qué columnas existen en productos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- 2. Si imagen_url ya existe, eliminarla para evitar conflictos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_url'
    ) THEN
        -- Opción 1: Eliminar la columna duplicada
        -- ALTER TABLE productos DROP COLUMN IF EXISTS imagen_url;
        
        -- Opción 2: Renombrar la columna existente
        -- ALTER TABLE productos RENAME COLUMN imagen_url TO imagen_url_vieja;
        
        -- Usaremos la opción 1: eliminar duplicada
        ALTER TABLE productos DROP COLUMN IF EXISTS imagen_url;
        
        RAISE NOTICE 'Columna imagen_url eliminada para evitar duplicados';
    END IF;
END $$;

-- 3. Verificar estado final de las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
