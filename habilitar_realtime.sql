-- Script para habilitar Realtime en la tabla radios
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar Realtime para la tabla radios
ALTER PUBLICATION supabase_realtime ADD TABLE radios;

-- 2. Verificar si está habilitado
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 3. Verificar políticas RLS (necesarias para Realtime)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'radios';

-- 4. Si no hay políticas, crear políticas básicas para Realtime
DROP POLICY IF EXISTS "radios_select_policy" ON radios;
CREATE POLICY "radios_select_policy" ON radios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "radios_realtime_policy" ON radios;
CREATE POLICY "radios_realtime_policy" ON radios
    FOR ALL USING (true);

-- 5. Habilitar RLS si no está activado
ALTER TABLE radios ENABLE ROW LEVEL SECURITY;
