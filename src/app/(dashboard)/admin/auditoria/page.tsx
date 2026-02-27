'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Auditoria } from '@/types'

const MODULOS = ['todos', 'auth', 'mdt', 'multas', 'arrestos', 'banca', 'llamadas', 'bolo', 'negocios', 'admin', 'servicio']

export default function AuditoriaPage() {
    const { currentServer } = useAuthStore()
    const [items, setItems] = useState<Auditoria[]>([])
    const [modulo, setModulo] = useState('todos')
    const [search, setSearch] = useState('')

    useEffect(() => { fetchData() }, [modulo])

    const fetchData = async () => {
        let q = supabase.from('auditoria').select('*').eq('servidor_id', currentServer).order('fecha_hora', { ascending: false }).limit(200)
        if (modulo !== 'todos') q = q.eq('modulo', modulo)
        const { data } = await q
        setItems(data ?? [])
    }

    const filtered = items.filter((a) =>
        a.accion.toLowerCase().includes(search.toLowerCase()) ||
        (a.usuario_nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (a.descripcion ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const moduloColor: Record<string, string> = {
        auth: '#8b5cf6', mdt: '#00d9ff', multas: '#ffa502', arrestos: '#ff4757',
        banca: '#2ed573', llamadas: '#3b82f6', bolo: '#f97316', negocios: '#10b981', admin: '#ec4899', servicio: '#14b8a6',
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Auditoría</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Registro de todas las acciones del sistema</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                {MODULOS.map((m) => (
                    <button key={m} onClick={() => setModulo(m)} className="px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide transition-all"
                        style={{ background: modulo === m ? (moduloColor[m] || 'var(--accent)') : 'var(--bg-card)', color: modulo === m ? '#000' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {m}
                    </button>
                ))}
            </div>
            <div className="mb-4"><input type="text" placeholder="Filtrar por acción, usuario o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

            {/* Log */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="py-2 px-4" style={{ background: 'var(--bg-secondary)' }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {filtered.length} entradas
                    </span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)', maxHeight: '70vh', overflowY: 'auto' }}>
                    {filtered.map((a, i) => (
                        <motion.div key={a.id} className="flex items-start gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}>
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: moduloColor[a.modulo] || 'var(--accent)' }} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-[13px]">{a.accion}</span>
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${moduloColor[a.modulo] || 'var(--accent)'}20`, color: moduloColor[a.modulo] || 'var(--accent)' }}>
                                        {a.modulo}
                                    </span>
                                </div>
                                {a.descripcion && <div className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{a.descripcion}</div>}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-[12px] font-bold">{a.usuario_nombre || '—'}</div>
                                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatDate(a.fecha_hora)}</div>
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin entradas</div>}
                </div>
            </div>
        </div>
    )
}
