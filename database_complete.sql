-- ============================================================
-- BASE DE DATOS COMPLETA - SISTEMA RP ACTUALIZADO
-- Ejecuta este archivo completo en Supabase SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: servidores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.servidores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  logo_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar servidor de ejemplo
INSERT INTO public.servidores (nombre, codigo, descripcion) 
VALUES ('Servidor Principal', 'SRV001', 'Servidor principal del sistema')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- TABLA: roles_permisos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles_permisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre_rol TEXT NOT NULL,
  color TEXT DEFAULT '#00d9ff',
  jerarquia INTEGER DEFAULT 0,
  puede_banear BOOLEAN DEFAULT false,
  puede_advertir BOOLEAN DEFAULT false,
  puede_crear_negocios BOOLEAN DEFAULT false,
  puede_emitir_facturas BOOLEAN DEFAULT false,
  puede_ver_mdt BOOLEAN DEFAULT false,
  puede_editar_mdt BOOLEAN DEFAULT false,
  puede_gestionar_usuarios BOOLEAN DEFAULT false,
  puede_ver_economia BOOLEAN DEFAULT false,
  puede_dar_dinero BOOLEAN DEFAULT false,
  puede_gestionar_inventario BOOLEAN DEFAULT false,
  puede_emitir_licencias BOOLEAN DEFAULT false,
  puede_ver_auditoria BOOLEAN DEFAULT false,
  puede_gestionar_roles BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar roles básicos
INSERT INTO public.roles_permisos (servidor_id, nombre_rol, color, jerarquia, puede_ver_mdt, puede_ver_economia)
SELECT id, 'superadmin', '#ff4757', 100, true, true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.roles_permisos (servidor_id, nombre_rol, color, jerarquia, puede_ver_mdt, puede_ver_economia)
SELECT id, 'admin', '#00d9ff', 90, true, true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.roles_permisos (servidor_id, nombre_rol, color, jerarquia, puede_ver_mdt)
SELECT id, 'lspd', '#3b82f6', 50, true
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

INSERT INTO public.roles_permisos (servidor_id, nombre_rol, color, jerarquia)
SELECT id, 'ciudadano', '#8b96a5', 10
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  placa TEXT,
  rango TEXT,
  rol TEXT NOT NULL DEFAULT 'ciudadano',
  activo BOOLEAN DEFAULT true,
  avatar_url TEXT,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar usuario admin
INSERT INTO public.usuarios (servidor_id, username, password, nombre, rol, rango, placa)
SELECT id, 'admin', 'admin123', 'Administrador', 'superadmin', 'SuperAdmin', 'ADMIN-001'
FROM public.servidores WHERE codigo = 'SRV001'
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: cuentas_bancarias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'personal',
  saldo INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear cuenta para admin
INSERT INTO public.cuentas_bancarias (usuario_id, servidor_id, tipo, saldo, activa)
SELECT u.id, u.servidor_id, 'personal', 1000, true
FROM public.usuarios u, public.servidores s 
WHERE u.username = 'admin' AND s.codigo = 'SRV001'
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: items (tienda)
-- ============================================================
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
-- TABLA: servicio
-- ============================================================
CREATE TABLE IF NOT EXISTS public.servicio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'general',
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL,
  hora_inicio TIMESTAMPTZ DEFAULT NOW(),
  hora_fin TIMESTAMPTZ,
  estado TEXT DEFAULT 'disponible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: bolo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bolo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  destinatarios TEXT DEFAULT 'todos',
  activo BOOLEAN DEFAULT true,
  estado TEXT DEFAULT 'activo',
  creado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: sanciones
-- ============================================================
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
-- TABLA: negocios
-- ============================================================
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

-- ============================================================
-- TABLA: negocio_empleados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocio_empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE,
  rol_negocio TEXT DEFAULT 'empleado',
  salario INTEGER DEFAULT 1500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: negocio_stock
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocio_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  item_nombre TEXT NOT NULL,
  precio_compra INTEGER NOT NULL,
  precio_venta INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ciudadanos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ciudadanos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  telefono TEXT,
  direccion TEXT,
  fecha_nacimiento DATE,
  nacionalidad TEXT DEFAULT 'Española',
  ocupacion TEXT,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  oficial_registro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: vehiculos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  marca TEXT,
  modelo TEXT,
  color TEXT,
  propietario_nombre TEXT,
  estado TEXT DEFAULT 'Normal',
  notas TEXT,
  oficial_registro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: multas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.multas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  ciudadano_nombre TEXT NOT NULL,
  importe INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  oficial_nombre TEXT,
  oficial_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: arrestos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arrestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  ciudadano_nombre TEXT NOT NULL,
  motivo TEXT NOT NULL,
  duracion_horas INTEGER NOT NULL,
  oficial_nombre TEXT,
  oficial_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: llamadas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.llamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  ciudadano_id UUID REFERENCES public.ciudadanos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  ubicacion TEXT,
  estado TEXT DEFAULT 'pendiente',
  prioridad TEXT DEFAULT 'normal',
  oficial_asignado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: denuncias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  victima TEXT NOT NULL,
  acusado TEXT,
  narracion TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  oficial_receptor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: investigaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.investigaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'abierta',
  detective_lider TEXT,
  investigador_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  evidencias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: auditoria
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  usuario_nombre TEXT,
  accion TEXT NOT NULL,
  modulo TEXT,
  descripcion TEXT,
  fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: personajes
