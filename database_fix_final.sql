-- ============================================================
-- ACTUALIZACIÓN FINAL - VINCULAR DATOS EXISTENTES
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
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cuentas_bancarias' AND column_name = 'servidor_id') THEN
            ALTER TABLE public.cuentas_bancarias ADD COLUMN servidor_id UUID;
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
-- CREAR TABLAS NUEVAS
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

-- Tabla negocios (sin referencias complejas)
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  dueno_id TEXT,
  dinero_caja INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla negocio_empleados (sin referencias complejas)
CREATE TABLE IF NOT EXISTS public.negocio_empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id TEXT,
  usuario_id TEXT,
  rol_negocio TEXT DEFAULT 'empleado',
  salario INTEGER DEFAULT 1500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VINCULAR DATOS EXISTENTES
-- ============================================================

-- Vincular cuentas bancarias existentes con usuarios
DO $$
BEGIN
    -- Actualizar cuentas bancarias existentes para vincularlas con usuarios
    UPDATE public.cuentas_bancarias 
    SET usuario_id = (
        SELECT u.id 
        FROM public.usuarios u 
        WHERE u.id IS NOT NULL 
        LIMIT 1
    ),
    servidor_id = (
        SELECT s.id 
        FROM public.servidores s 
        WHERE s.codigo = 'SRV001' 
        LIMIT 1
    )
    WHERE usuario_id IS NULL;
END $$;

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

-- Insertar negocio de ejemplo
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.negocios) = 0 THEN
        INSERT INTO public.negocios (servidor_id, nombre, tipo, descripcion, dueno_id, activo)
        VALUES ('SRV001', 'Tienda General', 'tienda', 'Tienda de artículos varios', 'admin', true);
    END IF;
END $$;
