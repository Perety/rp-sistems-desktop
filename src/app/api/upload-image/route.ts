import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const category = formData.get('category') as string || 'general'

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 5MB)' }, { status: 400 })
        }

        // Generar nombre único
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${uuidv4()}.${fileExtension}`

        // Crear directorio si no existe
        const uploadDir = join(process.cwd(), 'public', 'uploads', category)
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error) {
            // El directorio ya existe, está bien
        }

        // Guardar archivo
        const filePath = join(uploadDir, uniqueFileName)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Generar URL pública
        const publicUrl = `/uploads/${category}/${uniqueFileName}`

        // Guardar en base de datos (opcional - ya lo hace el frontend)
        // Aquí podrías insertar en la tabla imágenes si lo necesitas

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: uniqueFileName,
            size: file.size,
            type: file.type
        })

    } catch (error) {
        console.error('Error al subir imagen:', error)
        return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
    }
}
