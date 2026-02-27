-- DEBUG: Verificar usuarios disponibles para crear cuentas
SELECT id, username, nombre, rol, activo FROM usuarios WHERE servidor_id = (
    SELECT id FROM servidores WHERE codigo = 'SRV001'
) AND activo = true;

-- DEBUG: Verificar cuentas existentes
SELECT cb.*, u.username, u.nombre 
FROM cuentas_bancarias cb 
LEFT JOIN usuarios u ON cb.usuario_id = u.id 
WHERE cb.servidor_id = (
    SELECT id FROM servidores WHERE codigo = 'SRV001'
);

-- DEBUG: Verificar si hay usuarios sin cuenta
SELECT u.id, u.username, u.nombre 
FROM usuarios u 
LEFT JOIN cuentas_bancarias cb ON u.id = cb.usuario_id 
WHERE u.servidor_id = (
    SELECT id FROM servidores WHERE codigo = 'SRV001'
) AND u.activo = true 
AND cb.id IS NULL;
