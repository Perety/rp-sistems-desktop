-- ============================================================
-- PASO 3: VER USUARIOS EXISTENTES
-- ============================================================

SELECT 
    id,
    username,
    nombre,
    rol,
    activo
FROM public.usuarios 
LIMIT 5;
