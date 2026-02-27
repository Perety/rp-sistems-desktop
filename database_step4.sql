-- ============================================================
-- PASO 4: VER CUENTAS BANCARIAS EXISTENTES
-- ============================================================

SELECT 
    id,
    usuario_id,
    personaje_id,
    servidor_id,
    numero_cuenta,
    dinero_banco,
    activa
FROM public.cuentas_bancarias 
LIMIT 5;
