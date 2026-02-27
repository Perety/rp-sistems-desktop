-- Script para verificar si las tablas de radios existen
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe la tabla radios
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name = 'radios'
) as tabla_radios_existe;

-- 2. Verificar si existe la tabla radio_permisos
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name = 'radio_permisos'
) as tabla_permisos_existe;

-- 3. Verificar si existe la tabla radio_usuarios
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name = 'radio_usuarios'
) as tabla_usuarios_existe;

-- 4. Verificar columnas de la tabla radios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'radios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar si hay radios creadas
SELECT COUNT(*) as total_radios, 
       COUNT(*) FILTER (WHERE activa = true) as radios_activas
FROM radios;

-- 6. Verificar radios del servidor actual
SELECT id, nombre, frecuencia, tipo, activa, servidor_id
FROM radios 
WHERE servidor_id = 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
ORDER BY prioridad DESC;
