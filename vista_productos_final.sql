-- VISTA productos_con_imagenes CORREGIDA (SIN DUPLICADOS)

-- 1. Eliminar vista existente
DROP VIEW IF EXISTS productos_con_imagenes;

-- 2. Crear nueva vista con las columnas existentes
CREATE VIEW productos_con_imagenes AS
SELECT 
    p.*,
    -- No crear imagen_url duplicada, usar la existente
    -- Agregar información adicional sobre el tipo de imagen
    COALESCE(i.ancho, 300) as imagen_ancho,
    COALESCE(i.alto, 300) as imagen_alto,
    i.tipo_contenido as imagen_tipo,
    CASE 
        WHEN p.imagen_url IS NOT NULL THEN 'url_directa'
        WHEN p.imagen_id IS NOT NULL THEN 'archivo_subido'
        ELSE 'sin_imagen'
    END as imagen_tipo_fuente
FROM productos p
LEFT JOIN imagenes i ON p.imagen_id = i.id
WHERE p.activo = true;

-- 3. Verificar que la vista funciona correctamente
SELECT * FROM productos_con_imagenes LIMIT 5;
