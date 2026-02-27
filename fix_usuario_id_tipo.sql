-- FIX: Cambiar usuario_id de UUID a TEXT en cuentas_bancarias
DO $$
BEGIN
    -- Eliminar foreign key si existe
    ALTER TABLE cuentas_bancarias DROP CONSTRAINT IF EXISTS cuentas_bancarias_usuario_id_fkey;
    
    -- Cambiar el tipo de columna de UUID a TEXT
    ALTER TABLE cuentas_bancarias ALTER COLUMN usuario_id TYPE TEXT USING usuario_id::TEXT;
    
    RAISE NOTICE 'Columna usuario_id cambiada a TEXT en cuentas_bancarias';
END $$;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND table_schema = 'public'
ORDER BY ordinal_position;
