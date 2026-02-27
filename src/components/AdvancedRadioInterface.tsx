'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import supabase from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface Radio {
    id: string
    nombre: string
    frecuencia: string
    tipo: string
    max_usuarios: number
    es_emergencia: boolean
    activa: boolean
    servidor_id: string
}

interface RadioUsuario {
    id: string
    radio_id: string
    usuario_id: string
    usuario: {
        username: string
        nombre: string
        apellidos: string
    }
    estado: string
    created_at: string
}

export default function AdvancedRadioInterface() {
    const { currentUser, currentServer } = useAuthStore()
    const [radios, setRadios] = useState<Radio[]>([])
    const [selectedRadio, setSelectedRadio] = useState<Radio | null>(null)
    const [showRadioList, setShowRadioList] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [usuariosEnRadio, setUsuariosEnRadio] = useState<RadioUsuario[]>([])
    const [isTransmitting, setIsTransmitting] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Sonidos de confirmación
    const playJoinSound = () => {
        // Crear sonido de confirmación simple
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
    }

    useEffect(() => {
        cargarRadios()
        
        // Suscribirse a cambios en usuarios de radio
        if (currentServer) {
            const channel = supabase
                .channel('radio-usuarios')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'radio_usuarios',
                        filter: `servidor_id=eq.${currentServer}`
                    }, 
                    (payload) => {
                        if (selectedRadio && payload.new && 'radio_id' in payload.new && payload.new.radio_id === selectedRadio.id) {
                            cargarUsuariosEnRadio(selectedRadio.id)
                            
                            // Reproducir sonido cuando se une un usuario
                            if (payload.eventType === 'INSERT') {
                                playJoinSound()
                            }
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [currentServer, selectedRadio])

    const cargarRadios = async () => {
        try {
            console.log('🔍 Cargando radios...')
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('servidor_id', currentServer)
                .eq('activa', true)
                .order('prioridad', { ascending: false })

            if (error) {
                console.error('❌ Error cargando radios:', error)
                return
            }

            console.log('✅ Radios cargadas:', data)
            setRadios(data || [])
        } catch (error) {
            console.error('💥 Error inesperado:', error)
        }
    }

    const cargarUsuariosEnRadio = async (radioId: string) => {
        try {
            console.log('🔍 Cargando usuarios en radio:', radioId)
            const { data, error } = await supabase
                .from('radio_usuarios')
                .select(`
                    *,
                    usuario:usuarios(username, nombre, apellidos)
                `)
                .eq('radio_id', radioId)
                .eq('estado', 'conectado')
                .order('created_at', { ascending: true })

            if (error) {
                console.error('❌ Error cargando usuarios:', error)
                return
            }

            console.log('✅ Usuarios en radio:', data)
            setUsuariosEnRadio(data || [])
        } catch (error) {
            console.error('💥 Error inesperado:', error)
        }
    }

    const unirseRadio = async (radio: Radio) => {
        try {
            console.log('🔍 Uniéndose a radio:', radio.nombre)
            
            // Verificar si el usuario tiene permiso
            const tienePermiso = await verificarPermisoRadio(radio.id)
            if (!tienePermiso) {
                console.log('❌ No tienes permiso para esta radio')
                return
            }

            // Insertar usuario en radio
            const { error } = await supabase
                .from('radio_usuarios')
                .insert({
                    radio_id: radio.id,
                    usuario_id: currentUser?.id,
                    servidor_id: currentServer,
                    estado: 'conectado'
                })

            if (error) {
                console.error('❌ Error uniéndose a radio:', error)
                return
            }

            setSelectedRadio(radio)
            setIsConnected(true)
            setShowRadioList(false)
            
            // Cargar usuarios en la radio
            await cargarUsuariosEnRadio(radio.id)
            
            // Reproducir sonido de confirmación
            playJoinSound()
            
            console.log('✅ Conectado a radio:', radio.nombre)
        } catch (error) {
            console.error('💥 Error inesperado:', error)
        }
    }

    const salirRadio = async () => {
        if (!selectedRadio) return

        try {
            console.log('🔍 Saliendo de radio:', selectedRadio.nombre)
            
            // Eliminar usuario de radio
            await supabase
                .from('radio_usuarios')
                .delete()
                .eq('radio_id', selectedRadio.id)
                .eq('usuario_id', currentUser?.id)

            setSelectedRadio(null)
            setIsConnected(false)
            setUsuariosEnRadio([])
            
            console.log('✅ Desconectado de radio')
        } catch (error) {
            console.error('💥 Error saliendo de radio:', error)
        }
    }

    const verificarPermisoRadio = async (radioId: string): Promise<boolean> => {
        try {
            // Obtener rol del usuario actual
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('rol_id')
                .eq('id', currentUser?.id)
                .single()

            if (userError || !userData) return false

            // Verificar si el rol tiene permiso para esta radio
            const { data: permisoData, error: permisoError } = await supabase
                .from('radio_permisos')
                .select('puede_unirse')
                .eq('radio_id', radioId)
                .eq('rol_id', userData.rol_id)
                .single()

            // Si no hay permiso específico, verificar si es radio pública
            if (permisoError && permisoError.code === 'PGRST116') {
                const { data: radioData } = await supabase
                    .from('radios')
                    .select('tipo')
                    .eq('id', radioId)
                    .single()

                return radioData?.tipo === 'publica'
            }

            return permisoData?.puede_unirse || false
        } catch (error) {
            console.error('Error verificando permiso:', error)
            return false
        }
    }

    const iniciarTransmision = () => {
        if (!selectedRadio) return
        
        console.log('🎤 Iniciando transmisión en:', selectedRadio.nombre)
        setIsTransmitiendo(true)
        
        // Actualizar estado en base de datos
        supabase
            .from('radio_usuarios')
            .update({ estado: 'hablando' })
            .eq('radio_id', selectedRadio.id)
            .eq('usuario_id', currentUser?.id)
    }

    const finalizarTransmision = () => {
        if (!selectedRadio) return
        
        console.log('🔇 Finalizando transmisión')
        setIsTransmitiendo(false)
        
        // Actualizar estado en base de datos
        supabase
            .from('radio_usuarios')
            .update({ estado: 'conectado' })
            .eq('radio_id', selectedRadio.id)
            .eq('usuario_id', currentUser?.id)
    }

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'publica': return '#10B981'
            case 'privada': return '#F59E0B'
            case 'emergencia': return '#EF4444'
            default: return '#6B7280'
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Audio element para sonidos */}
            <audio ref={audioRef} preload="auto" />
            
            {/* Interfaz Principal */}
            <motion.div
                className="rounded-xl shadow-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ 
                            background: selectedRadio ? getTipoColor(selectedRadio.tipo) : '#6B7280',
                            boxShadow: isTransmitting ? `0 0 20px ${getTipoColor(selectedRadio?.tipo || '#6B7280')}` : 'none'
                        }} />
                        <div>
                            <div className="font-bold text-sm">
                                {selectedRadio ? selectedRadio.nombre : 'Sin Conexión'}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {selectedRadio ? selectedRadio.frecuencia : 'Selecciona una radio'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowRadioList(!showRadioList)}
                            className="p-2 rounded-lg transition-all"
                            style={{ background: 'var(--bg-hover)' }}
                        >
                            📻
                        </button>
                        {selectedRadio && (
                            <button
                                onClick={salirRadio}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: '#EF4444', color: '#fff' }}
                            >
                            ❌
                        </button>
                    )}
                    </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-3">
                    <button
                        onMouseDown={iniciarTransmision}
                        onMouseUp={finalizarTransmision}
                        onTouchStart={iniciarTransmision}
                        onTouchEnd={finalizarTransmision}
                        disabled={!selectedRadio}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                            isTransmitting ? 'scale-105' : 'scale-100'
                        }`}
                        style={{
                            background: isTransmitting ? '#EF4444' : selectedRadio ? '#10B981' : '#6B7280',
                            color: '#fff',
                            boxShadow: isTransmitting ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                        }}
                    >
                        <i className="fa-solid fa-microphone mr-2" />
                        {isTransmitting ? 'TRANSMITIENDO' : 'PTT'}
                    </button>
                </div>

                {/* Usuarios en Radio */}
                {selectedRadio && usuariosEnRadio.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Usuarios en Radio ({usuariosEnRadio.length})
                        </div>
                        <div className="space-y-1">
                            {usuariosEnRadio.slice(0, 3).map((usuario) => (
                                <div key={usuario.id} className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${
                                        usuario.estado === 'hablando' ? 'bg-red-500' : 'bg-green-500'
                                    }`} />
                                    <span>{usuario.usuario?.username || 'Usuario'}</span>
                                    {usuario.estado === 'hablando' && (
                                        <span className="text-red-500">🎤</span>
                                    )}
                                </div>
                            ))}
                            {usuariosEnRadio.length > 3 && (
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    +{usuariosEnRadio.length - 3} más
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estado */}
                <div className="mt-3 text-center">
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {isConnected ? `🟢 Conectado (${usuariosEnRadio.length} usuarios)` : '🔴 Desconectado'}
                    </div>
                </div>
            </motion.div>

            {/* Lista de Radios */}
            {showRadioList && (
                <motion.div
                    className="absolute bottom-full right-0 mb-2 rounded-xl p-4 w-80 shadow-2xl max-h-96 overflow-y-auto"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="font-bold text-sm mb-4">Radios Disponibles</h3>
                    
                    <div className="space-y-2">
                        {radios.map((radio) => (
                            <button
                                key={radio.id}
                                onClick={() => unirseRadio(radio)}
                                disabled={selectedRadio?.id === radio.id}
                                className={`w-full text-left p-3 rounded-lg transition-all ${
                                    selectedRadio?.id === radio.id ? 'opacity-50' : 'hover:scale-105'
                                }`}
                                style={{ background: 'var(--bg-hover)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{radio.nombre}</div>
                                        <div className="text-xs opacity-75">{radio.frecuencia}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="text-xs px-2 py-1 rounded"
                                            style={{ 
                                                background: getTipoColor(radio.tipo),
                                                color: '#fff'
                                            }}
                                        >
                                            {radio.tipo}
                                        </span>
                                        {radio.es_emergencia && (
                                            <span>🚨</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                        
                        {radios.length === 0 && (
                            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                No hay radios disponibles
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
