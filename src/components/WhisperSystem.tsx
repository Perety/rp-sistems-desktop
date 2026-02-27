'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import supabase from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface WhisperMessage {
    id: string
    emisor_id: string
    receptor_id: string
    mensaje: string
    created_at: string
    leido: boolean
    emisor: {
        username: string
        nombre: string
        rol?: string
    }
}

interface User {
    id: string
    username: string
    nombre: string
    apellidos?: string
    rol: string
}

export default function WhisperSystem() {
    const { currentUser, currentServer } = useAuthStore()
    const [showWhisper, setShowWhisper] = useState(false)
    const [showUserList, setShowUserList] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState<User[]>([])
    const [whispers, setWhispers] = useState<WhisperMessage[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (currentServer) {
            cargarUsuarios()
            cargarWhispers()
            
            // Suscribirse a nuevos susurros
            const channel = supabase
                .channel('whispers')
                .on('postgres_changes', 
                    { 
                        event: 'INSERT', 
                        schema: 'public', 
                        table: 'susurros',
                        filter: `receptor_id=eq.${currentUser?.id}`
                    }, 
                    (payload) => {
                        const nuevoWhisper = payload.new as WhisperMessage
                        setWhispers(prev => [nuevoWhisper, ...prev])
                        setUnreadCount(prev => prev + 1)
                        
                        // Mostrar notificación
                        toast(`🔔 Nuevo susurro de ${nuevoWhisper.emisor?.username || 'Alguien'}`, {
                            icon: '💬',
                            duration: 3000
                        })
                        
                        // Reproducir sonido de notificación
                        playNotificationSound()
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [currentServer, currentUser])

    useEffect(() => {
        scrollToBottom()
    }, [whispers])

    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
        } catch (error) {
            console.error('Error reproduciendo sonido:', error)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const cargarUsuarios = async () => {
        try {
            // Obtener usuarios conectados al servidor
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, username, nombre, apellidos, rol')
                .eq('servidor_id', currentServer)
                .neq('id', currentUser?.id) // Excluir al usuario actual
                .order('username')

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error cargando usuarios:', error)
        }
    }

    const cargarWhispers = async () => {
        try {
            const { data, error } = await supabase
                .from('susurros')
                .select(`
                    *,
                    emisor:usuarios!susurros_emisor_id_fkey(username, nombre, rol)
                `)
                .or(`emisor_id.eq.${currentUser?.id},receptor_id.eq.${currentUser?.id}`)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            
            const mensajes = data || []
            setWhispers(mensajes)
            
            // Contar mensajes no leídos
            const noLeidos = mensajes.filter((w: WhisperMessage) => 
                w.receptor_id === currentUser?.id && !w.leido
            ).length
            setUnreadCount(noLeidos)
            
            // Marcar como leídos los mensajes recibidos
            if (noLeidos > 0) {
                await marcarComoLeidos()
            }
        } catch (error) {
            console.error('Error cargando susurros:', error)
        }
    }

    const marcarComoLeidos = async () => {
        try {
            await supabase
                .from('susurros')
                .update({ leido: true })
                .eq('receptor_id', currentUser?.id)
                .eq('leido', false)
        } catch (error) {
            console.error('Error marcando como leídos:', error)
        }
    }

    const enviarWhisper = async () => {
        if (!selectedUser || !message.trim()) return

        try {
            const { error } = await supabase
                .from('susurros')
                .insert({
                    emisor_id: currentUser?.id,
                    receptor_id: selectedUser.id,
                    mensaje: message.trim(),
                    servidor_id: currentServer
                })

            if (error) throw error

            setMessage('')
            setSelectedUser(null)
            setShowUserList(false)
            
            toast.success(`Susurro enviado a ${selectedUser.username}`)
            
            // Recargar mensajes
            cargarWhispers()
        } catch (error) {
            console.error('Error enviando susurro:', error)
            toast.error('Error al enviar susurro')
        }
    }

    const seleccionarUsuario = (user: User) => {
        setSelectedUser(user)
        setShowUserList(false)
        setMessage('')
    }

    const getRolColor = (rol: string) => {
        switch (rol) {
            case 'admin': return '#EF4444'
            case 'superadmin': return '#7C3AED'
            case 'lspd': return '#3B82F6'
            case 'bcso': return '#F59E0B'
            case 'ems': return '#10B981'
            default: return '#6B7280'
        }
    }

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Botón Principal */}
            <motion.button
                onClick={() => setShowWhisper(!showWhisper)}
                className="relative p-3 rounded-full shadow-2xl transition-all hover:scale-110"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <span className="text-xl">💬</span>
                
                {/* Indicador de mensajes no leídos */}
                {unreadCount > 0 && (
                    <motion.span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Panel de Susurros */}
            <AnimatePresence>
                {showWhisper && (
                    <motion.div
                        className="absolute bottom-full left-0 mb-2 rounded-xl shadow-2xl"
                        style={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)',
                            width: '350px',
                            height: '400px'
                        }}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    >
                        {/* Header */}
                        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm">Susurros 💬</h3>
                                <button
                                    onClick={() => setShowWhisper(false)}
                                    className="p-1 rounded hover:bg-gray-600"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>

                        {/* Lista de Mensajes */}
                        <div className="flex-1 overflow-y-auto p-3" style={{ height: '250px' }}>
                            {whispers.length === 0 ? (
                                <div className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    No hay susurros
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {whispers.map((whisper) => (
                                        <div
                                            key={whisper.id}
                                            className={`p-2 rounded-lg text-sm ${
                                                whisper.emisor_id === currentUser?.id 
                                                    ? 'ml-auto' 
                                                    : 'mr-auto'
                                            }`}
                                            style={{
                                                background: whisper.emisor_id === currentUser?.id 
                                                    ? 'var(--bg-hover)' 
                                                    : 'var(--bg-primary)',
                                                maxWidth: '80%'
                                            }}
                                        >
                                            <div className="font-medium text-xs mb-1" style={{ color: getRolColor(whisper.emisor.rol || 'user') }}>
                                                {whisper.emisor.username}
                                            </div>
                                            <div>{whisper.mensaje}</div>
                                            <div className="text-xs opacity-50 mt-1">
                                                {new Date(whisper.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input de Mensaje */}
                        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            {selectedUser ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">
                                            Para: {selectedUser.username}
                                        </span>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="text-xs hover:text-red-500"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && enviarWhisper()}
                                            placeholder="Escribe tu susurro..."
                                            className="flex-1 px-3 py-2 rounded-lg text-sm"
                                            style={{ 
                                                background: 'var(--bg-hover)', 
                                                border: '1px solid var(--border)'
                                            }}
                                        />
                                        <button
                                            onClick={enviarWhisper}
                                            disabled={!message.trim()}
                                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                            style={{
                                                background: message.trim() ? '#10B981' : '#6B7280',
                                                color: '#fff'
                                            }}
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowUserList(!showUserList)}
                                    className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                    style={{ background: 'var(--bg-hover)' }}
                                >
                                    Seleccionar usuario para susurrar
                                </button>
                            )}
                        </div>

                        {/* Lista de Usuarios */}
                        <AnimatePresence>
                            {showUserList && (
                                <motion.div
                                    className="absolute bottom-full left-0 mb-2 rounded-xl shadow-2xl p-3 max-h-48 overflow-y-auto"
                                    style={{ 
                                        background: 'var(--bg-card)', 
                                        border: '1px solid var(--border)',
                                        width: '100%'
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    <h4 className="font-bold text-sm mb-2">Usuarios Conectados</h4>
                                    <div className="space-y-1">
                                        {users.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => seleccionarUsuario(user)}
                                                className="w-full text-left p-2 rounded hover:bg-gray-700 transition-all"
                                                style={{ background: 'var(--bg-hover)' }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">{user.username}</span>
                                                    <span 
                                                        className="text-xs px-2 py-1 rounded text-white"
                                                        style={{ background: getRolColor(user.rol) }}
                                                    >
                                                        {user.rol}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                        {users.length === 0 && (
                                            <div className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                No hay usuarios conectados
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
