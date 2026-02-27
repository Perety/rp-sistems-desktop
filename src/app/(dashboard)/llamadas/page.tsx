'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Llamada } from '@/types'

const TIPOS_LLAMADA = ['Emergencia', 'Robo', 'Accidente', 'Agresión', 'Persecución', 'Tiroteo', 'Incendio', 'Persona desaparecida', 'Otro']
const PRIORIDADES = ['baja', 'normal', 'alta', 'critica']

const prioColors: Record<string, string> = {
    baja: '#2ed573',
    normal: '#00d9ff',
    alta: '#ffa502',
    critica: '#ff4757',
}

export default function LlamadasPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Llamada[]>([])
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ tipo: '', ubicacion: '', descripcion: '', prioridad: 'normal' })

    useEffect(() => {
        fetchData()
        // Realtime
        const channel = supabase.channel('llamadas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'llamadas', filter: `servidor_id=eq.${currentServer}` }, () => fetchData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('llamadas').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.tipo || !form.ubicacion) return toast.error('Tipo y ubicación son requeridos')
        await supabase.from('llamadas').insert({ ...form, servidor_id: currentServer, creado_por: currentUser?.nombre, estado: 'pendiente' })
        toast.success('Llamada registrada')
        setModal(false)
        setForm({ tipo: '', ubicacion: '', descripcion: '', prioridad: 'normal' })
    }

    const updateEstado = async (id: string, estado: string) => {
        await supabase.from('llamadas').update({ estado, asignado_a: currentUser?.nombre }).eq('id', id)
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Llamadas 911</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#2ed573' }} />
                        Tiempo real
                    </p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: '#8b5cf6', color: '#fff' }}>
                    <i className="fa-solid fa-phone" />Nueva Llamada
                </button>
            </div>

            <div className="space-y-3">
                {items.map((c, i) => (
                    <motion.div key={c.id} className="rounded-xl p-4 flex items-start gap-4"
                        style={{ background: 'var(--bg-card)', borderLeft: `3px solid ${prioColors[c.prioridad] || '#00d9ff'}`, border: `1px solid var(--border)`, borderLeftWidth: '3px' }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: `${prioColors[c.prioridad]}20`, color: prioColors[c.prioridad] }}>
                            <i className="fa-solid fa-phone" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[14px]">{c.tipo}</span>
                                <Badge variant={(c.prioridad === 'critica' || c.prioridad === 'alta') ? 'danger' : c.prioridad === 'baja' ? 'success' : 'warning'}>
                                    {c.prioridad}
                                </Badge>
                                {c.estado === 'atendida' ? <Badge variant="success">Atendida</Badge> : c.estado === 'enruta' ? <Badge variant="warning">En ruta</Badge> : <Badge variant="info">Pendiente</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent)' }} />
                                {c.ubicacion}
                            </div>
                            {c.descripcion && <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.descripcion}</div>}
                            {c.asignado_a && <div className="text-[11px] mt-1" style={{ color: 'var(--success)' }}>Asignado a: {c.asignado_a}</div>}
                        </div>
                        <div className="flex flex-col gap-2">
                            {c.estado === 'pendiente' && (
                                <button onClick={() => updateEstado(c.id, 'enruta')} className="px-3 py-1 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(255,165,2,0.15)', color: '#ffa502' }}>
                                    En ruta
                                </button>
                            )}
                            {c.estado === 'enruta' && (
                                <button onClick={() => updateEstado(c.id, 'atendida')} className="px-3 py-1 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(46,213,115,0.15)', color: '#2ed573' }}>
                                    Atendida
                                </button>
                            )}
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</div>
                        </div>
                    </motion.div>
                ))}
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <i className="fa-solid fa-phone-slash text-4xl mb-3" style={{ color: 'var(--text-muted)' }} />
                        <p style={{ color: 'var(--text-muted)' }}>Sin llamadas en cola</p>
                    </div>
                )}
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Llamada 911">
                <div className="space-y-4">
                    <div>
                        <label>Tipo de Emergencia *</label>
                        <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                            <option value="">Seleccionar...</option>
                            {TIPOS_LLAMADA.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div><label>Ubicación *</label><input type="text" value={form.ubicacion} onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))} /></div>
                    <div><label>Descripción</label><textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} /></div>
                    <div>
                        <label>Prioridad</label>
                        <div className="flex gap-2">
                            {PRIORIDADES.map((p) => (
                                <button key={p} onClick={() => setForm((x) => ({ ...x, prioridad: p }))} className="flex-1 py-2 rounded-lg font-bold text-[11px] uppercase transition-all"
                                    style={{ background: form.prioridad === p ? prioColors[p] : 'var(--bg-hover)', color: form.prioridad === p ? '#000' : 'var(--text-secondary)' }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: '#8b5cf6', color: '#fff' }}>
                        Registrar Llamada
                    </button>
                </div>
            </Modal>
        </div>
    )
}
