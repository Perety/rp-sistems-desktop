-- Arreglar sanciones existentes que no tienen tipo_sancion
UPDATE sanciones 
SET tipo_sancion = CASE 
    WHEN tipo IN ('ban', 'mute', 'warning', 'kick') THEN tipo
    ELSE 'warning'
END
WHERE tipo_sancion IS NULL;

-- Actualizar estado de sanciones existentes
UPDATE sanciones 
SET estado = CASE 
    WHEN activa = true THEN 'activa'
    ELSE 'revocada'
END
WHERE estado IS NULL;

-- Establecer fecha_expiración para sanciones sin ella (opcional)
UPDATE sanciones 
SET fecha_expiracion = CASE 
    WHEN tipo_sancion = 'ban' AND duracion_horas IS NOT NULL THEN created_at + (duracion_horas || ' hours')::INTERVAL
    WHEN tipo_sancion = 'mute' AND duracion_horas IS NOT NULL THEN created_at + (duracion_horas || ' hours')::INTERVAL
    ELSE NULL
END
WHERE fecha_expiracion IS NULL AND duracion_horas IS NOT NULL;

-- Verificar el resultado
SELECT 
    tipo,
    tipo_sancion,
    estado,
    activa,
    motivo,
    fecha_expiracion,
    created_at
FROM sanciones 
ORDER BY created_at DESC;
