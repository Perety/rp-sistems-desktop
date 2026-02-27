-- Primero crear las columnas necesarias
ALTER TABLE sanciones 
ADD COLUMN IF NOT EXISTS tipo_sancion TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activa',
ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revocada_por UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS fecha_revocacion TIMESTAMPTZ;

-- Ahora actualizar los datos existentes
UPDATE sanciones 
SET tipo_sancion = CASE 
    WHEN tipo IN ('ban', 'mute', 'warning', 'kick') THEN tipo
    ELSE 'warning'
END
WHERE tipo_sancion IS NULL;

-- Actualizar estado
UPDATE sanciones 
SET estado = CASE 
    WHEN activa = true THEN 'activa'
    ELSE 'revocada'
END
WHERE estado IS NULL;

-- Calcular fecha_expiracion
UPDATE sanciones 
SET fecha_expiracion = CASE 
    WHEN tipo IN ('ban', 'mute') AND duracion_horas IS NOT NULL THEN created_at + (duracion_horas || ' hours')::INTERVAL
    ELSE NULL
END
WHERE fecha_expiracion IS NULL AND duracion_horas IS NOT NULL;

-- Verificar resultados
SELECT 
    id,
    tipo,
    tipo_sancion,
    estado,
    motivo,
    fecha_expiracion,
    created_at
FROM sanciones 
ORDER BY created_at DESC;
