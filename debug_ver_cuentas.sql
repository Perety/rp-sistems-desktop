-- DEBUG: Verificar cuentas del usuario admin
SELECT 
    cb.*,
    u.username,
    u.nombre
FROM cuentas_bancarias cb
LEFT JOIN usuarios u ON cb.usuario_id = u.id::TEXT
WHERE cb.servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001')
AND u.id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'  -- ID del usuario admin
ORDER BY cb.created_at DESC;

-- DEBUG: Verificar todas las cuentas con sus usuarios
SELECT 
    cb.id,
    cb.usuario_id,
    cb.dinero_banco,
    cb.tipo,
    cb.activa,
    u.username,
    u.nombre,
    u.rol
FROM cuentas_bancarias cb
LEFT JOIN usuarios u ON cb.usuario_id = u.id::TEXT
WHERE cb.servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001')
ORDER BY cb.created_at DESC;
