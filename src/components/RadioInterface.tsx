'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRadioStore } from '@/store/radioStore'
import { WebRTCManager } from '@/lib/webRTCManager'
import { DEFAULT_WEBRTC_CONFIG, PTT_KEYS, AUDIO_QUALITIES } from '@/types/radios'
import type { Radio, RadioUsuario } from '@/types/radios'

export default function RadioInterface() {
    const {
        radioActual,
        isTransmitiendo,
        isMuted,
        volumenGeneral,
        teclaPTT,
        radiosDisponibles,
        usuariosEnRadio,
        usuariosTransmitiendo,
        audioConfig,
        cargarRadios,
        unirseRadio,
        salirRadio,
        iniciarTransmision,
        finalizarTransmision,
        actualizarAudioConfig,
        setVolumenGeneral,
        setMuted
    } = useRadioStore()

    const [showSettings, setShowSettings] = useState(false)
    const [showRadioList, setShowRadioList] = useState(false)
    const [isPTTPressed, setIsPTTPressed] = useState(false)
    const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null)
    const [voiceLevel, setVoiceLevel] = useState(0)
    const animationRef = useRef<number>()

    // Inicializar WebRTC
    useEffect(() => {
        const initWebRTC = async () => {
            try {
                const manager = new WebRTCManager('current-user', DEFAULT_WEBRTC_CONFIG)
                const stream = await manager.initializeAudio()
                
                // Conectar a servidor de señalización
                manager.connectToSignalingServer('ws://localhost:8080')
                
                setWebRTCManager(manager)
                
                // Configurar detección de voz
                const detectVoice = () => {
                    const level = manager.getVoiceLevel()
                    setVoiceLevel(level)
                    animationRef.current = requestAnimationFrame(detectVoice)
                }
                detectVoice()
                
            } catch (error) {
                console.error('Error inicializando WebRTC:', error)
            }
        }

        initWebRTC()
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            webRTCManager?.cleanup()
        }
    }, [])

    // Cargar radios disponibles
    useEffect(() => {
        cargarRadios()
    }, [cargarRadios])

    // Manejar tecla PTT
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === teclaPTT && !isPTTPressed) {
                e.preventDefault()
                setIsPTTPressed(true)
                if (!isMuted) {
                    iniciarTransmision()
                }
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === teclaPTT && isPTTPressed) {
                e.preventDefault()
                setIsPTTPressed(false)
                finalizarTransmision()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [teclaPTT, isPTTPressed, isMuted, iniciarTransmision, finalizarTransmision])

    const handleJoinRadio = async (radio: Radio) => {
        try {
            await unirseRadio(radio.id)
            setShowRadioList(false)
        } catch (error) {
            console.error('Error uniéndose a la radio:', error)
        }
    }

    const handleLeaveRadio = async () => {
        try {
            await salirRadio()
        } catch (error) {
            console.error('Error saliendo de la radio:', error)
        }
    }

    const handleVolumeChange = (value: number) => {
        setVolumenGeneral(value)
        actualizarAudioConfig({ volumen_general: value })
    }

    const handlePTTKeyChange = (key: string) => {
        actualizarAudioConfig({ tecla_ptt: key })
    }

    const getVoiceColor = (level: number) => {
        if (level < 0.1) return '#10B981' // Verde - silencio
        if (level < 0.3) return '#F59E0B' // Amarillo - voz baja
        if (level < 0.6) return '#3B82F6' // Azul - voz normal
        return '#EF4444' // Rojo - voz alta
    }

    const getRadioTypeColor = (tipo: string) => {
        switch (tipo) {
            case 'publica': return '#10B981'
            case 'privada': return '#F59E0B'
            case 'emergencia': return '#EF4444'
            default: return '#6B7280'
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Interfaz Principal */}
            <motion.div
                className="rounded-xl shadow-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
            >
                {/* Header */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ 
                                background: radioActual ? getRadioTypeColor(radioActual.tipo) : '#6B7280',
                                boxShadow: isTransmitiendo ? `0 0 20px ${getRadioTypeColor(radioActual?.tipo || '#6B7280')}` : 'none'
                            }} />
                            <div>
                                <div className="font-bold text-sm">
                                    {radioActual ? radioActual.nombre : 'Sin Conexión'}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {radioActual ? radioActual.frecuencia : 'Selecciona una radio'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: 'var(--bg-hover)' }}
                            >
                                <i className="fa-solid fa-cog" />
                            </button>
                            <button
                                onClick={() => setShowRadioList(!showRadioList)}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: 'var(--bg-hover)' }}
                            >
                                <i className="fa-solid fa-radio" />
                            </button>
                            {radioActual && (
                                <button
                                    onClick={handleLeaveRadio}
                                    className="p-2 rounded-lg transition-all"
                                    style={{ background: '#EF4444', color: '#fff' }}
                                >
                                    <i className="fa-solid fa-power-off" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indicador de Voz */}
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                Nivel de Voz
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: getVoiceColor(voiceLevel) }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${voiceLevel * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                PTT
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isPTTPressed ? 'scale-110' : 'scale-100'
                            }`}
                            style={{
                                background: isPTTPressed ? '#EF4444' : 'var(--bg-hover)',
                                boxShadow: isPTTPressed ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                            }}>
                                <i className="fa-solid fa-microphone" style={{ color: isPTTPressed ? '#fff' : 'var(--text-primary)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usuarios en Radio */}
                {radioActual && usuariosEnRadio.length > 0 && (
                    <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Usuarios en Radio ({usuariosEnRadio.length})
                        </div>
                        <div className="space-y-1">
                            {usuariosEnRadio.slice(0, 3).map((usuario) => (
                                <div key={usuario.id} className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${
                                        usuariosTransmitiendo.has(usuario.usuario_id) ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />
                                    <span>{usuario.usuario?.username || 'Usuario'}</span>
                                    {usuario.estado === 'hablando' && (
                                        <span className="text-green-500">🎤</span>
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
            </motion.div>

            {/* Panel de Configuración */}
            {showSettings && (
                <motion.div
                    className="absolute bottom-full right-0 mb-2 rounded-xl p-4 w-80 shadow-2xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="font-bold text-sm mb-4">Configuración de Audio</h3>
                    
                    <div className="space-y-4">
                        {/* Volumen General */}
                        <div>
                            <label className="block text-xs font-medium mb-2">
                                Volumen General: {Math.round(volumenGeneral * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volumenGeneral * 100}
                                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                                className="w-full"
                            />
                        </div>

                        {/* Tecla PTT */}
                        <div>
                            <label className="block text-xs font-medium mb-2">Tecla PTT</label>
                            <select
                                value={teclaPTT}
                                onChange={(e) => handlePTTKeyChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                {PTT_KEYS.map((key) => (
                                    <option key={key.key} value={key.key}>
                                        {key.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Calidad de Audio */}
                        <div>
                            <label className="block text-xs font-medium mb-2">Calidad de Audio</label>
                            <select
                                value={audioConfig.calidad_audio}
                                onChange={(e) => actualizarAudioConfig({ calidad_audio: e.target.value as any })}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <option value="low">Baja (16 kbps)</option>
                                <option value="medium">Media (32 kbps)</option>
                                <option value="high">Alta (64 kbps)</option>
                            </select>
                        </div>

                        {/* Controles */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMuted(!isMuted)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                                    isMuted ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                                }`}
                            >
                                {isMuted ? 'Silenciado' : 'Activo'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

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
                        {radiosDisponibles.map((radio) => (
                            <button
                                key={radio.id}
                                onClick={() => handleJoinRadio(radio)}
                                disabled={radioActual?.id === radio.id}
                                className={`w-full text-left p-3 rounded-lg transition-all ${
                                    radioActual?.id === radio.id ? 'opacity-50' : 'hover:scale-105'
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
                                                background: getRadioTypeColor(radio.tipo),
                                                color: '#fff'
                                            }}
                                        >
                                            {radio.tipo}
                                        </span>
                                        {radio.es_emergencia && (
                                            <i className="fa-solid fa-exclamation-triangle text-red-500 text-xs" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                        
                        {radiosDisponibles.length === 0 && (
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
