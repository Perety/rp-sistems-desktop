-- ============================================================
-- SISTEMA RP - SCHEMA UNIFICADO PARA SUPABASE
-- Pega este archivo completo en Supabase SQL Editor y ejecuta
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
-- Permisos dinámicos por rol en cada servidor
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles_permisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre_rol TEXT NOT NULL,          -- 'owner','admin','mod','lspd','ems','ciudadano'
  color TEXT DEFAULT '#00d9ff',
  jerarquia INTEGER DEFAULT 0,       -- Mayor número = mayor rango
  -- Permisos booleanos
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(servidor_id, nombre_rol)
);

-- Roles por defecto para el servidor principal
INSERT INTO public.roles_permisos (servidor_id, nombre_rol, color, jerarquia, puede_banear, puede_advertir, puede_crear_negocios, puede_emitir_facturas, puede_ver_mdt, puede_editar_mdt, puede_gestionar_usuarios, puede_ver_economia, puede_dar_dinero, puede_gestionar_inventario, puede_emitir_licencias, puede_ver_auditoria, puede_gestionar_roles)
SELECT s.id, r.nombre_rol, r.color, r.jerarquia, r.puede_banear, r.puede_advertir, r.puede_crear_negocios, r.puede_emitir_facturas, r.puede_ver_mdt, r.puede_editar_mdt, r.puede_gestionar_usuarios, r.puede_ver_economia, r.puede_dar_dinero, r.puede_gestionar_inventario, r.puede_emitir_licencias, r.puede_ver_auditoria, r.puede_gestionar_roles
FROM public.servidores s
CROSS JOIN (VALUES
  ('superadmin','#ff4757', 1000, true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('admin',     '#ffa502', 900,  true, true, true, true, true, true, true, true, true, true, true, true, false),
  ('mod',       '#8b5cf6', 800,  false,true, false,false,true, true, true, false,false,false,false,true, false),
  ('lspd',      '#3b82f6', 700,  false,false,false,true, true, true, false,false,false,false,true, false,false),
  ('ems',       '#10b981', 600,  false,false,false,true, true, false,false,false,false,false,false,false,false),
  ('ciudadano', '#6b7280', 100,  false,false,false,false,false,false,false,false,false,false,false,false,false)
) AS r(nombre_rol, color, jerarquia, puede_banear, puede_advertir, puede_crear_negocios, puede_emitir_facturas, puede_ver_mdt, puede_editar_mdt, puede_gestionar_usuarios, puede_ver_economia, puede_dar_dinero, puede_gestionar_inventario, puede_emitir_licencias, puede_ver_auditoria, puede_gestionar_roles)
WHERE s.codigo = 'SRV001'
ON CONFLICT (servidor_id, nombre_rol) DO NOTHING;

-- ============================================================
-- TABLA: usuarios
-- Sistema de login manual (username + password en texto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  placa TEXT,
  rango TEXT DEFAULT 'Agente',
  rol TEXT DEFAULT 'ciudadano',  -- Referencia a roles_permisos.nombre_rol
  activo BOOLEAN DEFAULT true,
  avatar_url TEXT,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(servidor_id, username)
);

-- Usuario superadmin por defecto
INSERT INTO public.usuarios (servidor_id, username, password, nombre, rango, rol, activo)
SELECT s.id, 'admin', 'admin123', 'Administrador', 'SuperAdmin', 'superadmin', true
FROM public.servidores s WHERE s.codigo = 'SRV001'
ON CONFLICT (servidor_id, username) DO NOTHING;

-- ============================================================
-- TABLA: personajes (DNI)
-- Un usuario puede tener múltiples personajes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  -- Datos básicos
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  fecha_nacimiento DATE,
  nacionalidad TEXT DEFAULT 'Española',
  genero TEXT DEFAULT 'Masculino',
  foto_url TEXT,
  huella_url TEXT,
  -- Estado
  vivo BOOLEAN DEFAULT true,
  en_prision BOOLEAN DEFAULT false,
  buscado BOOLEAN DEFAULT false,
  -- Historial
  historial_medico JSONB DEFAULT '[]',
  antecedentes_penales JSONB DEFAULT '[]',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: cuentas_bancarias
-- Una por personaje
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE UNIQUE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  numero_cuenta TEXT UNIQUE NOT NULL,
  dinero_mano NUMERIC(15,2) DEFAULT 5000.00,
  dinero_banco NUMERIC(15,2) DEFAULT 10000.00,
  limite_credito NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: transacciones
-- Log de todos los movimientos de dinero
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  cuenta_origen_id UUID REFERENCES public.cuentas_bancarias(id),
  cuenta_destino_id UUID REFERENCES public.cuentas_bancarias(id),
  tipo TEXT NOT NULL, -- 'transferencia','multa','salario','compra','impuesto','admin'
  cantidad NUMERIC(15,2) NOT NULL,
  descripcion TEXT,
  referencia TEXT,
  creado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: tarjetas
-- Tarjetas virtuales por personaje
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuenta_id UUID REFERENCES public.cuentas_bancarias(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  numero TEXT UNIQUE NOT NULL,
  cvv TEXT NOT NULL,
  fecha_expiracion TEXT NOT NULL,
  tipo TEXT DEFAULT 'debito', -- 'debito','credito'
  limite NUMERIC(15,2) DEFAULT 0,
  bloqueada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: negocios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  dueno_personaje_id UUID REFERENCES public.personajes(id),
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'general', -- 'restaurante','mecanico','tienda','farmacia','otro'
  descripcion TEXT,
  direccion TEXT,
  dinero_caja NUMERIC(15,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: negocio_empleados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocio_empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE,
  rol_negocio TEXT DEFAULT 'empleado', -- 'gerente','empleado','encargado'
  salario NUMERIC(15,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(negocio_id, personaje_id)
);

-- ============================================================
-- TABLA: negocio_stock
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocio_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  item_nombre TEXT NOT NULL,
  cantidad INTEGER DEFAULT 0,
  precio_compra NUMERIC(15,2) DEFAULT 0,
  precio_venta NUMERIC(15,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: items (catálogo global)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'objeto', -- 'arma','comida','medicamento','objeto','documento'
  peso NUMERIC(6,2) DEFAULT 0.1,
  imagen_url TEXT,
  precio_base NUMERIC(15,2) DEFAULT 0,
  UNIQUE(servidor_id, nombre)
);

-- ============================================================
-- TABLA: inventario_personaje
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventario_personaje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  cantidad INTEGER DEFAULT 1,
  slot INTEGER,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: licencias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.licencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personaje_id UUID REFERENCES public.personajes(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'conducir','armas','vuelo','pesca','caza'
  estado TEXT DEFAULT 'activa', -- 'activa','suspendida','revocada'
  fecha_expedicion DATE DEFAULT NOW(),
  fecha_expiracion DATE,
  expedido_por TEXT,
  motivo_suspension TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personaje_id, tipo)
);

-- ============================================================
-- TABLAS MDT - Coinciden exactamente con el HTML existente
-- ============================================================

-- ciudadanos (tabla simplificada para MDT, sin auth)
CREATE TABLE IF NOT EXISTS public.ciudadanos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  dni TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  oficial_registro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vehiculos
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  color TEXT,
  propietario_nombre TEXT,
  estado TEXT DEFAULT 'Normal', -- 'Normal','Buscado','Robado'
  notas TEXT,
  oficial_registro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- multas
CREATE TABLE IF NOT EXISTS public.multas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  ciudadano_nombre TEXT NOT NULL,
  importe NUMERIC(15,2) NOT NULL,
  motivo TEXT NOT NULL,
  oficial_nombre TEXT,
  oficial_id UUID REFERENCES public.usuarios(id),
  estado TEXT DEFAULT 'pendiente', -- 'pendiente','pagada','anulada'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- arrestos
CREATE TABLE IF NOT EXISTS public.arrestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  ciudadano_nombre TEXT NOT NULL,
  tiempo INTEGER NOT NULL, -- meses
  fianza NUMERIC(15,2) DEFAULT 0,
  cargos TEXT NOT NULL,
  oficial_nombre TEXT,
  oficial_id UUID REFERENCES public.usuarios(id),
  estado TEXT DEFAULT 'en_custodia',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- llamadas 911
CREATE TABLE IF NOT EXISTS public.llamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT DEFAULT 'normal', -- 'baja','normal','alta','critica'
  estado TEXT DEFAULT 'pendiente',
  creado_por TEXT,
  asignado_a TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOLO (Be On Look Out)
CREATE TABLE IF NOT EXISTS public.bolo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'Persona',
  descripcion TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  estado TEXT DEFAULT 'activo',
  creado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- denuncias
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  victima TEXT NOT NULL,
  acusado TEXT,
  narracion TEXT NOT NULL,
  estado TEXT DEFAULT 'abierta',
  oficial_receptor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- investigaciones
CREATE TABLE IF NOT EXISTS public.investigaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'activa',
  detective_lider TEXT,
  investigador_id UUID REFERENCES public.usuarios(id),
  evidencias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- servicio (duty roster)
CREATE TABLE IF NOT EXISTS public.servicio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  hora_inicio TIMESTAMPTZ DEFAULT NOW(),
  hora_fin TIMESTAMPTZ,
  estado TEXT DEFAULT 'disponible', -- 'disponible','ocupado','descanso','offline'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: auditoria
-- Registro de TODAS las acciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  usuario_nombre TEXT,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descripcion TEXT,
  detalles TEXT,
  ip TEXT,
  fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: sanciones
-- Warnings y bans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sanciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE CASCADE,
  usuario_sancionado_id UUID REFERENCES public.usuarios(id),
  usuario_sancionado_nombre TEXT,
  tipo TEXT NOT NULL, -- 'warning','ban','mute'
  motivo TEXT NOT NULL,
  duracion_horas INTEGER, -- NULL = permanente
  activa BOOLEAN DEFAULT true,
  emitido_por TEXT,
  emitido_por_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expira_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocio_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocio_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_personaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciudadanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanciones ENABLE ROW LEVEL SECURITY;

-- Política: la anon key tiene acceso completo de lectura y escritura
-- (El control de acceso se maneja a nivel de aplicación)
-- En producción, reemplaza esto con políticas más estrictas.

CREATE POLICY "Allow all for anon" ON public.servidores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.usuarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.roles_permisos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.personajes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.cuentas_bancarias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.transacciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.tarjetas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocio_empleados FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.negocio_stock FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.inventario_personaje FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.licencias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.ciudadanos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.vehiculos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.multas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.arrestos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.llamadas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.bolo FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.denuncias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.investigaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.servicio FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.auditoria FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.sanciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función para generar número de cuenta bancaria aleatorio
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ES' || LPAD(FLOOR(RANDOM() * 9999999999999)::TEXT, 13, '0');
END;
$$ LANGUAGE plpgsql;

-- FIN DEL SCHEMA
-- ============================================================
