-- Crear foreign key correcta entre cuentas_bancarias y usuarios
DO $$
BEGIN
    -- Eliminar foreign key incorrecta si existe
    ALTER TABLE cuentas_bancarias DROP CONSTRAINT IF EXISTS cuentas_bancarias_usuario_id_fkey;
    
    -- Crear foreign key correcta con conversión de tipo
    ALTER TABLE cuentas_bancarias 
    ADD CONSTRAINT cuentas_bancarias_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key creada correctamente';
END $$;

-- Verificar la foreign key
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.update_rule, 
    tc.delete_rule
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'cuentas_bancarias' 
AND tc.constraint_type = 'FOREIGN KEY';
