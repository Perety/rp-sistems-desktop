-- ============================================================
-- ACTUALIZACIÓN SIMPLE - SISTEMA RP
-- Solo actualiza las columnas que faltan
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACTUALIZAR TABLAS EXISTENTES
-- ============================================================

-- Actualizar cuentas_bancarias
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuentas_bancarias' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'usuario_id') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN usuario_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'tipo') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN tipo TEXT DEFAULT 'personal';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'activa') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN activa BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

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
-- CREAR TABLAS NUEVAS SIMPLES
-- ============================================================

-- Tabla items (tienda)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id TEXT,
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
  servidor_id TEXT,
  usuario_id TEXT,
  usuario_sancionado_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  duracion_horas INTEGER,
  emitido_por TEXT,
  activa BOOLEAN DEFAULT true,
  expira_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSERTAR DATOS BÁSICOS
-- ============================================================

-- Insertar items básicos si la tabla está vacía
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.items) = 0 THEN
        INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
        VALUES 
            ('SRV001', 'Pistola 9mm', 'Pistola estándar con 17 balas', 'arma', 5000, 10, true),
            ('SRV001', 'Hamburguesa', 'Hamburguesa clásica con papas', 'comida', 50, 100, true),
            ('SRV001', 'Refresco', 'Refresco de 500ml', 'bebida', 25, 100, true),
            ('SRV001', 'Chaleco Antibalas', 'Chaleco antibalas nivel III', 'herramienta', 2000, 5, true),
            ('SRV001', 'Casco', 'Casco de protección', 'herramienta', 500, 20, true);
    END IF;
END $$;
