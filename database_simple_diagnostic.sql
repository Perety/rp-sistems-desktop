-- ============================================================
-- DIAGNÓSTICO SIMPLE - SIN ERRORES
-- ============================================================

-- 1. TODAS LAS TABLAS EXISTENTES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. ESTRUCTURA DE CUENTAS_BANCARIAS (sin columnas que no existan)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ESTRUCTURA DE USUARIOS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUCTURA DE SERVIDORES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servidores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. CUÁNTOS DATOS HAY
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

-- 6. USUARIOS EXISTENTES
SELECT 
    id,
    username,
    nombre,
    rol,
    activo
FROM public.usuarios 
LIMIT 3;

-- 7. SERVIDORES EXISTENTES
SELECT 
    id,
    nombre,
    codigo,
    activo
FROM public.servidores;
