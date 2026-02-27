-- Crear sanciones para el usuario admin (que te han puesto a ti)
INSERT INTO sanciones (
    id,
    servidor_id,
    usuario_sancionado_id,
    usuario_sancionado_nombre,
    tipo,
    motivo,
    duracion_horas,
    activa,
    emitido_por,
    emitido_por_id,
    created_at,
    expira_at
) VALUES 
    (
        uuid_generate_v4(),
        'bbc123f4-c55a-4e6a-8a09-763aeebd50a1',
        '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
        'Admin User',
        'warning',
        'Exceso de velocidad en zona urbana',
        NULL,
        false,
        'LSPD Officer',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW() - INTERVAL '2 hours',
        NULL
    ),
    (
        uuid_generate_v4(),
        'bbc123f4-c55a-4e6a-8a09-763aeebd50a1',
        '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
        'Admin User',
        'multa',
        'Estacionamiento en lugar prohibido',
        NULL,
        false,
        'LSPD Officer',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW() - INTERVAL '1 day',
        NULL
    ),
    (
        uuid_generate_v4(),
        'bbc123f4-c55a-4e6a-8a09-763aeebd50a1',
        '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
        'Admin User',
        'kick',
        'Comportamiento disruptivo en el servidor',
        NULL,
        false,
        'Admin System',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW() - INTERVAL '3 days',
        NULL
    );

-- Verificar las sanciones creadas
SELECT 
    tipo,
    motivo,
    emitido_por,
    created_at,
    CASE 
        WHEN activa THEN 'Activa'
        ELSE 'Inactiva'
    END as estado
FROM sanciones 
WHERE usuario_sancionado_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
ORDER BY created_at DESC;
