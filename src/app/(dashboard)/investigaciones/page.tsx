'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Investigacion } from '@/types'

export default function InvestigacionesPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Investigacion[]>([])
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ titulo: '', descripcion: '' })
    const [selected, setSelected] = useState<Investigacion | null>(null)
    const [evidencia, setEvidencia] = useState('')

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('investigaciones').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.titulo) return toast.error('El título es requerido')
        await supabase.from('investigaciones').insert({ ...form, servidor_id: currentServer, detective_lider: currentUser?.nombre, investigador_id: currentUser?.id })
        toast.success('Investigación creada')
        setModal(false)
        setForm({ titulo: '', descripcion: '' })
        fetchData()
    }

    const addEvidencia = async () => {
        if (!evidencia || !selected) return
        const nuevas = [...(selected.evidencias || []), { texto: evidencia, fecha: new Date().toISOString(), autor: currentUser?.nombre }]
        await supabase.from('investigaciones').update({ evidencias: nuevas }).eq('id', selected.id)
        setSelected({ ...selected, evidencias: nuevas })
        setEvidencia('')
        fetchData()
        toast.success('Evidencia añadida')
    }

    const estadoBadge = { activa: 'warning', resuelta: 'success', archivada: 'muted' } as const

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Investigaciones</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.filter(i => i.estado === 'activa').length} activas</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-plus" />Nueva Investigación
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {items.map((inv, i) => (
                        <motion.button key={inv.id} onClick={() => setSelected(inv)} className="w-full text-left rounded-xl p-4 transition-all"
                            style={{ background: 'var(--bg-card)', border: `1px solid ${selected?.id === inv.id ? 'var(--accent)' : 'var(--border)'}` }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-[14px]">{inv.titulo}</span>
                                <Badge variant={estadoBadge[inv.estado as keyof typeof estadoBadge] ?? 'muted'}>{inv.estado}</Badge>
                            </div>
                            {inv.descripcion && <div className="text-[12px] mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{inv.descripcion}</div>}
                            <div className="text-[11px] mt-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-user" />{inv.detective_lider} · {(inv.evidencias || []).length} evidencias
                            </div>
                        </motion.button>
                    ))}
                    {items.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin investigaciones</div>}
                </div>

                {selected && (
                    <motion.div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-[18px]">{selected.titulo}</h3>
                                <div className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>Det. {selected.detective_lider} · {formatDate(selected.created_at)}</div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-[20px]" style={{ color: 'var(--text-muted)' }}>×</button>
                        </div>
                        {selected.descripcion && <div className="text-[13px] mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{selected.descripcion}</div>}
                        <h4 className="font-bold text-[12px] uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Evidencias ({(selected.evidencias || []).length})</h4>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {(selected.evidencias || []).map((ev: any, i: number) => (
                                <div key={i} className="p-2 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                    <div className="text-[13px]">{ev.texto}</div>
                                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{ev.autor} · {formatDate(ev.fecha)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Añadir evidencia..." value={evidencia} onChange={(e) => setEvidencia(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEvidencia()} />
                            <button onClick={addEvidencia} className="px-4 py-2 rounded-lg font-bold text-[13px] flex-shrink-0" style={{ background: 'var(--accent)', color: '#000' }}>
                                <i className="fa-solid fa-plus" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Investigación">
                <div className="space-y-4">
                    <div><label>Título *</label><input type="text" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} /></div>
                    <div><label>Descripción inicial</label><textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} /></div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>Crear</button>
                </div>
            </Modal>
        </div>
    )
}
