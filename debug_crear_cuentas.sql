-- DEBUG: Verificar estructura de cuentas_bancarias
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- DEBUG: Verificar datos existentes
SELECT * FROM cuentas_bancarias LIMIT 5;

-- DEBUG: Verificar si existe columna usuario_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND column_name = 'usuario_id';

-- DEBUG: Verificar usuarios existentes
SELECT id, username, nombre, rol FROM usuarios LIMIT 5;

-- DEBUG: Verificar estructura de negocio_empleados
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'negocio_empleados' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- DEBUG: Verificar empleados existentes
SELECT * FROM negocio_empleados LIMIT 5;
