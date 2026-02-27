-- ============================================================
-- DEBUG DE CUENTAS BANCARIAS
-- ============================================================

-- Ver todas las cuentas bancarias con sus usuarios
SELECT 
    cb.id,
    cb.usuario_id,
    cb.personaje_id,
    cb.servidor_id,
    cb.numero_cuenta,
    cb.dinero_banco,
    cb.activa,
    u.username,
    u.nombre,
    u.rol
FROM public.cuentas_bancarias cb
LEFT JOIN public.usuarios u ON cb.usuario_id = u.id
ORDER BY u.nombre;

-- Ver usuarios sin cuenta bancaria
SELECT 
    'USUARIOS SIN CUENTA' as problema,
    u.id,
    u.username,
    u.nombre,
    u.rol,
    u.activo
FROM public.usuarios u
WHERE NOT EXISTS (
    SELECT 1 FROM public.cuentas_bancarias cb 
    WHERE cb.usuario_id = u.id
);

-- Ver cuentas sin usuario vinculado
SELECT 
    'CUENTAS SIN USUARIO' as problema,
    cb.id,
    cb.usuario_id,
    cb.numero_cuenta,
    cb.dinero_banco
FROM public.cuentas_bancarias cb
WHERE cb.usuario_id IS NULL;
