'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Bolo } from '@/types'

export default function BoloPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Bolo[]>([])
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ 
        titulo: '', 
        tipo: 'Persona', 
        descripcion: '',
        destinatarios: 'todos' // 'policia', 'ciudadanos', 'todos'
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('bolo').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.titulo || !form.descripcion) return toast.error('Completa todos los campos')
        await supabase.from('bolo').insert({ ...form, servidor_id: currentServer, creado_por: currentUser?.nombre })
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'BOLO Creado', modulo: 'bolo', descripcion: form.titulo })
        toast.success('BOLO emitido')
        setModal(false)
        setForm({ titulo: '', tipo: 'Persona', descripcion: '', destinatarios: 'todos' })
        fetchData()
    }

    const cancel = async (id: string) => {
        await supabase.from('bolo').update({ activo: false, estado: 'cancelado' }).eq('id', id)
        fetchData()
        toast.success('BOLO cancelado')
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">BOLO</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Be On Look Out · {items.filter(b => b.activo).length} activos</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-bullhorn" />Emitir BOLO
                </button>
            </div>
            <div className="space-y-3">
                {items.map((b, i) => (
                    <motion.div key={b.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', borderLeft: `3px solid ${b.activo ? 'var(--danger)' : 'var(--text-muted)'}`, border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: b.activo ? 1 : 0.5, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-[16px]">{b.titulo}</span>
                                    <Badge variant={b.activo ? 'danger' : 'muted'}>{b.activo ? 'ACTIVO' : b.estado}</Badge>
                                    <Badge variant="info">{b.tipo}</Badge>
                                </div>
                                <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{b.descripcion}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        <i className="fa-solid fa-user mr-1" />{b.creado_por} · {formatDate(b.created_at)}
                                    </span>
                                    <span className="text-[11px] px-2 py-1 rounded-full" style={{ 
                                        background: 'var(--bg-hover)', 
                                        color: 'var(--text-secondary)',
                                        fontSize: '10px'
                                    }}>
                                        {b.destinatarios === 'policia' ? '👮 Policía' : 
                                         b.destinatarios === 'ciudadanos' ? '👥 Ciudadanos' : '🌐 Todos'}
                                    </span>
                                </div>
                            </div>
                            {b.activo && (
                                <button onClick={() => cancel(b.id)} className="px-3 py-1.5 rounded-lg font-bold text-[12px] flex-shrink-0" style={{ background: 'rgba(90,100,116,0.2)', color: 'var(--text-secondary)' }}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
                {items.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin BOLOs activos</div>}
            </div>
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Emitir BOLO">
                <div className="space-y-4">
                    <div><label>Título *</label><input type="text" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} /></div>
                    <div>
                        <label>Tipo</label>
                        <div className="flex gap-2">
                            {['Persona', 'Vehículo', 'Objeto'].map((t) => (
                                <button key={t} onClick={() => setForm((p) => ({ ...p, tipo: t }))} className="flex-1 py-2 rounded-lg font-bold text-[12px] transition-all"
                                    style={{ background: form.tipo === t ? 'var(--accent)' : 'var(--bg-hover)', color: form.tipo === t ? '#000' : 'var(--text-secondary)' }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div><label>Descripción *</label><textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} /></div>
                    <div>
                        <label>Destinatarios</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'policia', label: 'Policía', icon: '👮' },
                                { value: 'ciudadanos', label: 'Ciudadanos', icon: '👥' },
                                { value: 'todos', label: 'Todos', icon: '🌐' }
                            ].map((dest) => (
                                <button key={dest.value} onClick={() => setForm((p) => ({ ...p, destinatarios: dest.value }))} className="flex-1 py-2 rounded-lg font-bold text-[12px] transition-all"
                                    style={{ background: form.destinatarios === dest.value ? 'var(--accent)' : 'var(--bg-hover)', color: form.destinatarios === dest.value ? '#000' : 'var(--text-secondary)' }}>
                                    {dest.icon} {dest.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>Emitir BOLO</button>
                </div>
            </Modal>
        </div>
    )
}
