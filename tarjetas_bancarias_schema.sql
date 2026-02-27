-- SISTEMA DE TARJETAS BANCARIAS

-- Tabla de tarjetas bancarias
CREATE TABLE IF NOT EXISTS tarjetas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    nombre_tarjeta TEXT NOT NULL,  -- Ej: "Visa Platinum", "Mastercard Gold"
    numero_tarjeta TEXT NOT NULL UNIQUE,  -- Número de tarjeta único
    pin TEXT NOT NULL,  -- PIN de 4 dígitos
    limite_credito INTEGER DEFAULT 5000,  -- Límite de crédito individual
    saldo_disponible NUMERIC DEFAULT 0,  -- Saldo disponible en la tarjeta
    activa BOOLEAN DEFAULT true,
    tipo_tarjeta TEXT DEFAULT 'debito',  -- 'debito' o 'credito'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones entre tarjetas
CREATE TABLE IF NOT EXISTS transacciones_tarjetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarjeta_origen_id UUID NOT NULL REFERENCES tarjetas_bancarias(id) ON DELETE CASCADE,
    tarjeta_destino_id UUID NOT NULL REFERENCES tarjetas_bancarias(id) ON DELETE CASCADE,
    monto NUMERIC NOT NULL,
    concepto TEXT,
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tarjetas_usuario_id ON tarjetas_bancarias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_cuenta_bancaria_id ON tarjetas_bancarias(cuenta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_numero ON tarjetas_bancarias(numero_tarjeta);
CREATE INDEX IF NOT EXISTS idx_transacciones_tarjeta_origen ON transacciones_tarjetas(tarjeta_origen_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tarjeta_destino ON transacciones_tarjetas(tarjeta_destino_id);

-- Insertar tarjetas de ejemplo para el usuario admin
INSERT INTO tarjetas_bancarias (usuario_id, cuenta_bancaria_id, nombre_tarjeta, numero_tarjeta, pin, limite_credito, saldo_disponible, tipo_tarjeta)
SELECT 
    u.id as usuario_id,
    cb.id as cuenta_bancaria_id,
    'Visa Platinum' as nombre_tarjeta,
    '4532-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-XXXX' as numero_tarjeta,
    '1234' as pin,
    10000 as limite_credito,
    5000 as saldo_disponible,
    'credito' as tipo_tarjeta
FROM usuarios u 
JOIN cuentas_bancarias cb ON cb.usuario_id = u.id 
WHERE u.id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
LIMIT 1;

INSERT INTO tarjetas_bancarias (usuario_id, cuenta_bancaria_id, nombre_tarjeta, numero_tarjeta, pin, limite_credito, saldo_disponible, tipo_tarjeta)
SELECT 
    u.id as usuario_id,
    cb.id as cuenta_bancaria_id,
    'Mastercard Oro' as nombre_tarjeta,
    '5521-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-XXXX' as numero_tarjeta,
    '5678' as pin,
    7500 as limite_credito,
    3000 as saldo_disponible,
    'debito' as tipo_tarjeta
FROM usuarios u 
JOIN cuentas_bancarias cb ON cb.usuario_id = u.id 
WHERE u.id = '4fb9fc1a-616c-4756-a0c0-ada4f6d3baf6'
LIMIT 1;
