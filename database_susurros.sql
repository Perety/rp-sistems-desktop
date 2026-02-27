-- Tabla para el sistema de susurros (whispers)
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de susurros
CREATE TABLE IF NOT EXISTS susurros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emisor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    receptor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_susurros_emisor ON susurros(emisor_id);
CREATE INDEX IF NOT EXISTS idx_susurros_receptor ON susurros(receptor_id);
CREATE INDEX IF NOT EXISTS idx_susurros_servidor ON susurros(servidor_id);
CREATE INDEX IF NOT EXISTS idx_susurros_created_at ON susurros(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_susurros_leido ON susurros(leido) WHERE leido = FALSE;

-- 3. Políticas de seguridad (RLS)
ALTER TABLE susurros ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean sus propios susurros
CREATE POLICY "usuarios_ver_susurros_propios" ON susurros
    FOR SELECT USING (
        emisor_id = auth.uid() OR 
        receptor_id = auth.uid()
    );

-- Política para que los usuarios envíen susurros
CREATE POLICY "usuarios_enviar_susurros" ON susurros
    FOR INSERT WITH CHECK (
        emisor_id = auth.uid()
    );

-- Política para que los usuarios marquen como leídos sus susurros recibidos
CREATE POLICY "usuarios_marcar_leidos" ON susurros
    FOR UPDATE USING (
        receptor_id = auth.uid()
    );

-- 4. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_susurros_updated_at 
    BEFORE UPDATE ON susurros 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar Realtime para susurros
ALTER PUBLICATION supabase_realtime ADD TABLE susurros;

-- 6. Función para limpiar susurros antiguos (opcional)
CREATE OR REPLACE FUNCTION limpiar_susurros_antiguos()
RETURNS void AS $$
BEGIN
    DELETE FROM susurros 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 7. Datos de ejemplo (opcional)
-- INSERT INTO susurros (emisor_id, receptor_id, mensaje, servidor_id) VALUES
-- ('user-id-1', 'user-id-2', 'Hola, necesito ayuda', 'server-id'),
-- ('user-id-2', 'user-id-1', 'Claro, ¿en qué puedo ayudarte?', 'server-id');
