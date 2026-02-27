-- SISTEMA DE INVENTARIO Y TIENDA

-- 1. Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL DEFAULT 'general',
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER DEFAULT -1 CHECK (stock >= -1), -- -1 = stock infinito
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de inventario de usuarios
CREATE TABLE IF NOT EXISTS inventario_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),
    estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'equipado', 'en_uso', 'deteriorado')),
    propiedades JSONB DEFAULT '{}', -- propiedades adicionales del item
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    fecha_adquisicion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, producto_id, servidor_id)
);

-- 3. Crear tabla de transacciones de tienda
CREATE TABLE IF NOT EXISTS transacciones_tienda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    precio_total NUMERIC(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'banco' CHECK (metodo_pago IN ('banco', 'efectivo', 'tarjeta')),
    tarjeta_id UUID REFERENCES tarjetas_bancarias(id),
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, categoria, precio, stock, imagen_url, servidor_id) VALUES
    ('Teléfono Móvil', 'Smartphone básico para comunicación', 'tecnologia', 299.99, 50, '/images/telefono.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Radio de Policía', 'Radio profesional para comunicaciones', 'equipamiento', 149.99, 20, '/images/radio.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Chaleco Antibalas', 'Chaleco de protección nivel III', 'equipamiento', 499.99, 15, '/images/chaleco.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Kit Médico', 'Kit de primeros auxilios completo', 'medico', 89.99, -1, '/images/kit_medico.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Llaves de Coche', 'Juego de llaves para vehículos', 'herramientas', 39.99, 100, '/images/llaves.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('GPS Portátil', 'Sistema de navegación GPS', 'tecnologia', 199.99, 30, '/images/gps.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Linterna LED', 'Linterna recargable de alta potencia', 'herramientas', 24.99, -1, '/images/linterna.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'),
    ('Botiquín Básico', 'Botiquín para emergencias médicas', 'medico', 45.99, 75, '/images/botiquin.jpg', 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1');

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_inventario_usuario_usuario ON inventario_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inventario_usuario_servidor ON inventario_usuario(servidor_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_servidor ON productos(servidor_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_usuario ON transacciones_tienda(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_servidor ON transacciones_tienda(servidor_id);

-- 6. Verificar la estructura
SELECT 
    'productos' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' AND table_schema = 'public'

UNION ALL

SELECT 
    'inventario_usuario' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventario_usuario' AND table_schema = 'public'

UNION ALL

SELECT 
    'transacciones_tienda' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transacciones_tienda' AND table_schema = 'public'

ORDER BY tabla, column_name;
