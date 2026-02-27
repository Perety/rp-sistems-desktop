-- Función para transferir dinero entre tarjetas
CREATE OR REPLACE FUNCTION transferir_entre_tarjetas(
    p_tarjeta_origen_id UUID,
    p_tarjeta_destino_id UUID,
    p_monto NUMERIC
)
RETURNS void AS $$
BEGIN
    -- Verificar que las tarjetas existen
    IF NOT EXISTS (SELECT 1 FROM tarjetas_bancarias WHERE id = p_tarjeta_origen_id) THEN
        RAISE EXCEPTION 'Tarjeta de origen no encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tarjetas_bancarias WHERE id = p_tarjeta_destino_id) THEN
        RAISE EXCEPTION 'Tarjeta de destino no encontrada';
    END IF;
    
    -- Verificar saldo suficiente
    IF (SELECT saldo_disponible FROM tarjetas_bancarias WHERE id = p_tarjeta_origen_id) < p_monto THEN
        RAISE EXCEPTION 'Saldo insuficiente en tarjeta de origen';
    END IF;
    
    -- Realizar transferencia
    UPDATE tarjetas_bancarias 
    SET saldo_disponible = saldo_disponible - p_monto 
    WHERE id = p_tarjeta_origen_id;
    
    UPDATE tarjetas_bancarias 
    SET saldo_disponible = saldo_disponible + p_monto 
    WHERE id = p_tarjeta_destino_id;
    
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar inventario
CREATE OR REPLACE FUNCTION incrementar_inventario(
    p_usuario_id UUID,
    p_producto_id UUID,
    p_servidor_id UUID,
    p_cantidad INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE inventario_usuario 
    SET cantidad = cantidad + p_cantidad,
        updated_at = NOW()
    WHERE usuario_id = p_usuario_id 
    AND producto_id = p_producto_id 
    AND servidor_id = p_servidor_id;
END;
$$ LANGUAGE plpgsql;
