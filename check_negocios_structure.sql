-- ============================================================
-- VER ESTRUCTURA DE NEGOCIOS
-- ============================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'negocios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
