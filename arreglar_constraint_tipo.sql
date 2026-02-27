-- Arreglar el problema de la constraint NOT NULL en la columna "tipo"
-- Primero actualizar todos los valores NULL en "tipo" con valores de "tipo_sancion"
UPDATE sanciones 
SET tipo = tipo_sancion 
WHERE tipo IS NULL AND tipo_sancion IS NOT NULL;

-- Si aún hay NULL, poner un valor por defecto
UPDATE sanciones 
SET tipo = 'warning' 
WHERE tipo IS NULL;

-- Verificar que no haya NULLs
SELECT 
    COUNT(*) as total_sanciones,
    COUNT(tipo) as con_tipo,
    COUNT(tipo_sancion) as con_tipo_sancion,
    COUNT(*) - COUNT(tipo) as sin_tipo,
    COUNT(*) - COUNT(tipo_sancion) as sin_tipo_sancion
FROM sanciones;

-- Mostrar las sanciones que podrían tener problemas
SELECT 
    id,
    tipo,
    tipo_sancion,
    motivo,
    estado
FROM sanciones 
WHERE tipo IS NULL OR tipo_sancion IS NULL
ORDER BY created_at DESC;
