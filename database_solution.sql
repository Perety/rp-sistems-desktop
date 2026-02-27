-- ============================================================
-- SOLUCIÓN ESPECÍFICA PARA TU BASE DE DATOS
-- Basado en la estructura real que tienes
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACTUALIZAR CUENTAS_BANCARIAS - AÑADIR COLUMNAS FALTANTES
-- ============================================================

DO $$
BEGIN
    -- Verificar si la tabla existe antes de modificar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuentas_bancarias' AND table_schema = 'public') THEN
        -- Añadir columnas que faltan
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'usuario_id') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN usuario_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'tipo') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN tipo TEXT DEFAULT 'personal';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'activa') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN activa BOOLEAN DEFAULT true;
        END IF;
        
        -- Vincular cuentas existentes con usuarios
        UPDATE public.cuentas_bancarias 
        SET usuario_id = (
            SELECT u.id 
            FROM public.usuarios u 
            WHERE u.rol = 'admin' 
            LIMIT 1
        )
        WHERE usuario_id IS NULL;
        
        -- Vincular servidor_id
        UPDATE public.cuentas_bancarias 
        SET servidor_id = (
            SELECT s.id 
            FROM public.servidores s 
            WHERE s.codigo = 'SRV001' 
            LIMIT 1
        )
        WHERE servidor_id IS NULL;
    END IF;
END $$;

-- ============================================================
-- ACTUALIZAR OTRAS TABLAS
-- ============================================================

-- Actualizar servicio
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servicio' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicio' AND column_name = 'tipo') THEN
            ALTER TABLE public.servicio ADD COLUMN tipo TEXT DEFAULT 'general';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicio' AND column_name = 'negocio_id') THEN
            ALTER TABLE public.servicio ADD COLUMN negocio_id TEXT;
        END IF;
    END IF;
END $$;

-- Actualizar bolo
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bolo' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bolo' AND column_name = 'destinatarios') THEN
            ALTER TABLE public.bolo ADD COLUMN destinatarios TEXT DEFAULT 'todos';
        END IF;
    END IF;
END $$;

-- ============================================================
-- CREAR TABLAS NUEVAS
-- ============================================================

-- Tabla items (tienda)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  precio INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla sanciones
CREATE TABLE IF NOT EXISTS public.sanciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID,
  usuario_id UUID,
  usuario_sancionado_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  duracion_horas INTEGER,
  emitido_por TEXT,
  emitido_por_id UUID,
  activa BOOLEAN DEFAULT true,
  expira_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocios
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  dueno_id UUID,
  dinero_caja INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocio_empleados
CREATE TABLE IF NOT EXISTS public.negocio_empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID,
  usuario_id UUID,
  rol_negocio TEXT DEFAULT 'empleado',
  salario INTEGER DEFAULT 1500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSERTAR DATOS BÁSICOS
-- ============================================================

-- Insertar items si la tabla está vacía
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.items) = 0 THEN
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            s.id,
            'Pistola 9mm',
            'Pistola estándar con 17 balas',
            'arma',
            5000,
            10,
            true
        FROM public.servidores s WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            s.id,
            'Hamburguesa',
            'Hamburguesa clásica con papas',
            'comida',
            50,
            100,
            true
        FROM public.servidores s WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        SELECT 
            s.id,
            'Refresco',
            'Refresco de 500ml',
            'bebida',
            25,
            100,
            true
        FROM public.servidores s WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insertar negocio de ejemplo
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.negocios) = 0 THEN
        INSERT INTO public.negocios (servidor_id, nombre, tipo, descripcion, dueno_id, activo)
        SELECT 
            s.id,
            'Tienda General',
            'tienda',
            'Tienda de artículos varios',
            u.id,
            true
        FROM public.servidores s, public.usuarios u 
        WHERE s.codigo = 'SRV001' AND u.rol = 'admin'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
