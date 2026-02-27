'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import supabase from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function DebugRadioInterface() {
    const { currentUser, currentServer } = useAuthStore()
    const [debugInfo, setDebugInfo] = useState<any>({})
    const [radios, setRadios] = useState<any[]>([])
    const [selectedRadio, setSelectedRadio] = useState<any>(null)
    const [showRadioList, setShowRadioList] = useState(false)

    useEffect(() => {
        // Debug info
        setDebugInfo({
            currentUser: currentUser?.id,
            currentServer: currentServer,
            hasUser: !!currentUser,
            hasServer: !!currentServer
        })

        if (currentServer) {
            cargarRadios()
        }
    }, [currentUser, currentServer])

    const cargarRadios = async () => {
        try {
            console.log('🔍 Debug: Cargando radios...')
            console.log('🔍 Debug: Server ID:', currentServer)
            
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('servidor_id', currentServer)
                .eq('activa', true)

            console.log('🔍 Debug: Error:', error)
            console.log('🔍 Debug: Data:', data)

            if (error) {
                console.error('❌ Error cargando radios:', error)
                return
            }

            setRadios(data || [])
        } catch (error) {
            console.error('💥 Error inesperado:', error)
        }
    }

    const unirseRadio = (radio: any) => {
        console.log('🔍 Debug: Uniéndose a radio:', radio)
        setSelectedRadio(radio)
        setShowRadioList(false)
    }

    const salirRadio = () => {
        console.log('🔍 Debug: Saliendo de radio')
        setSelectedRadio(null)
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Debug Info */}
            <div className="mb-2 p-2 rounded text-xs" style={{ background: '#000', color: '#fff' }}>
                <div>User: {debugInfo.hasUser ? '✅' : '❌'}</div>
                <div>Server: {debugInfo.hasServer ? '✅' : '❌'}</div>
                <div>Radios: {radios.length}</div>
            </div>

            {/* Interfaz Principal */}
            <motion.div
                className="rounded-xl shadow-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ 
                            background: selectedRadio ? '#10B981' : '#6B7280'
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
                            className="p-2 rounded-lg"
                            style={{ background: 'var(--bg-hover)' }}
                        >
                            📻
                        </button>
                        {selectedRadio && (
                            <button
                                onClick={salirRadio}
                                className="p-2 rounded-lg"
                                style={{ background: '#EF4444', color: '#fff' }}
                            >
                                ❌
                            </button>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {selectedRadio ? '🟢 Conectado' : '🔴 Desconectado'}
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
                                className={`w-full text-left p-3 rounded-lg hover:scale-105 transition-all ${
                                    selectedRadio?.id === radio.id ? 'opacity-50' : ''
                                }`}
                                style={{ background: 'var(--bg-hover)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{radio.nombre}</div>
                                        <div className="text-xs opacity-75">{radio.frecuencia}</div>
                                        <div className="text-xs opacity-50">ID: {radio.id}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="text-xs px-2 py-1 rounded"
                                            style={{ 
                                                background: radio.tipo === 'publica' ? '#10B981' : 
                                                           radio.tipo === 'privada' ? '#F59E0B' : '#EF4444',
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
                                <div className="text-xs mt-2">Debug: Revisa la consola</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
