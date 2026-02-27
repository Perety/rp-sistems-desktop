-- Crear un usuario de prueba para poder crear cuenta
INSERT INTO usuarios (id, username, nombre, rol, activo, servidor_id) 
VALUES (
    'test-user-001',
    'testuser',
    'Usuario de Prueba',
    'ciudadano',
    true,
    (SELECT id FROM servidores WHERE codigo = 'SRV001')
);

-- Verificar que se creó
SELECT id, username, nombre, rol, activo FROM usuarios WHERE username = 'testuser';
