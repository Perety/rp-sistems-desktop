'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface ImageUploadProps {
    onImageUpload: (imageUrl: string, imageId: string) => void
    currentImage?: string
    category?: 'perfil' | 'producto' | 'item' | 'general'
    maxSize?: number // en MB
    className?: string
    disabled?: boolean
}

export default function ImageUpload({ 
    onImageUpload, 
    currentImage, 
    category = 'general',
    maxSize = 5,
    className = '',
    disabled = false
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = async (file: File) => {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen')
            return
        }

        // Validar tamaño
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`La imagen no puede superar ${maxSize}MB`)
            return
        }

        setUploading(true)

        try {
            // Crear FormData para subir al servidor
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', category)

            // Simular subida (reemplazar con tu endpoint real)
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Error al subir imagen')
            }

            const data = await response.json()
            
            // Llamar al callback con la URL y ID de la imagen
            onImageUpload(data.url, data.id)
            toast.success('Imagen subida exitosamente')

        } catch (error) {
            console.error('Error subiendo imagen:', error)
            toast.error('Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (disabled || uploading) return

        const files = e.dataTransfer.files
        if (files && files[0]) {
            handleFile(files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || uploading) return

        const files = e.target.files
        if (files && files[0]) {
            handleFile(files[0])
        }
    }

    const onButtonClick = () => {
        if (disabled || uploading) return
        fileInputRef.current?.click()
    }

    return (
        <div className={`relative ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                disabled={disabled || uploading}
                className="hidden"
            />

            {/* Imagen actual */}
            {currentImage && (
                <div className="relative group">
                    <img
                        src={currentImage}
                        alt="Imagen actual"
                        className="w-full h-full object-cover rounded-lg"
                        style={{ 
                            background: 'transparent',
                            border: '2px solid var(--border)'
                        }}
                    />
                    
                    {/* Overlay para cambiar imagen */}
                    <div 
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={onButtonClick}
                    >
                        <div className="text-white text-center">
                            <i className="fa-solid fa-camera text-2xl mb-2" />
                            <p className="text-sm">Cambiar imagen</p>
                        </div>
                    </div>

                    {/* Botón eliminar */}
                    {!disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onImageUpload('', '')
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <i className="fa-solid fa-times text-sm" />
                        </button>
                    )}
                </div>
            )}

            {/* Área de subida */}
            {!currentImage && (
                <motion.div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                        dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                >
                    {uploading ? (
                        <div className="space-y-4">
                            <div className="w-12 h-12 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-600">Subiendo imagen...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-cloud-upload-alt text-2xl text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    {disabled ? 'Imagen no disponible' : 'Haz clic o arrastra una imagen'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF hasta {maxSize}MB
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}
