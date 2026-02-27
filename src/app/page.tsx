'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const [mounted, setMounted] = useState(false)
    const [step, setStep] = useState<'server' | 'auth'>('server')
    const [serverCode, setServerCode] = useState('')
    const [serverId, setServerId] = useState('')
    const [serverNameState, setServerNameState] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { setUser, setServer } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleServerCheck = async () => {
        if (!serverCode.trim()) return toast.error('Ingresa el código del servidor')
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('servidores')
                .select('*')
                .eq('codigo', serverCode.trim().toUpperCase())
                .eq('activo', true)
                .single()

            if (error) {
                console.error('Error Supabase:', error)
                toast.error(`Error: ${error.message || 'Servidor no encontrado'}`)
                setLoading(false)
                return
            }
            
            if (!data) {
                toast.error('Servidor no encontrado o inactivo')
                setLoading(false)
                return
            }
            
            setServerId(data.id)
            setServerNameState(data.nombre)
            setStep('auth')
            toast.success(`Servidor: ${data.nombre}`)
        } catch (err) {
            console.error('Error de conexión:', err)
            toast.error('Error de conexión con Supabase')
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) return toast.error('Completa todos los campos')
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('servidor_id', serverId)
                .eq('username', username.trim())
                .eq('password', password.trim())
                .eq('activo', true)
                .single()

            if (error || !data) {
                toast.error('Credenciales incorrectas')
                setLoading(false)
                return
            }

            // Update last access
            await supabase
                .from('usuarios')
                .update({ ultimo_acceso: new Date().toISOString() })
                .eq('id', data.id)

            // Crear cuenta bancaria automática si no existe
            const { data: cuentaExistente } = await supabase
                .from('cuentas_bancarias')
                .select('*')
                .eq('usuario_id', data.id)
                .single()

            if (!cuentaExistente) {
                await supabase
                    .from('cuentas_bancarias')
                    .insert({
                        usuario_id: data.id,
                        servidor_id: serverId,
                        tipo: 'personal',
                        saldo: 1000, // Dinero inicial configurable
                        activa: true
                    })
            }

            setUser(data)
            setServer(serverId, serverNameState)
            document.documentElement.setAttribute('data-theme', 'cyan')
            toast.success(`Bienvenido, ${data.nombre}`)
            router.push('/dashboard')
        } catch {
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
        >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {mounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full opacity-20"
                        style={{
                            background: 'var(--accent)',
                            left: `${(i * 23) % 100}%`,
                            top: `${(i * 37) % 100}%`,
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.1, 0.4, 0.1],
                        }}
                        transition={{
                            duration: 3 + (i % 3),
                            repeat: Infinity,
                            delay: (i % 3),
                        }}
                    />
                ))}
                {/* Glow orbs */}
                <div
                    className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-5"
                    style={{ background: 'var(--accent)' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-5"
                    style={{ background: '#8b5cf6' }}
                />
            </div>

            {/* Login card */}
            <motion.div
                className="relative w-full max-w-md mx-4 rounded-2xl p-8"
                style={{
                    background: 'rgba(21, 27, 35, 0.9)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(20px)',
                }}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent), #0088cc)',
                            boxShadow: '0 0 30px rgba(0,217,255,0.3)',
                        }}
                        animate={{ boxShadow: ['0 0 20px rgba(0,217,255,0.2)', '0 0 40px rgba(0,217,255,0.4)', '0 0 20px rgba(0,217,255,0.2)'] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >
                        <i className="fa-solid fa-shield-halved text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-wider uppercase">SISTEMA RP</h1>
                    <p className="text-[13px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Plataforma de Gestión Multi-Servidor
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-7">
                    {['server', 'auth'].map((s, i) => (
                        <div
                            key={s}
                            className="w-8 h-1 rounded-full transition-all duration-300"
                            style={{
                                background: step === 'auth' || (step === 'server' && i === 0) ? 'var(--accent)' : 'var(--bg-hover)',
                            }}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'server' ? (
                        <motion.div
                            key="server"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-xl font-bold mb-1">Acceder al Servidor</h2>
                            <p className="text-[13px] font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
                                Ingresa el código único de tu servidor RP
                            </p>

                            <div className="mb-4">
                                <label>Código de Servidor</label>
                                <input
                                    type="text"
                                    placeholder="Ej: SRV001"
                                    value={serverCode}
                                    onChange={(e) => setServerCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleServerCheck()}
                                    maxLength={10}
                                />
                            </div>

                            <button
                                onClick={handleServerCheck}
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-[15px] uppercase tracking-wider transition-all disabled:opacity-50 mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent), #0088cc)',
                                    color: '#000',
                                    boxShadow: '0 4px 15px rgba(0,217,255,0.3)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-spinner fa-spin" />
                                        Verificando...
                                    </span>
                                ) : (
                                    'Continuar'
                                )}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => setStep('server')}
                                    className="text-[13px] font-semibold transition-all hover:opacity-70"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <i className="fa-solid fa-arrow-left mr-1" />
                                    Cambiar
                                </button>
                                <span
                                    className="px-2 py-0.5 rounded text-[11px] font-bold uppercase border"
                                    style={{
                                        background: 'rgba(0,217,255,0.08)',
                                        borderColor: 'var(--accent)',
                                        color: 'var(--accent)',
                                    }}
                                >
                                    {serverNameState}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold mb-1 mt-3">Iniciar Sesión</h2>
                            <p className="text-[13px] font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
                                Credenciales proporcionadas por el servidor
                            </p>

                            <div className="mb-4">
                                <label>Usuario</label>
                                <input
                                    type="text"
                                    placeholder="Tu nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="mb-5">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-[15px] uppercase tracking-wider transition-all disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent), #0088cc)',
                                    color: '#000',
                                    boxShadow: '0 4px 15px rgba(0,217,255,0.3)',
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-spinner fa-spin" />
                                        Autenticando...
                                    </span>
                                ) : (
                                    'Entrar al Sistema'
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <p className="text-center text-[11px] font-semibold mt-6" style={{ color: 'var(--text-muted)' }}>
                    Sistema RP © 2026 — All rights reserved
                </p>
            </motion.div>
        </div>
    )
}
