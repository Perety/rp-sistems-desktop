-- Verificar estructura exacta de la tabla sanciones
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar todas las sanciones existentes
SELECT * FROM sanciones LIMIT 10;

-- Verificar si hay alguna columna relacionada con usuario
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sanciones' 
AND table_schema = 'public'
AND (column_name LIKE '%usuario%' OR column_name LIKE '%personaje%' OR column_name LIKE '%user%');

-- Verificar si hay sanciones para el admin por otros campos
SELECT * FROM sanciones 
WHERE servidor_id = 'SRV001' 
ORDER BY created_at DESC 
LIMIT 10;
