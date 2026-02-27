-- Base de datos para el sistema de radios
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de radios (canales)
CREATE TABLE IF NOT EXISTS radios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(20) UNIQUE, -- Ej: "101.5", "EMS-1"
    tipo VARCHAR(20) DEFAULT 'publica', -- 'publica', 'privada', 'emergencia'
    max_usuarios INTEGER DEFAULT 50,
    es_emergencia BOOLEAN DEFAULT FALSE,
    prioridad INTEGER DEFAULT 1, -- 1=baja, 5=emergencia
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de permisos de radio (qué roles pueden unirse a qué radio)
CREATE TABLE IF NOT EXISTS radio_permisos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radio_id UUID NOT NULL REFERENCES radios(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES roles_permisos(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    puede_unirse BOOLEAN DEFAULT TRUE,
    puede_hablar BOOLEAN DEFAULT TRUE,
    es_admin BOOLEAN DEFAULT FALSE, -- puede kick/ban de la radio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(radio_id, rol_id)
);

-- 3. Tabla de usuarios en radios (conectados actualmente)
CREATE TABLE IF NOT EXISTS radio_usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radio_id UUID NOT NULL REFERENCES radios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    personaje_id UUID REFERENCES personajes(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    estado VARCHAR(20) DEFAULT 'conectado', -- 'conectado', 'hablando', 'silenciado', 'ausente'
    volumen FLOAT DEFAULT 1.0, -- volumen individual 0.0-1.0
    is_transmitiendo BOOLEAN DEFAULT FALSE,
    ultima_transmision TIMESTAMP WITH TIME ZONE,
    ip_address INET, -- para WebRTC P2P
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(radio_id, usuario_id)
);

-- 4. Tabla de configuración de audio del usuario
CREATE TABLE IF NOT EXISTS usuario_audio_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    dispositivo_entrada VARCHAR(255), -- micrófono por defecto
    dispositivo_salida VARCHAR(255), -- altavoces por defecto
    volumen_general FLOAT DEFAULT 1.0,
    umbral_voz FLOAT DEFAULT 0.02, -- umbral para detección de voz
    tecla_ptt VARCHAR(20) DEFAULT 'CAPS_LOCK', -- tecla PTT
    supresion_ruido BOOLEAN DEFAULT TRUE,
    eco_cancelacion BOOLEAN DEFAULT TRUE,
    calidad_audio VARCHAR(20) DEFAULT 'high', -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, servidor_id)
);

-- 5. Tabla de logs de transmisiones (para auditoría)
CREATE TABLE IF NOT EXISTS radio_transmisiones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radio_id UUID NOT NULL REFERENCES radios(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    personaje_id UUID REFERENCES personajes(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    tipo VARCHAR(20) DEFAULT 'normal', -- 'normal', 'susurro', 'emergencia'
    duracion_ms INTEGER, -- duración en milisegundos
    calidad VARCHAR(20), -- calidad de la transmisión
    destinatarios TEXT[], -- IDs de usuarios (para susurros)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_radios_servidor ON radios(servidor_id);
CREATE INDEX IF NOT EXISTS idx_radios_frecuencia ON radios(frecuencia);
CREATE INDEX IF NOT EXISTS idx_radios_tipo ON radios(tipo);
CREATE INDEX IF NOT EXISTS idx_radio_permisos_radio ON radio_permisos(radio_id);
CREATE INDEX IF NOT EXISTS idx_radio_permisos_rol ON radio_permisos(rol_id);
CREATE INDEX IF NOT EXISTS idx_radio_usuarios_radio ON radio_usuarios(radio_id);
CREATE INDEX IF NOT EXISTS idx_radio_usuarios_usuario ON radio_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_radio_transmisiones_radio ON radio_transmisiones(radio_id);
CREATE INDEX IF NOT EXISTS idx_radio_transmisiones_usuario ON radio_transmisiones(usuario_id);

-- 7. Radios por defecto para cada servidor
INSERT INTO radios (servidor_id, nombre, descripcion, frecuencia, tipo, es_emergencia, prioridad) VALUES
('bbc123f4-c55a-4e6a-8a09-763aeebd50a1', 'Radio Principal', 'Canal principal de comunicaciones', '101.5', 'publica', FALSE, 1),
('bbc123f4-c55a-4e6a-8a09-763aeebd50a1', 'Radio Policía', 'Canal exclusivo para policía', 'POL-1', 'privada', FALSE, 2),
('bbc123f4-c55a-4e6a-8a09-763aeebd50a1', 'Radio EMS', 'Servicios Médicos de Emergencia', 'EMS-1', 'privada', FALSE, 3),
('bbc123f4-c55a-4e6a-8a09-763aeebd50a1', 'Radio Bomberos', 'Cuerpo de Bomberos', 'BOM-1', 'privada', FALSE, 3),
('bbc123f4-c55a-4e6a-8a09-763aeebd50a1', 'Radio Emergencias', 'Canal de emergencias prioritario', '999', 'emergencia', TRUE, 5)
ON CONFLICT DO NOTHING;

-- 8. Permisos por defecto (ajustar según roles existentes)
-- Nota: Reemplazar con IDs reales de roles cuando se creen

-- Verificación
SELECT 'Radios creadas: ' || COUNT(*) FROM radios;
SELECT 'Permisos creados: ' || COUNT(*) FROM radio_permisos;
SELECT 'Configuraciones de audio: ' || COUNT(*) FROM usuario_audio_config;
