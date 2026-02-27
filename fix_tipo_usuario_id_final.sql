-- CAMBIAR usuario_id a UUID para poder crear foreign key
DO $$
BEGIN
    -- Eliminar foreign key si existe
    ALTER TABLE cuentas_bancarias DROP CONSTRAINT IF EXISTS cuentas_bancarias_usuario_id_fkey;
    
    -- Cambiar usuario_id de TEXT a UUID
    ALTER TABLE cuentas_bancarias ALTER COLUMN usuario_id TYPE UUID USING usuario_id::UUID;
    
    -- Crear foreign key correcta
    ALTER TABLE cuentas_bancarias 
    ADD CONSTRAINT cuentas_bancarias_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'usuario_id cambiado a UUID y foreign key creada';
END $$;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND column_name = 'usuario_id'
AND table_schema = 'public';
