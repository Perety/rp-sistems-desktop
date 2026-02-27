-- DEBUG: Verificar sanciones del usuario admin
SELECT 
    s.*,
    u.nombre,
    u.username
FROM sanciones s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.usuario_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
ORDER BY s.created_at DESC
LIMIT 10;

-- Verificar estructura de la tabla sanciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si hay sanciones en el servidor actual
SELECT 
    s.*,
    u.nombre,
    u.username,
    s.servidor_id
FROM sanciones s
JOIN usuarios u ON s.usuario_id = u.id
WHERE s.servidor_id = 'SRV001'
ORDER BY s.created_at DESC
LIMIT 10;

-- Insertar sanciones de ejemplo si no existen
INSERT INTO sanciones (usuario_id, tipo, razon, monto, servidor_id, created_at)
SELECT 
    '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
    'Multas',
    'Exceso de velocidad',
    500,
    'SRV001',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM sanciones 
    WHERE usuario_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
    LIMIT 1
);

-- Insertar más sanciones de ejemplo
INSERT INTO sanciones (usuario_id, tipo, razon, monto, servidor_id, created_at)
VALUES 
    ('4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6', 'Arresto', 'Robo a mano armada', 1000, 'SRV001', NOW() - INTERVAL '1 day'),
    ('4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6', 'Multas', 'Estacionamiento prohibido', 200, 'SRV001', NOW() - INTERVAL '2 days');
