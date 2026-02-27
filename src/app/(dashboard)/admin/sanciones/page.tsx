'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Sancion } from '@/types'

export default function SancionesPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Sancion[]>([])
    const [modal, setModal] = useState(false)
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [form, setForm] = useState({ 
        usuario_id: '', 
        usuario_sancionado_nombre: '', 
        tipo: 'warning', 
        motivo: '', 
        duracion_horas: '' 
    })

    useEffect(() => { 
        fetchData() 
        fetchUsuarios()
    }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('sanciones').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const fetchUsuarios = async () => {
        const { data } = await supabase.from('usuarios').select('*').eq('servidor_id', currentServer).eq('activo', true)
        setUsuarios(data || [])
    }

    const submit = async () => {
        if (!form.usuario_sancionado_nombre || !form.motivo) return toast.error('Completa los campos')
        const expiraAt = form.duracion_horas
            ? new Date(Date.now() + parseInt(form.duracion_horas) * 3600000).toISOString()
            : null
        await supabase.from('sanciones').insert({
            servidor_id: currentServer,
            usuario_sancionado_nombre: form.usuario_sancionado_nombre,
            tipo: form.tipo,
            motivo: form.motivo,
            duracion_horas: form.duracion_horas ? parseInt(form.duracion_horas) : null,
            emitido_por: currentUser?.nombre,
            emitido_por_id: currentUser?.id,
            expira_at: expiraAt,
        })
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: `Sanción: ${form.tipo}`, modulo: 'admin', descripcion: `${form.usuario_sancionado_nombre} — ${form.motivo}` })
        toast.success('Sanción aplicada')
        setModal(false)
        setForm({ 
        usuario_id: '', 
        usuario_sancionado_nombre: '', 
        tipo: 'warning', 
        motivo: '', 
        duracion_horas: '' 
    })
        fetchData()
    }

    const revocar = async (id: string) => {
        await supabase.from('sanciones').update({ activa: false }).eq('id', id)
        fetchData()
        toast.success('Sanción revocada')
    }

    const tipoBadge = { warning: 'warning', ban: 'danger', mute: 'muted' } as const

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Sanciones</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.filter(s => s.activa).length} activas</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>
                    <i className="fa-solid fa-gavel" />Nueva Sanción
                </button>
            </div>
            <div className="space-y-3">
                {items.map((s, i) => (
                    <motion.div key={s.id} className="rounded-xl p-4 flex items-start gap-4"
                        style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, opacity: s.activa ? 1 : 0.5 }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: s.activa ? 1 : 0.5, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-[15px]">{s.usuario_sancionado_nombre}</span>
                                <Badge variant={tipoBadge[s.tipo] ?? 'muted'}>{s.tipo.toUpperCase()}</Badge>
                                {!s.activa && <Badge variant="muted">Revocada</Badge>}
                            </div>
                            <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{s.motivo}</div>
                            <div className="text-[11px] mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-user-shield" />
                                {s.emitido_por} · {formatDate(s.created_at)}
                                {s.duracion_horas && <span>· {s.duracion_horas}h</span>}
                                {s.expira_at && <span>· Expira: {formatDate(s.expira_at)}</span>}
                            </div>
                        </div>
                        {s.activa && (
                            <button onClick={() => revocar(s.id)} className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex-shrink-0" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                Revocar
                            </button>
                        )}
                    </motion.div>
                ))}
                {items.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin sanciones</div>}
            </div>
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Sanción">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium mb-1">Usuario *</label>
                        <select
                            value={form.usuario_id}
                            onChange={(e) => {
                                const selectedUsuario = usuarios.find(u => u.id === e.target.value)
                                setForm((p) => ({ 
                                    ...p, 
                                    usuario_id: e.target.value,
                                    usuario_sancionado_nombre: selectedUsuario?.nombre || ''
                                }))
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                        >
                            <option value="">Selecciona un usuario</option>
                            {usuarios.map(usuario => (
                                <option key={usuario.id} value={usuario.id}>
                                    {usuario.nombre} (@{usuario.username})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium mb-1">Tipo</label>
                        <div className="flex gap-2">
                            {(['warning', 'ban', 'mute'] as const).map((t) => (
                                <button key={t} onClick={() => setForm((p) => ({ ...p, tipo: t }))} className="flex-1 py-2 rounded-lg font-bold text-[12px] uppercase transition-all"
                                    style={{
                                        background: form.tipo === t ? (t === 'ban' ? 'var(--danger)' : t === 'warning' ? '#ffa502' : '#5a6474') : 'var(--bg-hover)',
                                        color: form.tipo === t ? '#fff' : 'var(--text-secondary)'
                                    }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium mb-1">Motivo *</label>
                        <textarea value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))} 
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium mb-1">Duración en horas (vacío = permanente)</label>
                        <input type="number" value={form.duracion_horas} onChange={(e) => setForm((p) => ({ ...p, duracion_horas: e.target.value }))} 
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>Aplicar Sanción</button>
                </div>
            </Modal>
        </div>
    )
}
