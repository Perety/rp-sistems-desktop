-- Base de datos para el sistema de emergencias
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de alertas de emergencia
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ems', 'bomberos', 'policia', 'general')),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(300),
    gravedad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (gravedad IN ('baja', 'media', 'alta', 'critica')),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    personaje_id UUID REFERENCES personajes(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    activa BOOLEAN DEFAULT TRUE,
    coords_lat DECIMAL(10, 8), -- Coordenadas GPS
    coords_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Actualizar tabla personajes para incluir servicio de emergencias
ALTER TABLE personajes 
ADD COLUMN IF NOT EXISTS en_servicio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipo_servicio VARCHAR(20) CHECK (tipo_servicio IN ('ems', 'bomberos', 'policia', 'general')),
ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS radio_emergencia_id UUID REFERENCES radios(id);

-- 3. Tabla de unidades de emergencia (para tracking)
CREATE TABLE IF NOT EXISTS emergency_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Unidad EMS-1", "Patrulla POL-5"
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ems', 'bomberos', 'policia')),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    usuario_id UUID REFERENCES usuarios(id),
    personaje_id UUID REFERENCES personajes(id),
    radio_id UUID REFERENCES radios(id),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_servicio', 'en_emergencia', 'fuera_servicio')),
    ubicacion_actual VARCHAR(300),
    coords_lat DECIMAL(10, 8),
    coords_lng DECIMAL(11, 8),
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de incidentes (para tracking de emergencias)
CREATE TABLE IF NOT EXISTS emergency_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alerta_id UUID REFERENCES emergency_alerts(id),
    codigo VARCHAR(20) UNIQUE, -- Código de incidente Ej: "INC-2024-001"
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('accidente', 'incendio', 'robo', 'agresion', 'medica', 'otro')),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('leve', 'moderado', 'grave', 'critico')),
    descripcion TEXT,
    ubicacion VARCHAR(300) NOT NULL,
    coords_lat DECIMAL(10, 8),
    coords_lng DECIMAL(11, 8),
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    reportado_por UUID NOT NULL REFERENCES usuarios(id),
    asignado_a UUID REFERENCES emergency_units(id),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'en_progreso', 'resuelto', 'cancelado')),
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    resuelto_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de logs de emergencias (para auditoría)
CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incidente_id UUID REFERENCES emergency_incidents(id),
    alerta_id UUID REFERENCES emergency_alerts(id),
    unidad_id UUID REFERENCES emergency_units(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL, -- 'alerta_creada', 'unidad_despachada', 'incidente_resuelto', etc.
    descripcion TEXT,
    servidor_id UUID NOT NULL REFERENCES servidores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_servidor ON emergency_alerts(servidor_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_activa ON emergency_alerts(activa);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_tipo ON emergency_alerts(tipo);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_gravedad ON emergency_alerts(gravedad);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created ON emergency_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_emergency_units_servidor ON emergency_units(servidor_id);
CREATE INDEX IF NOT EXISTS idx_emergency_units_tipo ON emergency_units(tipo);
CREATE INDEX IF NOT EXISTS idx_emergency_units_estado ON emergency_units(estado);
CREATE INDEX IF NOT EXISTS idx_emergency_units_usuario ON emergency_units(usuario_id);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_servidor ON emergency_incidents(servidor_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_estado ON emergency_incidents(estado);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_tipo ON emergency_incidents(tipo);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_created ON emergency_incidents(created_at);

CREATE INDEX IF NOT EXISTS idx_emergency_logs_servidor ON emergency_logs(servidor_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_incidente ON emergency_logs(incidente_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_created ON emergency_logs(created_at);

-- 7. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emergency_alerts_updated_at 
    BEFORE UPDATE ON emergency_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_incidents_updated_at 
    BEFORE UPDATE ON emergency_incidents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Función para generar códigos de incidente
CREATE OR REPLACE FUNCTION generar_codigo_incidente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL THEN
        NEW.codigo := 'INC-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                     LPAD(NEXTVAL('incidente_seq')::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Secuencia para códigos de incidente
CREATE SEQUENCE IF NOT EXISTS incidente_seq START 1;

-- 10. Trigger para generar código de incidente
CREATE TRIGGER generar_codigo_incidente_trigger
    BEFORE INSERT ON emergency_incidents
    FOR EACH ROW EXECUTE FUNCTION generar_codigo_incidente();

-- 11. Vista de incidentes activos
CREATE OR REPLACE VIEW incidentes_activos AS
SELECT 
    i.*,
    a.tipo as alerta_tipo,
    a.titulo as alerta_titulo,
    a.gravedad as alerta_gravedad,
    u.username as reportado_por_username,
    eu.nombre as unidad_asignada,
    eu.estado as unidad_estado
FROM emergency_incidents i
LEFT JOIN emergency_alerts a ON i.alerta_id = a.id
LEFT JOIN usuarios u ON i.reportado_por = u.id
LEFT JOIN emergency_units eu ON i.asignado_a = eu.id
WHERE i.estado IN ('activo', 'en_progreso')
ORDER BY i.severidad DESC, i.created_at DESC;

-- 12. Vista de unidades en servicio
CREATE OR REPLACE VIEW unidades_en_servicio AS
SELECT 
    eu.*,
    u.username as usuario_username,
    p.nombre as personaje_nombre,
    p.apellidos as personaje_apellidos,
    r.nombre as radio_nombre,
    r.frecuencia as radio_frecuencia
FROM emergency_units eu
LEFT JOIN usuarios u ON eu.usuario_id = u.id
LEFT JOIN personajes p ON eu.personaje_id = p.id
LEFT JOIN radios r ON eu.radio_id = r.id
WHERE eu.estado IN ('disponible', 'en_servicio', 'en_emergencia')
ORDER BY eu.tipo, eu.estado;

-- 13. Datos de ejemplo (opcional)
INSERT INTO emergency_alerts (tipo, titulo, descripcion, ubicacion, gravedad, usuario_id, servidor_id) VALUES
('ems', 'Accidente de tráfico', 'Colisión múltiple en autopista', 'Autopista Norte km 45', 'alta', 'demo-user-id', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
('bomberos', 'Incendio residencial', 'Fuego en edificio de apartamentos', 'Calle Principal #123', 'critica', 'demo-user-id', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
('policia', 'Robo en comercio', 'Asalto a mano armada en tienda', 'Avenida Comercial #456', 'alta', 'demo-user-id', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1')
ON CONFLICT DO NOTHING;

-- 14. Verificación
SELECT 'Alertas de emergencia: ' || COUNT(*) FROM emergency_alerts;
SELECT 'Unidades de emergencia: ' || COUNT(*) FROM emergency_units;
SELECT 'Incidentes: ' || COUNT(*) FROM emergency_incidents;
SELECT 'Logs de emergencias: ' || COUNT(*) FROM emergency_logs;
