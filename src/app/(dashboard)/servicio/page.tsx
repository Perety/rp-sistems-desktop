'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Servicio } from '@/types'

const estadoColors = {
    disponible: '#2ed573',
    ocupado: '#ff4757',
    descanso: '#ffa502',
    offline: '#5a6474',
}

export default function ServicioPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<any[]>([])
    const [myService, setMyService] = useState<Servicio | null>(null)
    const [showServiceDropdown, setShowServiceDropdown] = useState(false)

    useEffect(() => {
        fetchData()
        const channel = supabase.channel('servicio')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'servicio', filter: `servidor_id=eq.${currentServer}` }, () => fetchData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('servicio').select('*, usuarios(nombre, placa, rango)').eq('servidor_id', currentServer).is('hora_fin', null)
        setItems(data ?? [])
        const mine = (data ?? []).find((s: any) => s.usuario_id === currentUser?.id)
        setMyService(mine ?? null)
    }

    const entrarServicio = async (tipo: 'policia' | 'ems' | 'bomberos' | 'negocio' | 'general' | 'emergencias' = 'general') => {
        if (myService) return
        const { error } = await supabase.from('servicio').insert({ 
            usuario_id: currentUser?.id, 
            servidor_id: currentServer, 
            estado: 'disponible',
            tipo: tipo
        })
        if (error) return toast.error('Error')
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Entró en Servicio', modulo: 'servicio' })
        toast.success(`¡Entrado en servicio como ${tipo}!`)
    }

    const salirServicio = async () => {
        if (!myService) return
        await supabase.from('servicio').update({ hora_fin: new Date().toISOString() }).eq('id', myService.id)
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Salió del Servicio', modulo: 'servicio' })
        toast('Saliste del servicio', { icon: '👋' })
    }

    const updateEstado = async (estado: string) => {
        if (!myService) return
        await supabase.from('servicio').update({ estado }).eq('id', myService.id)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Servicio</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.length} oficiales en servicio</p>
            </div>

            {/* My service controls */}
            <motion.div className="rounded-xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="font-bold text-[18px]">{currentUser?.nombre}</div>
                        <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {currentUser?.rango}{currentUser?.placa && ` · Placa ${currentUser.placa}`}
                        </div>
                        {myService && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: estadoColors[myService.estado as keyof typeof estadoColors] }} />
                                <span className="text-[13px] font-bold uppercase" style={{ color: estadoColors[myService.estado as keyof typeof estadoColors] }}>{myService.estado}</span>
                                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>desde {formatDate(myService.hora_inicio)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {!myService ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowServiceDropdown(!showServiceDropdown)} 
                                    className="px-5 py-2.5 rounded-xl font-bold uppercase text-[13px] flex items-center gap-2"
                                    style={{ background: '#2ed573', color: '#000' }}
                                >
                                    <i className="fa-solid fa-circle-check" />Entrar en Servicio
                                    <i className={`fa-solid fa-chevron-${showServiceDropdown ? 'up' : 'down'} text-xs`} />
                                </button>
                                {showServiceDropdown && (
                                    <motion.div
                                        className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border overflow-hidden z-10"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="p-2">
                                            <div className="text-[12px] font-medium mb-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                                                Tipo de servicio:
                                            </div>
                                            <div className="space-y-1">
                                                <button 
                                                    onClick={() => { entrarServicio('policia'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                                >
                                                    👮 Policía
                                                </button>
                                                <button 
                                                    onClick={() => { entrarServicio('ems'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                                >
                                                    🚑 EMS
                                                </button>
                                                <button 
                                                    onClick={() => { entrarServicio('bomberos'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                                >
                                                    🚒 Bomberos
                                                </button>
                                                <button 
                                                    onClick={() => { entrarServicio('emergencias'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid #DC2626' }}
                                                >
                                                    🚨 Emergencias
                                                </button>
                                                <button 
                                                    onClick={() => { entrarServicio('negocio'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                                >
                                                    💼 Negocio
                                                </button>
                                                <button 
                                                    onClick={() => { entrarServicio('general'); setShowServiceDropdown(false); }} 
                                                    className="w-full px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all flex items-center gap-2"
                                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                                >
                                                    🌐 General
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <>
                                {(['disponible', 'ocupado', 'descanso'] as const).map((e) => (
                                    <button key={e} onClick={() => updateEstado(e)} className="px-3 py-2 rounded-xl font-bold text-[12px] uppercase transition-all"
                                        style={{ background: myService.estado === e ? estadoColors[e] : 'var(--bg-hover)', color: myService.estado === e ? '#000' : 'var(--text-secondary)' }}>
                                        {e}
                                    </button>
                                ))}
                                <button onClick={salirServicio} className="px-3 py-2 rounded-xl font-bold text-[12px] uppercase" style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--danger)' }}>
                                    <i className="fa-solid fa-right-from-bracket mr-1" />Salir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Officers list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((s, i) => (
                    <motion.div key={s.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: estadoColors[s.estado as keyof typeof estadoColors] ?? '#5a6474' }} />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-[14px]">{s.usuarios?.nombre}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{s.usuarios?.rango}{s.usuarios?.placa && ` · ${s.usuarios.placa}`}</div>
                            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                {s.tipo === 'policia' ? '👮 Policía' : 
                                 s.tipo === 'ems' ? '🚑 EMS' : 
                                 s.tipo === 'negocio' ? '💼 Negocio' : '🌐 General'}
                            </div>
                        </div>
                        <span className="text-[11px] font-bold uppercase" style={{ color: estadoColors[s.estado as keyof typeof estadoColors] ?? '#5a6474' }}>{s.estado}</span>
                    </motion.div>
                ))}
                {items.length === 0 && <div className="col-span-2 text-center py-12" style={{ color: 'var(--text-muted)' }}>Nadie en servicio</div>}
            </div>
        </div>
    )
}
