-- Verificar estructura exacta de la tabla sanciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar las 6 sanciones existentes
SELECT * FROM sanciones LIMIT 6;

-- Verificar si hay columna personaje_id o similar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
AND table_schema = 'public'
AND column_name LIKE '%personaje%';
