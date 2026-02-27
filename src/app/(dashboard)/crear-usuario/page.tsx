'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import HybridImageUpload from '@/components/HybridImageUpload'
import '@/styles/image-styles.css'

// Función para generar DNI único
const generarDNI = (): string => {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'
    const numeros = Math.floor(Math.random() * 90000000) + 10000000
    const letra = letras[numeros % 23]
    return `${numeros}${letra}`
}

interface UsuarioForm {
    username: string
    email: string
    password: string
    nombre: string
    apellido: string
    rol: string
    activo: boolean
    imagen_perfil_url: string
    imagen_perfil_id: string
}

export default function CrearUsuarioPage() {
    const { currentServer } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    
    const [formData, setFormData] = useState<UsuarioForm>({
        username: '',
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        rol: 'ciudadano',
        activo: true,
        imagen_perfil_url: '',
        imagen_perfil_id: ''
    })

    const roles = [
        { value: 'ciudadano', label: 'Ciudadano' },
        { value: 'policia', label: 'Policía' },
        { value: 'medico', label: 'Médico' },
        { value: 'mecanico', label: 'Mecánico' },
        { value: 'admin', label: 'Administrador' },
        { value: 'superadmin', label: 'Super Admin' }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validar que el username no exista
            const { data: existingUser } = await supabase
                .from('usuarios')
                .select('id')
                .eq('username', formData.username.trim())
                .single()

            if (existingUser) {
                toast.error('El nombre de usuario ya existe')
                setLoading(false)
                return
            }

            // Validar que el email no exista
            const { data: existingEmail } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', formData.email.trim())
                .single()

            if (existingEmail) {
                toast.error('El email ya está registrado')
                setLoading(false)
                return
            }

            // Crear usuario en Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    data: {
                        username: formData.username.trim(),
                        nombre: formData.nombre.trim(),
                        apellido: formData.apellido.trim(),
                        rol: formData.rol
                    }
                }
            })

            if (authError) {
                toast.error('Error al crear usuario: ' + authError.message)
                setLoading(false)
                return
            }

            // Crear registro en la base de datos
            const { error: dbError } = await supabase
                .from('usuarios')
                .insert({
                    id: authData.user?.id,
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido.trim(),
                    rol: formData.rol,
                    activo: formData.activo,
                    imagen_perfil_id: formData.imagen_perfil_id || null,
                    servidor_id: currentServer
                })

            if (dbError) {
                toast.error('Error al guardar usuario: ' + dbError.message)
                setLoading(false)
                return
            }

            // Crear cuenta bancaria automáticamente
            const { error: cuentaError } = await supabase
                .from('cuentas_bancarias')
                .insert({
                    usuario_id: authData.user?.id,
                    tipo: 'personal',
                    dinero_banco: 1000,
                    activa: true,
                    servidor_id: currentServer
                })

            if (cuentaError) {
                console.error('Error al crear cuenta bancaria:', cuentaError)
            }

            // 🎯 REGISTRAR AUTOMÁTICAMENTE COMO CIUDADANO
            const nombreCompleto = `${formData.nombre.trim()} ${formData.apellido.trim()}`
            const dniGenerado = generarDNI() // Función para generar DNI único
            
            const { error: ciudadanoError } = await supabase
                .from('ciudadanos')
                .insert({
                    nombre: nombreCompleto,
                    dni: dniGenerado,
                    telefono: '',
                    direccion: '',
                    notas: `Usuario del sistema: ${formData.username}`,
                    servidor_id: currentServer,
                    oficial_registro: 'Sistema Automático',
                    usuario_id: authData.user?.id // Referencia al usuario
                })

            if (ciudadanoError) {
                console.error('Error al registrar ciudadano automáticamente:', ciudadanoError)
            } else {
                console.log('Ciudadano registrado automáticamente con DNI:', dniGenerado)
            }

            toast.success('Usuario creado exitosamente')
            
            // Resetear formulario
            setFormData({
                username: '',
                email: '',
                password: '',
                nombre: '',
                apellido: '',
                rol: 'ciudadano',
                activo: true,
                imagen_perfil_url: '',
                imagen_perfil_id: ''
            })

        } catch (error) {
            console.error('Error creando usuario:', error)
            toast.error('Error al crear usuario')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (imageUrl: string, imageId: string) => {
        setFormData({
            ...formData,
            imagen_perfil_url: imageUrl,
            imagen_perfil_id: imageId
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Crear Nuevo Usuario</h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Registra un nuevo usuario en el sistema
                </p>
            </motion.div>

            {/* Formulario */}
            <motion.div
                className="rounded-xl p-8"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Foto de perfil */}
                    <div className="flex justify-center">
                        <HybridImageUpload
                            onImageUpload={handleImageUpload}
                            currentImage={formData.imagen_perfil_url}
                            username={formData.username}
                            label="Foto de perfil"
                            placeholder="https://ejemplo.com/perfil.jpg"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                placeholder="Juan"
                                required
                            />
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Apellido *</label>
                            <input
                                type="text"
                                value={formData.apellido}
                                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                placeholder="Pérez"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Nombre de Usuario *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                placeholder="juanperez123"
                                required
                            />
                            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                Sin espacios, min 3 caracteres
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                placeholder="juan@ejemplo.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Contraseña *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm pr-10"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="•••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                Mínimo 6 caracteres
                            </div>
                        </div>

                        {/* Rol */}
                        <div>
                            <label className="block text-[12px] font-medium mb-1">Rol *</label>
                            <select
                                value={formData.rol}
                                onChange={(e) => setFormData({...formData, rol: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                required
                            >
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.activo}
                            onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                            className="mr-2"
                        />
                        <label className="text-sm">Usuario activo</label>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-lg text-sm font-medium transition-all"
                            style={{ 
                                background: loading ? 'var(--bg-hover)' : 'var(--accent)', 
                                color: loading ? 'var(--text-muted)' : '#fff',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Creando usuario...
                                </div>
                            ) : (
                                'Crear Usuario'
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setFormData({
                                username: '',
                                email: '',
                                password: '',
                                nombre: '',
                                apellido: '',
                                rol: 'ciudadano',
                                activo: true,
                                imagen_perfil_url: '',
                                imagen_perfil_id: ''
                            })}
                            className="flex-1 py-3 rounded-lg text-sm font-medium"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                        >
                            Limpiar
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Información adicional */}
            <motion.div
                className="mt-6 p-4 rounded-lg"
                style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid var(--accent)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--accent)' }}>
                    <i className="fa-solid fa-info-circle mr-2" />
                    Información importante
                </h3>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <li>• Se creará automáticamente una cuenta bancaria con $1000</li>
                    <li>• La foto de perfil debe ser PNG con fondo transparente para mejor resultado</li>
                    <li>• El username no podrá ser cambiado después</li>
                    <li>• Los roles administrativos tienen permisos especiales</li>
                </ul>
            </motion.div>
        </div>
    )
}
