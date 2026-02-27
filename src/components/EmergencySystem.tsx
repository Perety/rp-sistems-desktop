'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRadioStore } from '@/store/radioStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Radio } from '@/types/radios'

interface EmergencyAlert {
    id: string
    tipo: 'ems' | 'bomberos' | 'policia' | 'general'
    titulo: string
    descripcion: string
    ubicacion: string
    gravedad: 'baja' | 'media' | 'alta' | 'critica'
    usuario_id: string
    personaje_id?: string
    servidor_id: string
    activa: boolean
    created_at: string
    usuario?: {
        username: string
        nombre: string
        apellidos: string
    }
}

export default function EmergencySystem() {
    const { currentUser, currentServer } = useAuthStore()
    const { radioActual, unirseRadio } = useRadioStore()
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
    const [showEmergencyPanel, setShowEmergencyPanel] = useState(false)
    const [isInEmergencyMode, setIsInEmergencyMode] = useState(false)
    const [emergencyRadio, setEmergencyRadio] = useState<Radio | null>(null)

    useEffect(() => {
        if (currentServer) {
            cargarAlertas()
            cargarRadioEmergencia()
            
            // Suscribirse a alertas en tiempo real
            const subscription = supabase
                .channel('emergency-alerts')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'emergency_alerts',
                        filter: `servidor_id=eq.${currentServer}`
                    }, 
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            handleNuevaAlerta(payload.new as EmergencyAlert)
                        } else if (payload.eventType === 'UPDATE') {
                            actualizarAlerta(payload.new as EmergencyAlert)
                        } else if (payload.eventType === 'DELETE') {
                            setAlerts(prev => prev.filter(alert => alert.id !== payload.old.id))
                        }
                    }
                )
                .subscribe()

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [currentServer])

    const cargarAlertas = async () => {
        try {
            const { data, error } = await supabase
                .from('emergency_alerts')
                .select(`
                    *,
                    usuario:usuarios(username, nombre, apellidos)
                `)
                .eq('servidor_id', currentServer)
                .eq('activa', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAlerts(data || [])
        } catch (error) {
            console.error('Error cargando alertas:', error)
        }
    }

    const cargarRadioEmergencia = async () => {
        try {
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('servidor_id', currentServer)
                .eq('es_emergencia', true)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            setEmergencyRadio(data)
        } catch (error) {
            console.error('Error cargando radio de emergencia:', error)
        }
    }

    const handleNuevaAlerta = (alerta: EmergencyAlert) => {
        setAlerts(prev => [alerta, ...prev])
        
        // Mostrar notificación
        const mensaje = `${getTipoAlertaLabel(alerta.tipo)}: ${alerta.titulo}`
        toast.error(mensaje, {
            duration: 5000,
            icon: getTipoAlertaIcon(alerta.tipo)
        })

        // Si está en modo emergencia, unirse automáticamente a la radio
        if (isInEmergencyMode && emergencyRadio && !radioActual) {
            unirseRadio(emergencyRadio.id)
        }
    }

    const actualizarAlerta = (alerta: EmergencyAlert) => {
        setAlerts(prev => 
            prev.map(a => a.id === alerta.id ? alerta : a)
        )
    }

    const entrarModoEmergencia = async (tipo: 'ems' | 'bomberos' | 'policia') => {
        try {
            setIsInEmergencyMode(true)
            
            // Actualizar estado del personaje
            if (currentUser) {
                await supabase
                    .from('personajes')
                    .update({ 
                        en_servicio: true,
                        tipo_servicio: tipo,
                        modo_emergencia: true
                    })
                    .eq('usuario_id', currentUser.id)
            }

            // Unirse a la radio de emergencia si está disponible
            if (emergencyRadio && !radioActual) {
                await unirseRadio(emergencyRadio.id)
            }

            toast.success(`Modo ${getTipoServicioLabel(tipo)} activado`)
            setShowEmergencyPanel(false)
        } catch (error) {
            console.error('Error activando modo emergencia:', error)
            toast.error('Error al activar modo emergencia')
        }
    }

    const salirModoEmergencia = async () => {
        try {
            setIsInEmergencyMode(false)
            
            // Actualizar estado del personaje
            if (currentUser) {
                await supabase
                    .from('personajes')
                    .update({ 
                        en_servicio: false,
                        tipo_servicio: null,
                        modo_emergencia: false
                    })
                    .eq('usuario_id', currentUser.id)
            }

            toast.success('Modo emergencia desactivado')
        } catch (error) {
            console.error('Error desactivando modo emergencia:', error)
            toast.error('Error al desactivar modo emergencia')
        }
    }

    const crearAlerta = async (tipo: EmergencyAlert['tipo'], titulo: string, descripcion: string, ubicacion: string, gravedad: EmergencyAlert['gravedad']) => {
        try {
            const { data, error } = await supabase
                .from('emergency_alerts')
                .insert({
                    tipo,
                    titulo,
                    descripcion,
                    ubicacion,
                    gravedad,
                    usuario_id: currentUser?.id,
                    servidor_id: currentServer,
                    activa: true
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Alerta de emergencia creada')
            return data
        } catch (error) {
            console.error('Error creando alerta:', error)
            toast.error('Error al crear alerta')
            throw error
        }
    }

    const getTipoAlertaLabel = (tipo: EmergencyAlert['tipo']) => {
        switch (tipo) {
            case 'ems': return 'EMS'
            case 'bomberos': return 'Bomberos'
            case 'policia': return 'Policía'
            case 'general': return 'General'
            default: return tipo
        }
    }

    const getTipoAlertaIcon = (tipo: EmergencyAlert['tipo']) => {
        switch (tipo) {
            case 'ems': return '🚑'
            case 'bomberos': return '🚒'
            case 'policia': return '🚓'
            case 'general': return '🚨'
            default: return '⚠️'
        }
    }

    const getTipoServicioLabel = (tipo: 'ems' | 'bomberos' | 'policia') => {
        switch (tipo) {
            case 'ems': return 'EMS'
            case 'bomberos': return 'Bomberos'
            case 'policia': return 'Policía'
            default: return 'Servicio'
        }
    }

    const getGravedadColor = (gravedad: EmergencyAlert['gravedad']) => {
        switch (gravedad) {
            case 'baja': return '#10B981'
            case 'media': return '#F59E0B'
            case 'alta': return '#EF4444'
            case 'critica': return '#DC2626'
            default: return '#6B7280'
        }
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Botón de Emergencia */}
            <motion.button
                onClick={() => setShowEmergencyPanel(!showEmergencyPanel)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center ${
                    isInEmergencyMode ? 'animate-pulse' : ''
                }`}
                style={{
                    background: isInEmergencyMode ? '#EF4444' : '#DC2626',
                    boxShadow: isInEmergencyMode ? '0 0 30px rgba(239, 68, 68, 0.8)' : '0 0 20px rgba(220, 38, 38, 0.6)'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <i className="fa-solid fa-exclamation-triangle text-white text-xl" />
            </motion.button>

            {/* Panel de Emergencia */}
            {showEmergencyPanel && (
                <motion.div
                    className="absolute top-full right-0 mt-2 rounded-xl p-4 w-80 shadow-2xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="font-bold text-sm mb-4">Servicios de Emergencia</h3>
                    
                    {isInEmergencyMode ? (
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <i className="fa-solid fa-check-circle text-green-500" />
                                    <span className="font-medium text-sm">Modo Emergencia Activo</span>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    Estás conectado al canal de emergencias
                                </p>
                            </div>
                            
                            <button
                                onClick={salirModoEmergencia}
                                className="w-full px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: '#6B7280', color: '#fff' }}
                            >
                                Salir del Servicio
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={() => entrarModoEmergencia('ems')}
                                className="w-full p-3 rounded-lg flex items-center gap-3 transition-all hover:scale-105"
                                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981' }}
                            >
                                <span className="text-2xl">🚑</span>
                                <div className="text-left">
                                    <div className="font-medium text-sm">EMS</div>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Servicios Médicos
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => entrarModoEmergencia('bomberos')}
                                className="w-full p-3 rounded-lg flex items-center gap-3 transition-all hover:scale-105"
                                style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B' }}
                            >
                                <span className="text-2xl">🚒</span>
                                <div className="text-left">
                                    <div className="font-medium text-sm">Bomberos</div>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Cuerpo de Bomberos
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => entrarModoEmergencia('policia')}
                                className="w-full p-3 rounded-lg flex items-center gap-3 transition-all hover:scale-105"
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6' }}
                            >
                                <span className="text-2xl">🚓</span>
                                <div className="text-left">
                                    <div className="font-medium text-sm">Policía</div>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Fuerzas Policiales
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Alertas Activas */}
            {alerts.length > 0 && (
                <div className="absolute top-full right-0 mt-2 space-y-2">
                    {alerts.slice(0, 3).map((alert) => (
                        <motion.div
                            key={alert.id}
                            className="rounded-xl p-3 w-80 shadow-2xl"
                            style={{ 
                                background: 'var(--bg-card)', 
                                border: `1px solid ${getGravedadColor(alert.gravedad)}`,
                                borderLeft: `4px solid ${getGravedadColor(alert.gravedad)}`
                            }}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">{getTipoAlertaIcon(alert.tipo)}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{alert.titulo}</span>
                                        <span 
                                            className="text-xs px-2 py-0.5 rounded"
                                            style={{ 
                                                background: getGravedadColor(alert.gravedad),
                                                color: '#fff'
                                            }}
                                        >
                                            {alert.gravedad.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {alert.descripcion}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        📍 {alert.ubicacion} • {alert.usuario?.username}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
