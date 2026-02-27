-- ============================================================
-- ACTUALIZACIÓN DE BASE DE DATOS EXISTENTE - SISTEMA RP
-- Solo ejecuta esto si ya tienes datos y necesitas actualizar
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACTUALIZAR TABLA: cuentas_bancarias (añadir columnas faltantes)
-- ============================================================
DO $$
BEGIN
    -- Añadir columna usuario_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cuentas_bancarias' AND column_name = 'usuario_id') THEN
        ALTER TABLE public.cuentas_bancarias ADD COLUMN usuario_id UUID;
    END IF;
    
    -- Añadir columna tipo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cuentas_bancarias' AND column_name = 'tipo') THEN
        ALTER TABLE public.cuentas_bancarias ADD COLUMN tipo TEXT DEFAULT 'personal';
    END IF;
    
    -- Añadir columna activa si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cuentas_bancarias' AND column_name = 'activa') THEN
        ALTER TABLE public.cuentas_bancarias ADD COLUMN activa BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================================
-- ACTUALIZAR TABLA: servicio (añadir columnas faltantes)
-- ============================================================
DO $$
BEGIN
    -- Añadir columna tipo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicio' AND column_name = 'tipo') THEN
        ALTER TABLE public.servicio ADD COLUMN tipo TEXT DEFAULT 'general';
    END IF;
    
    -- Añadir columna negocio_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicio' AND column_name = 'negocio_id') THEN
        ALTER TABLE public.servicio ADD COLUMN negocio_id UUID;
    END IF;
END $$;

-- ============================================================
-- ACTUALIZAR TABLA: bolo (añadir columna destinatarios)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bolo' AND column_name = 'destinatarios') THEN
        ALTER TABLE public.bolo ADD COLUMN destinatarios TEXT DEFAULT 'todos';
    END IF;
END $$;

-- ============================================================
-- CREAR TABLAS QUE NO EXISTEN
-- ============================================================

-- Tabla items (para la tienda)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  precio INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existe, añadir columnas faltantes
DO $$
BEGIN
    -- Añadir columnas esenciales si no existen en la tabla items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'categoria') THEN
            ALTER TABLE public.items ADD COLUMN categoria TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'precio') THEN
            ALTER TABLE public.items ADD COLUMN precio INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'stock') THEN
            ALTER TABLE public.items ADD COLUMN stock INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'activo') THEN
            ALTER TABLE public.items ADD COLUMN activo BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- Tabla sanciones
CREATE TABLE IF NOT EXISTS public.sanciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  usuario_sancionado_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  duracion_horas INTEGER,
  emitido_por TEXT,
  emitido_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  activa BOOLEAN DEFAULT true,
  expira_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VERIFICAR Y CREAR TABLAS REFERENCIADAS
-- ============================================================

-- Tabla personajes (referenciada por negocio_empleados)
CREATE TABLE IF NOT EXISTS public.personajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dinero INTEGER DEFAULT 0,
  banco INTEGER DEFAULT 0,
  trabajo TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocios (referenciada por negocio_empleados)
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  dueno_personaje_id UUID REFERENCES public.personajes(id) ON DELETE SET NULL,
  dinero_caja INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocio_stock (referenciada por negocios)
CREATE TABLE IF NOT EXISTS public.negocio_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  item_nombre TEXT NOT NULL,
  precio_compra INTEGER NOT NULL,
  precio_venta INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocio_empleados
CREATE TABLE IF NOT EXISTS public.negocio_empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE,
  rol_negocio TEXT DEFAULT 'empleado',
  salario INTEGER DEFAULT 1500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSERTAR ITEMS DE EJEMPLO SOLO SI LA TABLA ESTÁ VACÍA Y TIENE LAS COLUMNAS NECESARIAS
