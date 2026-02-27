-- ============================================================
-- SOLUCIÓN FINAL BASADA EN TU ESTRUCTURA REAL
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ACTUALIZAR TABLAS EXISTENTES
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
-- CREAR CUENTAS BANCARIAS PARA TODOS LOS USUARIOS
-- ============================================================

DO $$
BEGIN
    -- Crear cuentas bancarias para usuarios que no tienen
    INSERT INTO public.cuentas_bancarias (
        usuario_id,
        personaje_id,
        servidor_id,
        numero_cuenta,
        dinero_banco,
        activa
    )
    SELECT 
        u.id as usuario_id,
        NULL as personaje_id,
        s.id as servidor_id,
        'ACC-' || SUBSTRING(u.id::text, 1, 8) as numero_cuenta,
        1000.00 as dinero_banco,
        true as activa
    FROM public.usuarios u, public.servidores s
    WHERE s.codigo = 'SRV001'
    AND NOT EXISTS (
        SELECT 1 FROM public.cuentas_bancarias cb 
        WHERE cb.usuario_id = u.id
    );
END $$;

-- ============================================================
-- VERIFICAR ITEMS Y CREAR SI ES NECESARIO
-- ============================================================

-- Ver si la tabla items tiene las columnas necesarias
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items' AND table_schema = 'public') THEN
        -- Añadir columnas faltantes si es necesario
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'precio') THEN
            ALTER TABLE public.items ADD COLUMN precio INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'stock') THEN
            ALTER TABLE public.items ADD COLUMN stock INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'activo') THEN
            ALTER TABLE public.items ADD COLUMN activo BOOLEAN DEFAULT true;
        END IF;
        
        -- Insertar items si la tabla está vacía
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
    END IF;
END $$;

-- ============================================================
-- CREAR SANCIONES SI NO EXISTE
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sanciones' AND table_schema = 'public') THEN
        CREATE TABLE public.sanciones (
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
    END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Mostrar cuentas bancarias creadas
SELECT 
    'CUENTAS BANCARIAS CREADAS' as resultado,
    COUNT(*) as cantidad
FROM public.cuentas_bancarias;

-- Mostrar items disponibles
SELECT 
    'ITEMS DISPONIBLES' as resultado,
    COUNT(*) as cantidad
FROM public.items;
