-- ============================================================
-- DIAGNÓSTICO DE BASE DE DATOS
-- Ejecuta esto primero para ver qué tienes
-- ============================================================

-- Ver todas las tablas existentes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('usuarios', 'cuentas_bancarias', 'servidores', 'servicio', 'bolo', 'items', 'sanciones', 'negocios')
ORDER BY table_name, ordinal_position;

-- Ver datos existentes en usuarios
SELECT 'usuarios' as tabla, COUNT(*) as cantidad FROM public.usuarios
UNION ALL
SELECT 'cuentas_bancarias', COUNT(*) FROM public.cuentas_bancarias
UNION ALL
SELECT 'servidores', COUNT(*) FROM public.servidores
UNION ALL
SELECT 'servicio', COUNT(*) FROM public.servicio
UNION ALL
SELECT 'bolo', COUNT(*) FROM public.bolo
UNION ALL
SELECT 'items', COUNT(*) FROM public.items
UNION ALL
SELECT 'sanciones', COUNT(*) FROM public.sanciones
UNION ALL
SELECT 'negocios', COUNT(*) FROM public.negocios;

-- Ver estructura específica de cuentas_bancarias
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver estructura específica de usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
