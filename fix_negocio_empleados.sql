-- FIX: Verificar y crear tabla negocio_empleados si no existe
CREATE TABLE IF NOT EXISTS negocio_empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL,
    personaje_id TEXT NOT NULL,
    rol_negocio TEXT NOT NULL DEFAULT 'empleado',
    salario INTEGER DEFAULT 1500,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- Verificar estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'negocio_empleados' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_negocio_empleados_negocio_id ON negocio_empleados(negocio_id);
CREATE INDEX IF NOT EXISTS idx_negocio_empleados_personaje_id ON negocio_empleados(personaje_id);

-- Verificar si hay negocios existentes
SELECT COUNT(*) as total_negocios FROM negocios;