-- ============================================================
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

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función para comprar items
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
-- POLÍTICAS RLS
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocio_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocio_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciudadanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE llamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE personajes ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso anónimo
CREATE POLICY "Allow all for anon" ON public.servidores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.usuarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.roles_permisos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.cuentas_bancarias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.servicio FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.bolo FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.sanciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocio_empleados FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocio_stock FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.personajes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.ciudadanos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.vehiculos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.multas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.arrestos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.llamadas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.denuncias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.investigaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.auditoria FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- CONFIGURACIÓN REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE servidores;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;
ALTER PUBLICATION supabase_realtime ADD TABLE roles_permisos;
ALTER PUBLICATION supabase_realtime ADD TABLE cuentas_bancarias;
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE bolo;
ALTER PUBLICATION supabase_realtime ADD TABLE sanciones;
ALTER PUBLICATION supabase_realtime ADD TABLE negocios;
ALTER PUBLICATION supabase_realtime ADD TABLE negocio_empleados;
ALTER PUBLICATION supabase_realtime ADD TABLE negocio_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE personajes;
ALTER PUBLICATION supabase_realtime ADD TABLE ciudadanos;
ALTER PUBLICATION supabase_realtime ADD TABLE vehiculos;
ALTER PUBLICATION supabase_realtime ADD TABLE multas;
ALTER PUBLICATION supabase_realtime ADD TABLE arrestos;
ALTER PUBLICATION supabase_realtime ADD TABLE llamadas;
ALTER PUBLICATION supabase_realtime ADD TABLE denuncias;
ALTER PUBLICATION supabase_realtime ADD TABLE investigaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE auditoria;

-- ============================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_servidores_codigo ON public.servidores(codigo);
CREATE INDEX IF NOT EXISTS idx_usuarios_servidor_username ON public.usuarios(servidor_id, username);
CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_usuario ON public.cuentas_bancarias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_items_servidor_activo ON public.items(servidor_id, activo);
CREATE INDEX IF NOT EXISTS idx_servicio_servidor_activo ON public.servicio(servidor_id) WHERE hora_fin IS NULL;
CREATE INDEX IF NOT EXISTS idx_bolo_servidor_activo ON public.bolo(servidor_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_sanciones_servidor_activo ON public.sanciones(servidor_id) WHERE activa = true;
CREATE INDEX IF NOT EXISTS idx_ciudadanos_servidor ON public.ciudadanos(servidor_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_servidor ON public.vehiculos(servidor_id);
CREATE INDEX IF NOT EXISTS idx_multas_servidor ON public.multas(servidor_id);
CREATE INDEX IF NOT EXISTS idx_arrestos_servidor ON public.arrestos(servidor_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_servidor ON public.llamadas(servidor_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_servidor ON public.denuncias(servidor_id);
CREATE INDEX IF NOT EXISTS idx_investigaciones_servidor ON public.investigaciones(servidor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_servidor_fecha ON public.auditoria(servidor_id, fecha_hora);

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Mostrar resumen de tablas creadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'servidores', 'usuarios', 'roles_permisos', 'cuentas_bancarias', 'items',
        'servicio', 'bolo', 'sanciones', 'negocios', 'negocio_empleados',
        'negocio_stock', 'ciudadanos', 'vehiculos', 'multas', 'arrestos',
        'llamadas', 'denuncias', 'investigaciones', 'auditoria', 'personajes'
    )
ORDER BY tablename;

-- Mostrar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Mostrar tablas en Realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Mostrar datos iniciales
SELECT 'Servidores' as tabla, COUNT(*) as cantidad FROM public.servidores
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM public.usuarios
UNION ALL
SELECT 'Cuentas Bancarias', COUNT(*) FROM public.cuentas_bancarias
UNION ALL
SELECT 'Items', COUNT(*) FROM public.items
UNION ALL
SELECT 'Roles', COUNT(*) FROM public.roles_permisos;
