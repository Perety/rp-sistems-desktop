-- DEBUG: Verificar tipos de datos en usuarios y cuentas
SELECT 
    'usuarios' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name = 'id'
UNION ALL
SELECT 
    'cuentas_bancarias' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
AND column_name = 'usuario_id';

-- DEBUG: Verificar usuarios sin cuenta (comparación correcta)
SELECT 
    u.id,
    u.username,
    u.nombre,
    CASE WHEN cb.usuario_id IS NULL THEN 'SIN CUENTA' ELSE 'CON CUENTA' END as estado
FROM usuarios u
LEFT JOIN cuentas_bancarias cb ON cb.usuario_id::TEXT = u.id::TEXT
WHERE u.servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001')
AND u.activo = true;
