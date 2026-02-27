-- VERIFICAR COLUMNAS ACTUALES EN TABLA PRODUCTOS

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
