-- Script para verificar y actualizar la tabla roles_permisos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar columnas actuales
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles_permisos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si faltan columnas comparando con el tipo RolPermiso
-- Columnas que deberían existir según la interfaz:

-- Columnas básicas (deberían existir):
-- id (uuid/varchar)
-- servidor_id (uuid/varchar) 
-- nombre_rol (varchar)
-- color (varchar)
-- jerarquia (integer)

-- Permisos de Usuarios (verificar si existen):
-- puede_banear (boolean)
-- puede_advertir (boolean)
-- puede_gestionar_usuarios (boolean)
-- puede_ver_usuarios (boolean)
-- puede_crear_usuarios (boolean)
-- puede_editar_usuarios (boolean)
-- puede_eliminar_usuarios (boolean)

-- Permisos de Economía:
-- puede_ver_economia (boolean)
-- puede_dar_dinero (boolean)
-- puede_quitar_dinero (boolean)
-- puede_transferir_dinero (boolean)
-- puede_ver_transacciones (boolean)
-- puede_crear_cuentas (boolean)

-- Permisos de Negocios:
-- puede_crear_negocios (boolean)
-- puede_editar_negocios (boolean)
-- puede_eliminar_negocios (boolean)
-- puede_ver_negocios (boolean)
-- puede_gestionar_stock (boolean)
-- puede_emitir_facturas (boolean)

-- Permisos de Vehículos:
-- puede_ver_vehiculos (boolean)
-- puede_crear_vehiculos (boolean)
-- puede_editar_vehiculos (boolean)
-- puede_eliminar_vehiculos (boolean)
-- puede_transferir_vehiculos (boolean)

-- Permisos de Policía/MDT:
-- puede_ver_mdt (boolean)
-- puede_editar_mdt (boolean)
-- puede_emitir_multas (boolean)
-- puede_arrestar (boolean) <-- ESTA FALTA
-- puede_ver_citizen (boolean)
-- puede_editar_citizen (boolean)
-- puede_buscar_personas (boolean)

-- Permisos Médicos:
-- puede_ver_pacientes (boolean)
-- puede_tratar_pacientes (boolean)
-- puede_emitir_recetas (boolean)
-- puede_ver_historial (boolean)

-- Permisos de Licencias:
-- puede_emitir_licencias (boolean)
-- puede_revocar_licencias (boolean)
-- puede_ver_licencias (boolean)

-- Permisos de Inventario:
-- puede_ver_inventario (boolean)
-- puede_gestionar_inventario (boolean)
-- puede_agregar_items (boolean)
-- puede_eliminar_items (boolean)

-- Permisos de Auditoría:
-- puede_ver_logs (boolean)
-- puede_ver_auditoria (boolean)
-- puede_exportar_datos (boolean)

-- Permisos de Administración:
-- puede_ver_panel_admin (boolean)
-- puede_configurar_servidor (boolean)
-- puede_reiniciar_servidor (boolean)
-- puede_ver_estadisticas (boolean)
-- puede_gestionar_backup (boolean)
-- puede_mantenimiento (boolean)

-- Permisos de Servidor:
-- puede_ver_consola (boolean)
-- puede_ejecutar_comandos (boolean)
-- puede_gestionar_plugins (boolean)
-- puede_ver_recursos (boolean)

-- 3. Añadir columnas faltantes (ejecutar solo si faltan)

-- Columnas de Policía/MDT que probablemente faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_arrestar BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_citizen BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_citizen BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_buscar_personas BOOLEAN DEFAULT FALSE;

-- Columnas Médicas:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_pacientes BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_tratar_pacientes BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_emitir_recetas BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_historial BOOLEAN DEFAULT FALSE;

-- Columnas de Licencias:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_emitir_licencias BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_revocar_licencias BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_licencias BOOLEAN DEFAULT FALSE;

-- Columnas de Inventario:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_inventario BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_gestionar_inventario BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_agregar_items BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_eliminar_items BOOLEAN DEFAULT FALSE;

-- Columnas de Auditoría:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_logs BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_auditoria BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_exportar_datos BOOLEAN DEFAULT FALSE;

-- Columnas de Administración:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_panel_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_configurar_servidor BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_reiniciar_servidor BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_estadisticas BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_gestionar_backup BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_mantenimiento BOOLEAN DEFAULT FALSE;

-- Columnas de Servidor:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_consola BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ejecutar_comandos BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_gestionar_plugins BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_recursos BOOLEAN DEFAULT FALSE;

-- 4. Verificar después de añadir columnas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles_permisos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
