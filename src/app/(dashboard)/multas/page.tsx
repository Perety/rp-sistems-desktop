'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Multa } from '@/types'

const MOTIVOS = [
    'Exceso de velocidad', 'Semáforo en rojo', 'Conducción temeraria', 'Estacionamiento ilegal',
    'Sin documentación', 'Vehículo robado', 'Conducción bajo la influencia', 'Fuga de la policía',
]

export default function MultasPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Multa[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ ciudadano_nombre: '', importe: '', motivo: '' })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('multas').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.ciudadano_nombre || !form.importe || !form.motivo) return toast.error('Completa todos los campos')
        const { error } = await supabase.from('multas').insert({
            servidor_id: currentServer, ciudadano_nombre: form.ciudadano_nombre,
            importe: parseFloat(form.importe), motivo: form.motivo,
            oficial_nombre: currentUser?.nombre, oficial_id: currentUser?.id,
        })
        if (error) return toast.error('Error al emitir multa')
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Multa Emitida', modulo: 'multas', descripcion: `$${form.importe} — ${form.ciudadano_nombre}` })
        toast.success('Multa emitida')
        setModal(false)
        setForm({ ciudadano_nombre: '', importe: '', motivo: '' })
        fetchData()
    }

    const updateEstado = async (id: string, estado: string) => {
        await supabase.from('multas').update({ estado }).eq('id', id)
        fetchData()
        toast.success(`Multa marcada como ${estado}`)
    }

    const filtered = items.filter((m) => m.ciudadano_nombre.toLowerCase().includes(search.toLowerCase()) || m.motivo.toLowerCase().includes(search.toLowerCase()))
    const estadoBadge = { pendiente: 'warning', pagada: 'success', anulada: 'muted' } as const

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Multas</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.filter(m => m.estado === 'pendiente').length} pendientes</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: '#ffa502', color: '#000' }}>
                    <i className="fa-solid fa-plus" />Emitir Multa
                </button>
            </div>
            <div className="mb-4"><input type="text" placeholder="Buscar por nombre o motivo..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-[13px]">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr>{['Ciudadano', 'Importe', 'Motivo', 'Oficial', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {filtered.map((m, i) => (
                            <motion.tr key={m.id} className="border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                <td className="px-4 py-3 font-bold">{m.ciudadano_nombre}</td>
                                <td className="px-4 py-3 font-bold" style={{ color: '#ffa502' }}>{formatCurrency(m.importe)}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{m.motivo}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{m.oficial_nombre || '—'}</td>
                                <td className="px-4 py-3"><Badge variant={estadoBadge[m.estado] ?? 'muted'}>{m.estado}</Badge></td>
                                <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(m.created_at)}</td>
                                <td className="px-4 py-3">
                                    {m.estado === 'pendiente' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateEstado(m.id, 'pagada')} className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: 'rgba(46,213,115,0.15)', color: '#2ed573' }}>Pagada</button>
                                            <button onClick={() => updateEstado(m.id, 'anulada')} className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: 'rgba(90,100,116,0.15)', color: 'var(--text-muted)' }}>Anular</button>
                                        </div>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin multas</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Emitir Multa">
                <div className="space-y-4">
                    <div><label>Nombre del Ciudadano *</label><input type="text" value={form.ciudadano_nombre} onChange={(e) => setForm((p) => ({ ...p, ciudadano_nombre: e.target.value }))} /></div>
                    <div><label>Importe ($) *</label><input type="number" value={form.importe} onChange={(e) => setForm((p) => ({ ...p, importe: e.target.value }))} /></div>
                    <div>
                        <label>Motivo *</label>
                        <select value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}>
                            <option value="">Seleccionar...</option>
                            {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: '#ffa502', color: '#000' }}>Emitir Multa</button>
                </div>
            </Modal>
        </div>
    )
}
