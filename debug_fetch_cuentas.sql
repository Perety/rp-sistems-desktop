-- DEBUG: Verificar si la consulta con JOIN funciona
SELECT 
    cb.*,
    u.username,
    u.nombre
FROM cuentas_bancarias cb
LEFT JOIN usuarios u ON cb.usuario_id = u.id::TEXT
WHERE cb.servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001');

-- DEBUG: Verificar consulta simple
SELECT * FROM cuentas_bancarias WHERE servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001');

-- DEBUG: Verificar usuarios
SELECT id, username, nombre FROM usuarios WHERE servidor_id = (SELECT id FROM servidores WHERE codigo = 'SRV001') AND activo = true;
