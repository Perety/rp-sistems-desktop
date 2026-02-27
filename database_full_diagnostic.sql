-- ============================================================
-- DIAGNÓSTICO COMPLETO DE BASE DE DATOS
-- Ejecuta esto y pega TODOS los resultados
-- ============================================================

-- 1. TODAS LAS TABLAS EXISTENTES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. ESTRUCTURA DE TABLA USUARIOS
SELECT 
    'usuarios' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ESTRUCTURA DE TABLA CUENTAS_BANCARIAS
SELECT 
    'cuentas_bancarias' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cuentas_bancarias' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUCTURA DE TABLA SERVIDORES
SELECT 
    'servidores' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servidores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. ESTRUCTURA DE TABLA SERVICIO
SELECT 
    'servicio' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servicio' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. ESTRUCTURA DE TABLA BOLO
SELECT 
    'bolo' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bolo' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. ESTRUCTURA DE TABLA ITEMS
SELECT 
    'items' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. ESTRUCTURA DE TABLA SANCIONES
SELECT 
    'sanciones' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. ESTRUCTURA DE TABLA NEGOCIOS
SELECT 
    'negocios' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'negocios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. DATOS EXISTENTES EN CADA TABLA
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

-- 4. DATOS DE USUARIOS EXISTENTES
SELECT 
    id,
    username,
    nombre,
    rol,
    activo,
    created_at
FROM public.usuarios 
LIMIT 5;

-- 5. DATOS DE CUENTAS BANCARIAS EXISTENTES
SELECT 
    id,
    usuario_id,
    servidor_id,
    saldo,
    created_at
FROM public.cuentas_bancarias 
LIMIT 5;

-- 6. DATOS DE SERVIDORES EXISTENTES
SELECT 
    id,
    nombre,
    codigo,
    activo
FROM public.servidores;

-- 7. RESTRICCIONES Y CLAVES FORÁNEAS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type;
