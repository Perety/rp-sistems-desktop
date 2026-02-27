-- SISTEMA DE IMÁGENES PARA OBJETOS Y PERFILES (CORREGIDO)

-- 1. Crear tabla de almacenamiento de imágenes
CREATE TABLE IF NOT EXISTS imagenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_archivo TEXT NOT NULL,
    url_original TEXT NOT NULL,
    url_optimizada TEXT,
    tipo_contenido TEXT NOT NULL, -- 'image/jpeg', 'image/png', etc.
    tamaño_bytes BIGINT,
    ancho INTEGER,
    alto INTEGER,
    categoria TEXT DEFAULT 'general' CHECK (categoria IN ('perfil', 'producto', 'item', 'servidor', 'general')),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    servidor_id UUID REFERENCES servidores(id) ON DELETE CASCADE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verificar si las columnas ya existen antes de agregarlas
DO $$
BEGIN
    -- Agregar columna imagen_id a productos si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_id'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen_id UUID REFERENCES imagenes(id) ON DELETE SET NULL;
    END IF;

    -- Agregar columna imagen_perfil_id a usuarios si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'imagen_perfil_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN imagen_perfil_id UUID REFERENCES imagenes(id) ON DELETE SET NULL;
    END IF;

    -- Agregar columna imagen_id a inventario_usuario si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventario_usuario' 
        AND column_name = 'imagen_id'
    ) THEN
        ALTER TABLE inventario_usuario ADD COLUMN imagen_id UUID REFERENCES imagenes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Función para subir imagen
