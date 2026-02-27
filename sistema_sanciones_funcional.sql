-- SISTEMA DE SANCIONES FUNCIONAL COMPLETO

-- 1. Actualizar tabla de sanciones para que sea funcional
ALTER TABLE sanciones 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'revocada', 'expirada')),
ADD COLUMN IF NOT EXISTS tipo_sancion TEXT NOT NULL CHECK (tipo_sancion IN ('ban', 'mute', 'warning', 'kick')),
ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revocada_por UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS fecha_revocacion TIMESTAMPTZ;

-- 2. Crear tabla de permisos de usuario
CREATE TABLE IF NOT EXISTS permisos_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    puede_hablar BOOLEAN DEFAULT true,
    puede_entrar BOOLEAN DEFAULT true,
    puede_escribir_chat BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, servidor_id)
);

-- 3. Crear función para actualizar permisos basados en sanciones
CREATE OR REPLACE FUNCTION actualizar_permisos_sanciones()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar permisos cuando se crea, actualiza o elimina una sanción
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Si es un ban activo, bloquear entrada
        IF NEW.tipo_sancion = 'ban' AND NEW.estado = 'activa' THEN
            INSERT INTO permisos_usuario (usuario_id, servidor_id, puede_entrar, puede_hablar, puede_escribir_chat)
            VALUES (NEW.usuario_sancionado_id, NEW.servidor_id, false, false, false)
            ON CONFLICT (usuario_id, servidor_id) 
            DO UPDATE SET 
                puede_entrar = false,
                puede_hablar = false,
                puede_escribir_chat = false,
                updated_at = NOW();
        
        -- Si es un mute activo, bloquear chat
        ELSIF NEW.tipo_sancion = 'mute' AND NEW.estado = 'activa' THEN
            INSERT INTO permisos_usuario (usuario_id, servidor_id, puede_entrar, puede_hablar, puede_escribir_chat)
            VALUES (NEW.usuario_sancionado_id, NEW.servidor_id, true, false, false)
            ON CONFLICT (usuario_id, servidor_id) 
            DO UPDATE SET 
                puede_hablar = false,
                puede_escribir_chat = false,
                updated_at = NOW();
        
        -- Si la sanción fue revocada o expiró, restaurar permisos
        ELSIF NEW.estado IN ('revocada', 'expirada') THEN
            -- Verificar si hay otras sanciones activas
            IF NOT EXISTS (
                SELECT 1 FROM sanciones 
                WHERE usuario_sancionado_id = NEW.usuario_sancionado_id 
                AND servidor_id = NEW.servidor_id 
                AND estado = 'activa'
                AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            ) THEN
                INSERT INTO permisos_usuario (usuario_id, servidor_id, puede_entrar, puede_hablar, puede_escribir_chat)
                VALUES (NEW.usuario_sancionado_id, NEW.servidor_id, true, true, true)
                ON CONFLICT (usuario_id, servidor_id) 
                DO UPDATE SET 
                    puede_entrar = true,
                    puede_hablar = true,
                    puede_escribir_chat = true,
                    updated_at = NOW();
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear triggers para actualizar permisos automáticamente
DROP TRIGGER IF EXISTS trigger_sanciones_permisos ON sanciones;
CREATE TRIGGER trigger_sanciones_permisos
    AFTER INSERT OR UPDATE ON sanciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_permisos_sanciones();

-- 5. Crear función para limpiar sanciones expiradas
CREATE OR REPLACE FUNCTION limpiar_sanciones_expiradas()
RETURNS void AS $$
BEGIN
    UPDATE sanciones 
    SET estado = 'expirada' 
    WHERE estado = 'activa' 
    AND fecha_expiracion IS NOT NULL 
    AND fecha_expiracion <= NOW();
    
    -- Llamar a la función de actualización de permisos para las sanciones expiradas
    -- (esto se manejará automáticamente por el trigger)
END;
$$ LANGUAGE plpgsql;

-- 6. Insertar permisos iniciales para todos los usuarios existentes
INSERT INTO permisos_usuario (usuario_id, servidor_id, puede_entrar, puede_hablar, puede_escribir_chat)
SELECT DISTINCT 
    u.id as usuario_id,
    s.id as servidor_id,
    true as puede_entrar,
    true as puede_hablar,
    true as puede_escribir_chat
FROM usuarios u
CROSS JOIN servidores s
WHERE u.activo = true AND s.activo = true
ON CONFLICT (usuario_id, servidor_id) DO NOTHING;

-- 7. Crear sanciones de ejemplo funcionales
INSERT INTO sanciones (
    usuario_sancionado_id,
    usuario_sancionado_nombre,
    tipo_sancion,
    motivo,
    servidor_id,
    emitido_por,
    emitido_por_id,
    estado,
    fecha_expiracion,
    created_at
) VALUES 
    -- Ban de 24 horas
    (
        '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
        'Admin User',
        'ban',
        'Comportamiento disruptivo en el servidor',
        'bbc123f4-c55a-4e6a-8a09-763aeebd50a1',
        'LSPD Officer',
        '550e8400-e29b-41d4-a716-446655440001',
        'activa',
        NOW() + INTERVAL '24 hours',
        NOW()
    ),
    -- Mute de 2 horas
    (
        '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6',
        'Admin User',
        'mute',
        'Spam en el chat',
        'bbc123f4-c55a-4e6a-8a09-763aeebd50a1',
        'Admin System',
        '550e8400-e29b-41d4-a716-446655440001',
        'activa',
        NOW() + INTERVAL '2 hours',
        NOW() - INTERVAL '30 minutes'
    );

-- 8. Verificar el estado actual
SELECT 
    'Permisos de usuario' as tipo,
    usuario_id,
    puede_entrar,
    puede_hablar,
    puede_escribir_chat
FROM permisos_usuario 
WHERE usuario_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'

UNION ALL

SELECT 
    'Sanciones activas' as tipo,
    usuario_sancionado_id as usuario_id,
    CASE WHEN tipo_sancion = 'ban' THEN false ELSE true END as puede_entrar,
    CASE WHEN tipo_sancion = 'mute' THEN false ELSE true END as puede_hablar,
    CASE WHEN tipo_sancion = 'mute' THEN false ELSE true END as puede_escribir_chat
FROM sanciones 
WHERE usuario_sancionado_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
AND estado = 'activa'
AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW());
