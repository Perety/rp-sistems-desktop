-- ============================================================
-- VERIFICACIÓN PARA FRONTEND
-- ============================================================

-- Verificar que la consulta del frontend funcione
SELECT 
    cb.id,
    cb.usuario_id,
    cb.numero_cuenta,
    cb.dinero_banco,
    cb.activa,
    u.nombre,
    u.rol
FROM public.cuentas_bancarias cb
INNER JOIN public.usuarios u ON cb.usuario_id = u.id
WHERE cb.servidor_id = 'bbc123f4-c55a-4e6a-8a09-763aeebd50a1'
    AND cb.activa = true
    AND u.id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'; -- ID del admin

-- Verificar que el usuario admin tenga cuenta
SELECT 
    'ADMIN TIENE CUENTA' as verificacion,
    COUNT(*) as cantidad
FROM public.cuentas_bancarias cb
WHERE cb.usuario_id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
    AND cb.activa = true;
