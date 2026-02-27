-- FIX: Añadir columna usuario_id si no existe en cuentas_bancarias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cuentas_bancarias' 
        AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE cuentas_bancarias ADD COLUMN usuario_id TEXT;
        RAISE NOTICE 'Columna usuario_id añadida a cuentas_bancarias';
    ELSE
        RAISE NOTICE 'Columna usuario_id ya existe en cuentas_bancarias';
    END IF;
END $$;

-- Verificar estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_usuario_id ON cuentas_bancarias(usuario_id);

-- Vincular cuentas existentes con usuarios (si hay cuentas sin usuario_id)
UPDATE cuentas_bancarias 
SET usuario_id = (
    SELECT u.id 
    FROM usuarios u 
    WHERE u.servidor_id = cuentas_bancarias.servidor_id 
    LIMIT 1
) 
WHERE usuario_id IS NULL;
