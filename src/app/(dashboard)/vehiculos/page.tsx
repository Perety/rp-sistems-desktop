'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Vehiculo } from '@/types'

export default function VehiculosPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Vehiculo[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ matricula: '', marca: '', modelo: '', color: '', propietario_nombre: '', estado: 'Normal', notas: '' })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('vehiculos').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.matricula) return toast.error('La matrícula es requerida')
        const { error } = await supabase.from('vehiculos').insert({ ...form, servidor_id: currentServer, oficial_registro: currentUser?.nombre })
        if (error) return toast.error('Error al registrar')
        toast.success('Vehículo registrado')
        setModal(false)
        setForm({ matricula: '', marca: '', modelo: '', color: '', propietario_nombre: '', estado: 'Normal', notas: '' })
        fetchData()
    }

    const estadoBadge = { Normal: 'success', Buscado: 'danger', Robado: 'danger' } as const
    const filtered = items.filter((v) => v.matricula.toLowerCase().includes(search.toLowerCase()) || (v.propietario_nombre ?? '').toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Vehículos</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.length} registros</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-plus" />Registrar
                </button>
            </div>
            <div className="mb-4"><input type="text" placeholder="Buscar por matrícula o propietario..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-[13px]">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr>{['Matrícula', 'Vehículo', 'Color', 'Propietario', 'Estado', 'Fecha'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {filtered.map((v, i) => (
                            <motion.tr key={v.id} className="border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                <td className="px-4 py-3 font-bold font-mono" style={{ color: 'var(--accent)' }}>{v.matricula}</td>
                                <td className="px-4 py-3 font-bold">{v.marca} {v.modelo}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{v.color || '—'}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{v.propietario_nombre || '—'}</td>
                                <td className="px-4 py-3"><Badge variant={estadoBadge[v.estado as 'Normal' | 'Buscado' | 'Robado'] ?? 'muted'}>{v.estado}</Badge></td>
                                <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(v.created_at)}</td>
                            </motion.tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin vehículos</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Vehículo">
                <div className="space-y-4">
                    <div><label>Matrícula *</label><input type="text" value={form.matricula} onChange={(e) => setForm((p) => ({ ...p, matricula: e.target.value.toUpperCase() }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label>Marca</label><input type="text" value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} /></div>
                        <div><label>Modelo</label><input type="text" value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label>Color</label><input type="text" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} /></div>
                        <div><label>Propietario</label><input type="text" value={form.propietario_nombre} onChange={(e) => setForm((p) => ({ ...p, propietario_nombre: e.target.value }))} /></div>
                    </div>
                    <div>
                        <label>Estado</label>
                        <select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
                            <option value="Normal">Normal</option>
                            <option value="Buscado">Buscado</option>
                            <option value="Robado">Robado</option>
                        </select>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>Registrar</button>
                </div>
            </Modal>
        </div>
    )
}
