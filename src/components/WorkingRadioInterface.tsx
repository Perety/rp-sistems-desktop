'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import supabase from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface Radio {
    id: string
    nombre: string
    frecuencia: string
    tipo: 'publica' | 'privada' | 'emergencia'
    max_usuarios?: number
    es_emergencia?: boolean
    activa: boolean
    servidor_id: string
}

export default function WorkingRadioInterface() {
    const { currentUser, currentServer } = useAuthStore()
    const [radios, setRadios] = useState<Radio[]>([])
    const [selectedRadio, setSelectedRadio] = useState<Radio | null>(null)
    const [showRadioList, setShowRadioList] = useState(false)
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(Date.now())

    useEffect(() => {
        if (currentServer) {
            cargarRadios()
            
            // Suscribirse a cambios en tiempo real
            const channel = supabase
                .channel('radios-changes')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'radios',
                        filter: `servidor_id=eq.${currentServer}`
                    }, 
                    (payload) => {
                        console.log('🔍 Cambio en radios detectado:', payload)
                        cargarRadios() // Recargar radios cuando haya cambios
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [currentServer])

    const cargarRadios = async () => {
        try {
            setLoading(true)
            console.log('🔍 Cargando radios para servidor:', currentServer)
            
            // Consulta directa sin filtros adicionales
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('servidor_id', currentServer)
                .eq('activa', true)

            console.log('🔍 Resultado - Error:', error)
            console.log('🔍 Resultado - Data:', data)

            if (error) {
                console.error('❌ Error cargando radios:', error)
                setRadios([])
            } else {
                // Mapear datos para asegurar tipos correctos
                const radiosFormateadas = (data || []).map(radio => ({
                    id: radio.id,
                    nombre: radio.nombre || 'Sin nombre',
                    frecuencia: radio.frecuencia || 'N/A',
                    tipo: radio.tipo || 'publica',
                    max_usuarios: radio.max_usuarios || 50,
                    es_emergencia: radio.es_emergencia || false,
                    activa: radio.activa || false,
                    servidor_id: radio.servidor_id
                }))
                
                console.log('✅ Radios formateadas:', radiosFormateadas)
                setRadios(radiosFormateadas)
                setLastUpdate(Date.now())
            }
        } catch (error) {
            console.error('💥 Error inesperado:', error)
            setRadios([])
        } finally {
            setLoading(false)
        }
    }

    const refreshRadios = () => {
        console.log('🔄 Refrescando radios manualmente')
        cargarRadios()
    }

    const unirseRadio = (radio: Radio) => {
        console.log('🔍 Uniéndose a radio:', radio.nombre)
        setSelectedRadio(radio)
        setShowRadioList(false)
        
        // Simular sonido de confirmación
        const audio = new Audio()
        audio.volume = 0.3
        // Crear un beep simple
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

    const salirRadio = () => {
        console.log('🔍 Saliendo de radio')
        setSelectedRadio(null)
    }

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'publica': return '#10B981'
            case 'privada': return '#F59E0B'
            case 'emergencia': return '#EF4444'
            default: return '#6B7280'
        }
    }

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'publica': return 'Pública'
            case 'privada': return 'Privada'
            case 'emergencia': return 'Emergencia'
            default: return tipo
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
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
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ 
                            background: selectedRadio ? getTipoColor(selectedRadio.tipo) : '#6B7280'
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
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'var(--bg-hover)' }}
                        >
                            📻
                        </button>
                        <button
                            onClick={refreshRadios}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'var(--bg-hover)' }}
                            title="Refrescar radios"
                        >
                            🔄
                        </button>
                        {selectedRadio && (
                            <button
                                onClick={salirRadio}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ background: '#EF4444', color: '#fff' }}
                            >
                                ❌
                            </button>
                        )}
                    </div>
                </div>

                {/* Estado */}
                <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {loading ? 'Cargando...' : 
                         selectedRadio ? `🟢 Conectado` : 
                         radios.length > 0 ? `🔴 ${radios.length} radios disponibles` : '🔴 Sin radios'}
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
                    
                    {loading ? (
                        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Cargando radios...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {radios.map((radio) => (
                                <button
                                    key={radio.id}
                                    onClick={() => unirseRadio(radio)}
                                    disabled={selectedRadio?.id === radio.id}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        selectedRadio?.id === radio.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                                    }`}
                                    style={{ background: 'var(--bg-hover)' }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{radio.nombre}</div>
                                            <div className="text-xs opacity-75">{radio.frecuencia}</div>
                                            <div className="text-xs opacity-50">ID: {radio.id.slice(0, 8)}...</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span 
                                                className="text-xs px-2 py-1 rounded text-white"
                                                style={{ background: getTipoColor(radio.tipo) }}
                                            >
                                                {getTipoLabel(radio.tipo)}
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
                                    <div className="text-xs mt-2">Revisa la consola para más detalles</div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}
