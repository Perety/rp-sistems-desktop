'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Denuncia } from '@/types'

export default function DenunciasPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Denuncia[]>([])
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ victima: '', acusado: '', narracion: '' })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('denuncias').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.victima || !form.narracion) return toast.error('Víctima y narración son requeridas')
        await supabase.from('denuncias').insert({ ...form, servidor_id: currentServer, oficial_receptor: currentUser?.nombre })
        toast.success('Denuncia registrada')
        setModal(false)
        setForm({ victima: '', acusado: '', narracion: '' })
        fetchData()
    }

    const updateEstado = async (id: string, estado: string) => {
        await supabase.from('denuncias').update({ estado }).eq('id', id)
        fetchData()
    }

    const estadoBadge = { abierta: 'warning', cerrada: 'muted', investigando: 'info' } as const

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Denuncias</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.filter(d => d.estado === 'abierta').length} abiertas</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-plus" />Nueva Denuncia
                </button>
            </div>
            <div className="space-y-3">
                {items.map((d, i) => (
                    <motion.div key={d.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-bold">Víctima: {d.victima}</span>
                                    {d.acusado && <span style={{ color: 'var(--text-secondary)' }}>vs. {d.acusado}</span>}
                                    <Badge variant={estadoBadge[d.estado as keyof typeof estadoBadge] ?? 'muted'}>{d.estado}</Badge>
                                </div>
                                <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{d.narracion}</div>
                                <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Receptor: {d.oficial_receptor} · {formatDate(d.created_at)}
                                </div>
                            </div>
                            {d.estado === 'abierta' && (
                                <div className="flex gap-2">
                                    <button onClick={() => updateEstado(d.id, 'investigando')} className="px-3 py-1 rounded-lg font-bold text-[11px]" style={{ background: 'rgba(0,217,255,0.1)', color: 'var(--accent)' }}>Investigar</button>
                                    <button onClick={() => updateEstado(d.id, 'cerrada')} className="px-3 py-1 rounded-lg font-bold text-[11px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Cerrar</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                {items.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin denuncias</div>}
            </div>
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Denuncia">
                <div className="space-y-4">
                    <div><label>Víctima *</label><input type="text" value={form.victima} onChange={(e) => setForm((p) => ({ ...p, victima: e.target.value }))} /></div>
                    <div><label>Acusado</label><input type="text" value={form.acusado} onChange={(e) => setForm((p) => ({ ...p, acusado: e.target.value }))} /></div>
                    <div><label>Narración *</label><textarea value={form.narracion} onChange={(e) => setForm((p) => ({ ...p, narracion: e.target.value }))} /></div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>Registrar</button>
                </div>
            </Modal>
        </div>
    )
}
