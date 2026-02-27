-- ============================================================
-- VERIFICAR NEGOCIOS
-- ============================================================

-- Ver negocios existentes
SELECT 
    'NEGOCIOS EXISTENTES' as resultado,
    COUNT(*) as cantidad
FROM public.negocios;

-- Ver detalles de negocios
SELECT 
    id,
    nombre,
    tipo,
    descripcion,
    dueno_id,
    activo
FROM public.negocios
LIMIT 5;

-- Ver negocio_empleados
SELECT 
    'EMPLEADOS DE NEGOCIOS' as resultado,
    COUNT(*) as cantidad
FROM public.negocio_empleados;

-- Ver detalles de empleados
SELECT 
    id,
    negocio_id,
    usuario_id,
    rol_negocio,
    salario
FROM public.negocio_empleados
LIMIT 5;
