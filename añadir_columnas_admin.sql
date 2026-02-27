-- Añadir columnas de Administración que faltan
-- Ejecutar en Supabase SQL Editor

-- Permisos de Administración que faltan:
ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_crear_roles BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_roles BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_eliminar_roles BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_ver_config BOOLEAN DEFAULT FALSE;

ALTER TABLE roles_permisos 
ADD COLUMN IF NOT EXISTS puede_editar_config BOOLEAN DEFAULT FALSE;

-- Verificar que todas las columnas estén presentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles_permisos' 
AND table_schema = 'public'
AND column_name LIKE 'puede_%'
ORDER BY column_name;
