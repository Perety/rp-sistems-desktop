-- ACTUALIZAR VISTA productos_con_imagenes PARA SOPORTAR AMBOS TIPOS DE IMÁGENES

-- 1. Actualizar vista para soportar imagen_url directa e imagen_id
CREATE OR REPLACE VIEW productos_con_imagenes AS
SELECT 
    p.*,
    -- Prioridad: imagen_url directa > imagen_id de tabla imagenes > default
    COALESCE(
        p.imagen_url, -- URL directa guardada en productos
        i.url_original, -- URL de la tabla imagenes
        '/images/default-product.png' -- Default
    ) as imagen_url,
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

-- 2. Verificar que la vista funciona correctamente
SELECT * FROM productos_con_imagenes LIMIT 5;
