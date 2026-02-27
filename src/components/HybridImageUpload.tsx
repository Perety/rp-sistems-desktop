'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface HybridImageUploadProps {
    onImageUpload: (imageUrl: string, imageId: string) => void
    currentImage?: string
    maxSize?: number // en MB
    className?: string
    disabled?: boolean
    username?: string
    label?: string
    placeholder?: string
}

export default function HybridImageUpload({ 
    onImageUpload, 
    currentImage, 
    maxSize = 5,
    className = '',
    disabled = false,
    username,
    label = 'Imagen',
    placeholder = 'https://ejemplo.com/imagen.jpg'
}: HybridImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'upload' | 'url'>('upload')
    const [imageUrl, setImageUrl] = useState('')
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
            formData.append('category', 'general')

            // Subir imagen
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Error al subir imagen')
            }

            const data = await response.json()
            
            // Llamar al callback con la URL
            onImageUpload(data.url, data.fileName)
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

    const handleUrlSubmit = () => {
        if (!imageUrl.trim()) {
            toast.error('Por favor ingresa una URL válida')
            return
        }

        // Validar URL básica
        try {
            new URL(imageUrl)
            
            // Generar ID único para URL
            const urlId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            onImageUpload(imageUrl.trim(), urlId)
            toast.success('URL de imagen actualizada')
            setImageUrl('')
            
        } catch (error) {
            toast.error('Por favor ingresa una URL válida')
        }
    }

    const handleRemoveImage = () => {
        onImageUpload('', '')
        setImageUrl('')
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Selector de modo */}
            <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                <button
                    onClick={() => setMode('upload')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        mode === 'upload' 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                    disabled={disabled}
                >
                    <i className="fa-solid fa-upload mr-2" />
                    Subir Archivo
                </button>
                <button
                    onClick={() => setMode('url')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        mode === 'url' 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                    disabled={disabled}
                >
                    <i className="fa-solid fa-link mr-2" />
                    URL Directa
                </button>
            </div>

            {/* Modo Subida de Archivo */}
            {mode === 'upload' && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        disabled={disabled || uploading}
                        className="hidden"
                    />

                    {/* Contenedor principal */}
                    <div className="relative group">
                        {/* Imagen actual */}
                        <div 
                            className={`relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 transition-all duration-300 ${
                                dragActive ? 'border-blue-500 scale-105' : 'border-gray-300'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{ 
                                borderColor: dragActive ? 'var(--accent)' : 'var(--border)',
                                background: 'var(--bg-hover)'
                            }}
                            onClick={onButtonClick}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={`${label} de ${username || 'usuario'}`}
                                    className="w-full h-full object-cover"
                                    style={{ 
                                        background: 'transparent',
                                        imageRendering: 'crisp-edges',
                                        mixBlendMode: 'normal'
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                                    <i className="fa-solid fa-user text-4xl text-white" />
                                </div>
                            )}
                            
                            {/* Overlay de carga */}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            
                            {/* Overlay para cambiar imagen */}
                            {!disabled && !uploading && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <i className="fa-solid fa-camera text-2xl mb-1" />
                                        <p className="text-xs">Cambiar {label.toLowerCase()}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Indicador de arrastrar */}
                        {dragActive && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full rounded-full border-4 border-dashed border-blue-500 flex items-center justify-center bg-blue-500/10">
                                    <div className="text-blue-500 text-center">
                                        <i className="fa-solid fa-cloud-upload-alt text-2xl mb-1" />
                                        <p className="text-xs font-medium">Suelta la imagen</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botón eliminar */}
                    {currentImage && !disabled && (
                        <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            title={`Eliminar ${label.toLowerCase()}`}
                        >
                            <i className="fa-solid fa-times text-xs" />
                        </button>
                    )}
                </div>
            )}

            {/* Modo URL Directa */}
            {mode === 'url' && (
                <div className="space-y-3">
                    {/* Vista previa de la imagen actual */}
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div 
                                className="w-32 h-32 rounded-full overflow-hidden border-4"
                                style={{ 
                                    borderColor: 'var(--border)',
                                    background: 'var(--bg-hover)'
                                }}
                            >
                                {currentImage ? (
                                    <img
                                        src={currentImage}
                                        alt={`${label} de ${username || 'usuario'}`}
                                        className="w-full h-full object-cover"
                                        style={{ 
                                            background: 'transparent',
                                            imageRendering: 'crisp-edges'
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                                        <i className="fa-solid fa-user text-4xl text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Botón eliminar */}
                            {currentImage && !disabled && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    title={`Eliminar ${label.toLowerCase()}`}
                                >
                                    <i className="fa-solid fa-times text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Input de URL */}
                    <div className="space-y-2">
                        <label className="block text-[12px] font-medium">URL de la Imagen</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder={placeholder}
                                disabled={disabled}
                                className="flex-1 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            />
                            <button
                                onClick={handleUrlSubmit}
                                disabled={disabled || !imageUrl.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                                style={{ 
                                    background: 'var(--accent)', 
                                    color: '#fff',
                                    opacity: (disabled || !imageUrl.trim()) ? 0.5 : 1,
                                    cursor: (disabled || !imageUrl.trim()) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <i className="fa-solid fa-check mr-2" />
                                Usar URL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Información */}
            <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {mode === 'upload' 
                        ? (disabled ? 'Imagen no disponible' : 'Haz clic o arrastra una imagen')
                        : 'Ingresa la URL directa de la imagen'
                    }
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {mode === 'upload' 
                        ? `PNG, JPG, GIF hasta ${maxSize}MB`
                        : 'URLs de imágenes (jpg, png, gif, webp)'
                    }
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Recomendado: 200x200px, PNG con fondo transparente
                </p>
            </div>
        </div>
    )
}
