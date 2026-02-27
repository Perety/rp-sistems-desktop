-- ============================================================
-- CREAR NEGOCIOS BASADO EN ESTRUCTURA REAL
-- ============================================================

-- Crear negocios de ejemplo si no existen
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.negocios) = 0 THEN
        -- Crear tienda general para admin
        INSERT INTO public.negocios (
            servidor_id,
            dueno_personaje_id,
            nombre,
            tipo,
            descripcion,
            direccion,
            dinero_caja,
            activo
        )
        SELECT 
            s.id,
            NULL as dueno_personaje_id, -- Lo vincularemos después
            'Tienda General',
            'tienda',
            'Tienda de artículos varios',
            'Calle Principal #123',
            5000.00,
            true
        FROM public.servidores s 
        WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
        
        -- Crear restaurante
        INSERT INTO public.negocios (
            servidor_id,
            dueno_personaje_id,
            nombre,
            tipo,
            descripcion,
            direccion,
            dinero_caja,
            activo
        )
        SELECT 
            s.id,
            NULL as dueno_personaje_id,
            'Restaurante Central',
            'restaurante',
            'Comida rápida y tradicional',
            'Avenida Principal #456',
            3000.00,
            true
        FROM public.servidores s 
        WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
        
        -- Crear mecánico
        INSERT INTO public.negocios (
            servidor_id,
            dueno_personaje_id,
            nombre,
            tipo,
            descripcion,
            direccion,
            dinero_caja,
            activo
        )
        SELECT 
            s.id,
            NULL as dueno_personaje_id,
            'Taller Mecánico',
            'mecanico',
            'Reparación de vehículos',
            'Calle Industrial #789',
            2000.00,
            true
        FROM public.servidores s 
        WHERE s.codigo = 'SRV001'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN DE NEGOCIOS CREADOS
-- ============================================================

SELECT 
    'NEGOCIOS CREADOS' as resultado,
    COUNT(*) as cantidad
FROM public.negocios;

-- Mostrar detalles de negocios
SELECT 
    id,
    nombre,
    tipo,
    descripcion,
    dinero_caja,
    activo
FROM public.negocios
ORDER BY created_at;
