-- FIX: Cambiar personaje_id de UUID a TEXT en negocio_empleados
DO $$
BEGIN
    -- Eliminar índices si existen
    DROP INDEX IF EXISTS idx_negocio_empleados_personaje_id;
    
    -- Cambiar el tipo de columna de UUID a TEXT
    ALTER TABLE negocio_empleados ALTER COLUMN personaje_id TYPE TEXT USING personaje_id::TEXT;
    
    -- Recrear el índice
    CREATE INDEX idx_negocio_empleados_personaje_id ON negocio_empleados(personaje_id);
    
    RAISE NOTICE 'Columna personaje_id cambiada a TEXT en negocio_empleados';
END $$;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'negocio_empleados' 
AND table_schema = 'public'
ORDER BY ordinal_position;
