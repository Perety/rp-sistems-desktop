-- Añadir las columnas faltantes en roles_permisos
-- Ejecutar en Supabase SQL Editor

-- Permisos de Economía que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_quitar_dinero BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_transferir_dinero BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_transacciones BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_crear_cuentas BOOLEAN DEFAULT FALSE;

-- Permisos de Usuarios que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_usuarios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_crear_usuarios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_usuarios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_eliminar_usuarios BOOLEAN DEFAULT FALSE;

-- Permisos de Negocios que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_negocios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_negocios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_eliminar_negocios BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_gestionar_stock BOOLEAN DEFAULT FALSE;

-- Permisos de Vehículos que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_vehiculos BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_crear_vehiculos BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_vehiculos BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_eliminar_vehiculos BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_transferir_vehiculos BOOLEAN DEFAULT FALSE;

-- Permisos de Policía que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_emitir_multas BOOLEAN DEFAULT FALSE;

-- Verificar que todas las columnas estén presentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles_permisos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