-- ============================================================
DO $$
BEGIN
    -- Verificar si la tabla items está vacía y tiene las columnas necesarias
    IF (SELECT COUNT(*) FROM public.items) = 0 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'categoria') THEN
        
        -- Insertar items de ejemplo
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            id,
            'Pistola 9mm',
            'Pistola estándar con 17 balas',
            'arma',
            5000,
            10,
            true
        FROM public.servidores WHERE codigo = 'SRV001';
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            id,
            'Hamburguesa',
            'Hamburguesa clásica con papas',
            'comida',
            50,
            100,
            true
        FROM public.servidores WHERE codigo = 'SRV001';
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            id,
            'Refresco',
            'Refresco de 500ml',
            'bebida',
            25,
            100,
            true
        FROM public.servidores WHERE codigo = 'SRV001';
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            id,
            'Chaleco Antibalas',
            'Chaleco antibalas nivel III',
            'herramienta',
            2000,
            5,
            true
        FROM public.servidores WHERE codigo = 'SRV001';
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            id,
            'Casco',
            'Casco de protección',
            'herramienta',
            500,
            20,
            true
        FROM public.servidores WHERE codigo = 'SRV001';
    END IF;
END $$;

-- ============================================================
-- FUNCIÓN PARA COMPRAR ITEMS
-- ============================================================
CREATE OR REPLACE FUNCTION comprar_item(p_usuario_id UUID, p_item_id UUID, p_servidor_id UUID)
RETURNS TEXT AS $$
DECLARE
    item_record RECORD;
    cuenta_record RECORD;
BEGIN
    -- Obtener información del item
    SELECT * INTO item_record FROM public.items 
    WHERE id = p_item_id AND servidor_id = p_servidor_id AND activo = true;
    
    IF NOT FOUND THEN
        RETURN 'Item no encontrado';
    END IF;
    
    -- Verificar stock
    IF item_record.stock <= 0 THEN
        RETURN 'Sin stock disponible';
    END IF;
    
    -- Obtener cuenta bancaria del usuario
    SELECT * INTO cuenta_record FROM public.cuentas_bancarias 
    WHERE usuario_id = p_usuario_id AND servidor_id = p_servidor_id AND activa = true;
    
    IF NOT FOUND THEN
        RETURN 'Cuenta bancaria no encontrada';
    END IF;
    
    -- Verificar saldo
    IF cuenta_record.saldo < item_record.precio THEN
        RETURN 'Saldo insuficiente';
    END IF;
    
    -- Realizar transacción
    UPDATE public.cuentas_bancarias 
    SET saldo = saldo - item_record.precio 
    WHERE id = cuenta_record.id;
    
    -- Actualizar stock
    UPDATE public.items 
    SET stock = stock - 1 
    WHERE id = p_item_id;
    
    -- Registrar en auditoría si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria' AND table_schema = 'public') THEN
        INSERT INTO public.auditoria (servidor_id, usuario_id, accion, modulo, descripcion)
        VALUES (p_servidor_id, p_usuario_id, 'Item Comprado', 'tienda', item_record.nombre);
    END IF;
    
    RETURN 'Compra exitosa';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CONFIGURACIÓN REALTIME
-- ============================================================

-- Añadir tablas a Realtime si no están
DO $$
BEGIN
    -- items
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE items;
    END IF;
    
    -- servicio
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'servicio') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE servicio;
    END IF;
    
    -- bolo
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bolo') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bolo;
    END IF;
    
    -- sanciones
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sanciones') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sanciones;
    END IF;
END $$;

-- ============================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_items_servidor_activo ON public.items(servidor_id, activo);
CREATE INDEX IF NOT EXISTS idx_servicio_servidor_activo ON public.servicio(servidor_id) WHERE hora_fin IS NULL;
CREATE INDEX IF NOT EXISTS idx_bolo_servidor_activo ON public.bolo(servidor_id) WHERE activo = true;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Mostrar estado de las tablas actualizadas
SELECT 
    'Tabla' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('cuentas_bancarias', 'servicio', 'bolo') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