CREATE OR REPLACE FUNCTION subir_imagen(
    p_nombre_archivo TEXT,
    p_url_original TEXT,
    p_tipo_contenido TEXT,
    p_tamaño_bytes BIGINT DEFAULT NULL,
    p_ancho INTEGER DEFAULT NULL,
    p_alto INTEGER DEFAULT NULL,
    p_categoria TEXT DEFAULT 'general',
    p_usuario_id UUID DEFAULT NULL,
    p_servidor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_imagen_id UUID;
BEGIN
    INSERT INTO imagenes (
        nombre_archivo,
        url_original,
        tipo_contenido,
        tamaño_bytes,
        ancho,
        alto,
        categoria,
        usuario_id,
        servidor_id
    ) VALUES (
        p_nombre_archivo,
        p_url_original,
        p_tipo_contenido,
        p_tamaño_bytes,
        p_ancho,
        p_alto,
        p_categoria,
        p_usuario_id,
        p_servidor_id
    ) RETURNING id INTO v_imagen_id;
    
    RETURN v_imagen_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener imagen con datos completos
CREATE OR REPLACE FUNCTION obtener_imagen_completa(p_imagen_id UUID)
RETURNS TABLE (
    id UUID,
    nombre_archivo TEXT,
    url_original TEXT,
    url_optimizada TEXT,
    tipo_contenido TEXT,
    categoria TEXT,
    ancho INTEGER,
    alto INTEGER,
    tamaño_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nombre_archivo,
        i.url_original,
        i.url_optimizada,
        i.tipo_contenido,
        i.categoria,
        i.ancho,
        i.alto,
        i.tamaño_bytes
    FROM imagenes i
    WHERE i.id = p_imagen_id 
    AND i.activa = true;
END;
$$ LANGUAGE plpgsql;

-- 5. Vista para productos con imágenes (CORREGIDA - sin imagen_url duplicada)
CREATE OR REPLACE VIEW productos_con_imagenes AS
SELECT 
    p.*,
    COALESCE(i.url_original, '/images/default-product.png') as imagen_url,
    COALESCE(i.ancho, 300) as imagen_ancho,
    COALESCE(i.alto, 300) as imagen_alto,
    i.tipo_contenido as imagen_tipo
FROM productos p
LEFT JOIN imagenes i ON p.imagen_id = i.id
WHERE p.activo = true;

-- 6. Vista para usuarios con imágenes de perfil (CORREGIDA)
CREATE OR REPLACE VIEW usuarios_con_perfil AS
SELECT 
    u.*,
    COALESCE(i.url_original, '/images/default-avatar.png') as imagen_perfil_url,
    COALESCE(i.ancho, 200) as imagen_perfil_ancho,
    COALESCE(i.alto, 200) as imagen_perfil_alto,
    i.tipo_contenido as imagen_perfil_tipo
FROM usuarios u
LEFT JOIN imagenes i ON u.imagen_perfil_id = i.id
WHERE u.activo = true;

-- 7. Vista para inventario con imágenes personalizadas (CORREGIDA)
CREATE OR REPLACE VIEW inventario_con_imagenes AS
SELECT 
    iu.*,
    p.nombre as producto_nombre,
    p.descripcion as producto_descripcion,
    p.categoria as producto_categoria,
    p.precio as producto_precio,
    COALESCE(COALESCE(iu_imagen.url_original, p_imagen.url_original), '/images/default-item.png') as imagen_url,
    COALESCE(COALESCE(iu_imagen.ancho, p_imagen.ancho), 300) as imagen_ancho,
    COALESCE(COALESCE(iu_imagen.alto, p_imagen.alto), 300) as imagen_alto
FROM inventario_usuario iu
JOIN productos p ON iu.producto_id = p.id
LEFT JOIN imagenes p_imagen ON p.imagen_id = p_imagen.id
LEFT JOIN imagenes iu_imagen ON iu.imagen_id = iu_imagen.id
WHERE p.activo = true;

-- 8. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_imagenes_categoria ON imagenes(categoria);
CREATE INDEX IF NOT EXISTS idx_imagenes_usuario ON imagenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_imagenes_servidor ON imagenes(servidor_id);
CREATE INDEX IF NOT EXISTS idx_imagenes_activa ON imagenes(activa);

-- 9. Insertar imágenes de ejemplo para productos (solo si no existen)
INSERT INTO imagenes (nombre_archivo, url_original, tipo_contenido, categoria, servidor_id) 
SELECT 
    'telefono-movil.jpg', '/images/productos/telefono-movil.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'telefono-movil.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'radio-policial.jpg', '/images/productos/radio-policial.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'radio-policial.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'chaleco-antibalas.jpg', '/images/productos/chaleco-antibalas.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'chaleco-antibalas.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'kit-medico.jpg', '/images/productos/kit-medico.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'kit-medico.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'llaves-coche.jpg', '/images/productos/llaves-coche.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'llaves-coche.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'gps-portatil.jpg', '/images/productos/gps-portatil.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'gps-portatil.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'linterna-led.jpg', '/images/productos/linterna-led.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'linterna-led.jpg' AND categoria = 'producto') UNION ALL
SELECT 
    'botiquin-basico.jpg', '/images/productos/botiquin-basico.jpg', 'image/jpeg', 'producto', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
WHERE NOT EXISTS (SELECT 1 FROM imagenes WHERE nombre_archivo = 'botiquin-basico.jpg' AND categoria = 'producto');

-- 10. Actualizar productos con sus imágenes (solo si no tienen imagen_id)
UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'telefono-movil.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Teléfono Móvil' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'radio-policial.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Radio de Policía' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'chaleco-antibalas.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Chaleco Antibalas' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'kit-medico.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Kit Médico' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'llaves-coche.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Llaves de Coche' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'gps-portatil.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'GPS Portátil' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'linterna-led.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Linterna LED' AND imagen_id IS NULL;

UPDATE productos 
SET imagen_id = (
    SELECT id FROM imagenes 
    WHERE nombre_archivo = 'botiquin-basico.jpg' 
    AND categoria = 'producto'
    LIMIT 1
)
WHERE nombre = 'Botiquín Básico' AND imagen_id IS NULL;
