-- Crear un usuario de prueba con UUID válido
INSERT INTO usuarios (id, username, nombre, rol, activo, servidor_id) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',  -- UUID válido
    'testuser',
    'Usuario de Prueba',
    'ciudadano',
    true,
    (SELECT id FROM servidores WHERE codigo = 'SRV001')
);

-- Verificar que se creó
SELECT id, username, nombre, rol, activo FROM usuarios WHERE username = 'testuser';
