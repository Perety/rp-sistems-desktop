-- ============================================================
-- ACTUALIZACIÓN COMPLETA DE BASE DE DATOS - SISTEMA RP
-- Ejecuta este archivo completo en Supabase SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: items (para la tienda)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL, -- 'arma', 'comida', 'bebida', 'herramienta', 'ropa', 'vehiculo', 'otro'
  precio INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTUALIZAR TABLA: servicio (añadir tipo y negocio_id)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicio' AND column_name = 'tipo') THEN
        ALTER TABLE public.servicio ADD COLUMN tipo TEXT DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicio' AND column_name = 'negocio_id') THEN
        ALTER TABLE public.servicio ADD COLUMN negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- ACTUALIZAR TABLA: bolo (añadir destinatarios)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bolo' AND column_name = 'destinatarios') THEN
        ALTER TABLE public.bolo ADD COLUMN destinatarios TEXT DEFAULT 'todos';
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
    nuevo_stock INTEGER;
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
    
    -- Registrar en auditoría
    INSERT INTO public.auditoria (servidor_id, usuario_id, accion, modulo, descripcion)
    VALUES (p_servidor_id, p_usuario_id, 'Item Comprado', 'tienda', item_record.nombre);
    
    RETURN 'Compra exitosa';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INSERTAR ITEMS DE EJEMPLO
-- ============================================================
INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
SELECT 
    id,
    'Pistola 9mm',
    'Pistola estándar con 17 balas',
    'arma',
    5000,
    10,
    true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
SELECT 
    id,
    'Hamburguesa',
    'Hamburguesa clásica con papas',
    'comida',
    50,
    100,
    true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
SELECT 
    id,
    'Refresco',
    'Refresco de 500ml',
    'bebida',
    25,
    100,
    true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
SELECT 
    id,
    'Chaleco Antibalas',
    'Chaleco antibalas nivel III',
    'herramienta',
    2000,
    5,
    true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (servidor_id, nombre, descripcion, categoria, precio, stock, activo)
SELECT 
    id,
    'Casco',
    'Casco de protección',
    'herramienta',
    500,
    20,
    true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONFIGURAR REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE bolo;

-- ============================================================
-- CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_servidor_activo ON public.items(servidor_id, activo);
CREATE INDEX IF NOT EXISTS idx_servicio_servidor_activo ON public.servicio(servidor_id) WHERE hora_fin IS NULL;
CREATE INDEX IF NOT EXISTS idx_bolo_servidor_activo ON public.bolo(servidor_id) WHERE activo = true;

-- ============================================================
-- VERIFICAR ESTRUCTURA
-- ============================================================
-- Mostrar tablas creadas/actualizadas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('items', 'servicio', 'bolo', 'cuentas_bancarias')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
