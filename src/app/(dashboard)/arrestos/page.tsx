'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Arresto } from '@/types'

const CARGOS = ['Homicidio', 'Asalto', 'Robo', 'Tráfico de drogas', 'Obstrucción a la justicia', 'Tenencia ilegal de armas', 'Conducción imprudente', 'Evasión fiscal', 'Fraude']

export default function ArrestosPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Arresto[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ ciudadano_nombre: '', tiempo: '', fianza: '', cargos: '' })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('arrestos').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.ciudadano_nombre || !form.tiempo || !form.cargos) return toast.error('Completa los campos obligatorios')
        const { error } = await supabase.from('arrestos').insert({
            servidor_id: currentServer, ciudadano_nombre: form.ciudadano_nombre,
            tiempo: parseInt(form.tiempo), fianza: parseFloat(form.fianza || '0'), cargos: form.cargos,
            oficial_nombre: currentUser?.nombre, oficial_id: currentUser?.id,
        })
        if (error) return toast.error('Error al registrar')
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Arresto Registrado', modulo: 'arrestos', descripcion: `${form.ciudadano_nombre} — ${form.cargos}` })
        toast.success('Arresto registrado')
        setModal(false)
        setForm({ ciudadano_nombre: '', tiempo: '', fianza: '', cargos: '' })
        fetchData()
    }

    const filtered = items.filter((a) => a.ciudadano_nombre.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Arrestos</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.length} registros</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>
                    <i className="fa-solid fa-handcuffs" />Registrar Arresto
                </button>
            </div>

            <div className="mb-4"><input type="text" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

            <div className="space-y-3">
                {filtered.map((a, i) => (
                    <motion.div key={a.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', borderLeft: '3px solid var(--danger)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <div className="font-bold text-[16px]">{a.ciudadano_nombre}</div>
                                <div className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>{a.cargos}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <div className="text-[20px] font-bold" style={{ color: 'var(--danger)' }}>{a.tiempo}</div>
                                    <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>meses</div>
                                </div>
                                {a.fianza > 0 && (
                                    <div className="text-center">
                                        <div className="text-[16px] font-bold" style={{ color: '#ffa502' }}>{formatCurrency(a.fianza)}</div>
                                        <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>fianza</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-user-shield" />
                            {a.oficial_nombre} · {formatDate(a.created_at)}
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin arrestos</div>}
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Arresto">
                <div className="space-y-4">
                    <div><label>Ciudadano *</label><input type="text" value={form.ciudadano_nombre} onChange={(e) => setForm((p) => ({ ...p, ciudadano_nombre: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label>Tiempo (meses) *</label><input type="number" value={form.tiempo} onChange={(e) => setForm((p) => ({ ...p, tiempo: e.target.value }))} /></div>
                        <div><label>Fianza ($)</label><input type="number" value={form.fianza} onChange={(e) => setForm((p) => ({ ...p, fianza: e.target.value }))} /></div>
                    </div>
                    <div>
                        <label>Cargos *</label>
                        <select value={form.cargos} onChange={(e) => setForm((p) => ({ ...p, cargos: e.target.value }))}>
                            <option value="">Seleccionar cargo...</option>
                            {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>Registrar Arresto</button>
                </div>
            </Modal>
        </div>
    )
}
