'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Radio {
    id: string
    nombre: string
    frecuencia: string
    tipo: string
    max_usuarios: number
    es_emergencia: boolean
    activa: boolean
}

export default function SimpleRadioInterface() {
    const [radios, setRadios] = useState<Radio[]>([])
    const [selectedRadio, setSelectedRadio] = useState<Radio | null>(null)
    const [showRadioList, setShowRadioList] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isTransmitting, setIsTransmitting] = useState(false)

    useEffect(() => {
        cargarRadios()
    }, [])

    const cargarRadios = async () => {
        try {
            console.log('🔍 Cargando radios...')
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('activa', true)
                .order('prioridad', { ascending: false })

            if (error) {
                console.error('❌ Error cargando radios:', error)
                toast.error('Error al cargar radios')
                return
            }

            console.log('✅ Radios cargadas:', data)
            setRadios(data || [])
        } catch (error) {
            console.error('💥 Error inesperado:', error)
        }
    }

    const unirseRadio = async (radio: Radio) => {
        try {
            console.log('🔍 Uniéndose a radio:', radio.nombre)
            
            // Simular unión a radio
            setSelectedRadio(radio)
            setIsConnected(true)
            
            toast.success(`Conectado a ${radio.nombre}`)
            setShowRadioList(false)
            
            console.log('✅ Conectado a radio:', radio.nombre)
        } catch (error) {
            console.error('❌ Error uniéndose a radio:', error)
            toast.error('Error al unirse a la radio')
        }
    }

    const salirRadio = () => {
        console.log('🔍 Saliendo de radio:', selectedRadio?.nombre)
        
        setSelectedRadio(null)
        setIsConnected(false)
        setIsTransmitting(false)
        
        toast('Desconectado de la radio')
    }

    const iniciarTransmision = () => {
        if (!selectedRadio) return
        
        console.log('🎤 Iniciando transmisión en:', selectedRadio.nombre)
        setIsTransmitiendo(true)
        toast('Transmitiendo...')
    }

    const finalizarTransmision = () => {
        console.log('🔇 Finalizando transmisión')
        setIsTransmitting(false)
        toast('Transmisión finalizada')
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
                            <i className="fa-solid fa-radio" />
                        </button>
                        {selectedRadio && (
                            <button
                                onClick={salirRadio}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: '#EF4444', color: '#fff' }}
                            >
                                <i className="fa-solid fa-power-off" />
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
                        {isTransmitiendo ? 'TRANSMITIENDO' : 'PTT'}
                    </button>
                </div>

                {/* Estado */}
                <div className="mt-3 text-center">
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {isConnected ? `🟢 Conectado a ${selectedRadio?.nombre}` : '🔴 Desconectado'}
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
                                            <i className="fa-solid fa-exclamation-triangle text-red-500 text-xs" />
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
