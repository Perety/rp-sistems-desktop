-- SISTEMA DE TRANSFERENCIA DE INVENTARIO ENTRE USUARIOS (CORREGIDO)

-- 1. Crear tabla de transferencias de inventario
CREATE TABLE IF NOT EXISTS transferencias_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_origen_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_destino_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    concepto TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    respondida_at TIMESTAMPTZ,
    respondida_por UUID REFERENCES usuarios(id)
);

-- 2. Función para transferir items de inventario (CORREGIDA)
CREATE OR REPLACE FUNCTION transferir_item_inventario(
    p_usuario_destino_id UUID,
    p_producto_id UUID,
    p_cantidad INTEGER,
    p_concepto TEXT DEFAULT NULL,
    p_servidor_id UUID,
    p_usuario_origen_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Si no se especifica usuario origen, usar el usuario actual de la sesión
    -- (esto se manejará en el frontend)
    
    -- Verificar que el usuario origen tenga suficientes items
    IF (SELECT COALESCE(cantidad, 0) FROM inventario_usuario 
        WHERE usuario_id = p_usuario_origen_id 
        AND producto_id = p_producto_id 
        AND servidor_id = p_servidor_id) < p_cantidad THEN
        RAISE EXCEPTION 'No tienes suficientes items para transferir';
    END IF;
    
    -- Crear solicitud de transferencia
    INSERT INTO transferencias_inventario (
        usuario_origen_id,
        usuario_destino_id,
        producto_id,
        cantidad,
        concepto,
        servidor_id
    ) VALUES (
        p_usuario_origen_id,
        p_usuario_destino_id,
        p_producto_id,
        p_cantidad,
        p_concepto,
        p_servidor_id
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Función para aceptar transferencia (CORREGIDA)
CREATE OR REPLACE FUNCTION aceptar_transferencia_inventario(
    p_transferencia_id UUID,
    p_usuario_responde_id UUID
)
RETURNS void AS $$
DECLARE
    v_transferencia RECORD;
BEGIN
    -- Obtener datos de la transferencia
    SELECT * INTO v_transferencia 
    FROM transferencias_inventario 
    WHERE id = p_transferencia_id;
    
    -- Verificar que la transferencia exista y esté pendiente
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transferencia no encontrada';
    END IF;
    
    IF v_transferencia.estado != 'pendiente' THEN
        RAISE EXCEPTION 'Esta transferencia ya fue procesada';
    END IF;
    
    -- Verificar que el usuario destino sea quien responde
    IF v_transferencia.usuario_destino_id != p_usuario_responde_id THEN
        RAISE EXCEPTION 'No puedes aceptar esta transferencia';
    END IF;
    
    -- Descontar items del usuario origen
    UPDATE inventario_usuario 
    SET cantidad = cantidad - v_transferencia.cantidad
    WHERE usuario_id = v_transferencia.usuario_origen_id 
    AND producto_id = v_transferencia.producto_id 
    AND servidor_id = v_transferencia.servidor_id;
    
    -- Eliminar registro si cantidad es 0
    DELETE FROM inventario_usuario 
    WHERE usuario_id = v_transferencia.usuario_origen_id 
    AND producto_id = v_transferencia.producto_id 
    AND servidor_id = v_transferencia.servidor_id 
    AND cantidad <= 0;
    
    -- Añadir items al usuario destino
    INSERT INTO inventario_usuario (
        usuario_id,
        producto_id,
        cantidad,
        servidor_id
    ) VALUES (
        v_transferencia.usuario_destino_id,
        v_transferencia.producto_id,
        v_transferencia.cantidad,
        v_transferencia.servidor_id
    )
    ON CONFLICT (usuario_id, producto_id, servidor_id) 
    DO UPDATE SET 
        cantidad = inventario_usuario.cantidad + v_transferencia.cantidad,
        updated_at = NOW();
    
    -- Actualizar estado de la transferencia
    UPDATE transferencias_inventario 
    SET estado = 'aceptada',
        respondida_at = NOW(),
        respondida_por = p_usuario_responde_id
    WHERE id = p_transferencia_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para rechazar transferencia (CORREGIDA)
CREATE OR REPLACE FUNCTION rechazar_transferencia_inventario(
    p_transferencia_id UUID,
    p_usuario_responde_id UUID
)
RETURNS void AS $$
BEGIN
    -- Verificar que la transferencia exista y esté pendiente
    IF NOT EXISTS (SELECT 1 FROM transferencias_inventario 
        WHERE id = p_transferencia_id 
        AND estado = 'pendiente') THEN
        RAISE EXCEPTION 'Transferencia no encontrada o ya procesada';
    END IF;
    
    -- Verificar que el usuario destino sea quien responde
    UPDATE transferencias_inventario 
    SET estado = 'rechazada',
        respondida_at = NOW(),
        respondida_por = p_usuario_responde_id
    WHERE id = p_transferencia_id 
    AND usuario_destino_id = p_usuario_responde_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS idx_transferencias_inventario_origen ON transferencias_inventario(usuario_origen_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_inventario_destino ON transferencias_inventario(usuario_destino_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_inventario_estado ON transferencias_inventario(estado);
CREATE INDEX IF NOT EXISTS idx_transferencias_inventario_servidor ON transferencias_inventario(servidor_id);
