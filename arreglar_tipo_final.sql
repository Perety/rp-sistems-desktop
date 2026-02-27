-- Arreglar definitivamente el problema de la columna tipo
-- Primero eliminar el INSERT que está causando el problema
-- Luego actualizar todos los valores NULL

-- 1. Actualizar todos los NULL en tipo con valores de tipo_sancion
UPDATE sanciones 
SET tipo = COALESCE(tipo_sancion, 'warning')
WHERE tipo IS NULL;

-- 2. Verificar que no queden NULLs
SELECT 
    'Verificación de NULLs' as mensaje,
    COUNT(*) as total,
    COUNT(tipo) as con_tipo,
    COUNT(*) - COUNT(tipo) as sin_tipo
FROM sanciones;

-- 3. Mostrar estado actual
SELECT 
    id,
    tipo,
    tipo_sancion,
    estado,
    motivo
FROM sanciones 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Si todo está bien, ahora podemos continuar con el sistema funcional
-- (esto es solo para confirmar que podemos continuar)
SELECT 'Listo para ejecutar sistema_sanciones_funcional.sql' as proximo_paso;
