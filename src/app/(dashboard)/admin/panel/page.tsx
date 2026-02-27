'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate } from '@/lib/utils'

export default function AdminPanelPage() {
    const { currentServer, currentUser } = useAuthStore()
    const [stats, setStats] = useState({ usuarios: 0, multas: 0, arrestos: 0, llamadas: 0, negocios: 0, sanciones: 0 })
    const [servidor, setServidor] = useState<any>(null)
    const [ultimaActividad, setUltimaActividad] = useState<any[]>([])

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const [
            { count: u }, { count: m }, { count: a }, { count: l }, { count: n }, { count: s },
            { data: srv }, { data: audit }
        ] = await Promise.all([
            supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer),
            supabase.from('multas').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer),
            supabase.from('arrestos').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer),
            supabase.from('llamadas').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer),
            supabase.from('negocios').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer),
            supabase.from('sanciones').select('*', { count: 'exact', head: true }).eq('servidor_id', currentServer).eq('activa', true),
            supabase.from('servidores').select('*').eq('id', currentServer).single(),
            supabase.from('auditoria').select('*').eq('servidor_id', currentServer).order('fecha_hora', { ascending: false }).limit(10),
        ])
        setStats({ usuarios: u ?? 0, multas: m ?? 0, arrestos: a ?? 0, llamadas: l ?? 0, negocios: n ?? 0, sanciones: s ?? 0 })
        setServidor(srv)
        setUltimaActividad(audit ?? [])
    }

    const statItems = [
        { title: 'Usuarios', value: stats.usuarios, icon: 'fa-users', color: 'var(--accent)' },
        { title: 'Multas', value: stats.multas, icon: 'fa-receipt', color: '#ffa502' },
        { title: 'Arrestos', value: stats.arrestos, icon: 'fa-handcuffs', color: 'var(--danger)' },
        { title: 'Llamadas', value: stats.llamadas, icon: 'fa-phone', color: '#8b5cf6' },
        { title: 'Negocios', value: stats.negocios, icon: 'fa-briefcase', color: '#2ed573' },
        { title: 'Sanciones activas', value: stats.sanciones, icon: 'fa-gavel', color: '#f97316' },
    ]

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Visión global del servidor
                </p>
            </div>

            {servidor && (
                <motion.div className="rounded-xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <div className="text-[12px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Servidor</div>
                            <div className="text-[22px] font-bold">{servidor.nombre}</div>
                            <div className="text-[13px] mt-1 font-mono" style={{ color: 'var(--accent)' }}>Código: {servidor.codigo}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Descripción</div>
                            <div className="text-[13px] max-w-xs" style={{ color: 'var(--text-secondary)' }}>{servidor.descripcion || 'Sin descripción'}</div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {statItems.map((s, i) => (
                    <StatCard key={s.title} title={s.title} value={String(s.value)} icon={`fa-solid ${s.icon}`} iconColor={s.color} iconBg={`${s.color}20`} delay={i * 0.08} />
                ))}
            </div>


            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Gestionar Usuarios', href: '/admin/usuarios', icon: 'fa-users', color: 'var(--accent)' },
                    { label: 'Gestionar Roles', href: '/admin/roles', icon: 'fa-shield-halved', color: '#8b5cf6' },
                    { label: 'Ver Sanciones', href: '/admin/sanciones', icon: 'fa-gavel', color: 'var(--danger)' },
                    { label: 'Auditoría del Sistema', href: '/admin/auditoria', icon: 'fa-scroll', color: '#ffa502' },
                ].map((l, i) => (
                    <motion.a key={l.label} href={l.href} className="flex items-center gap-3 p-4 rounded-xl transition-all"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        whileHover={{ scale: 1.02, borderColor: l.color }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${l.color}20`, color: l.color }}>
                            <i className={`fa-solid ${l.icon}`} />
                        </div>
                        <span className="font-bold text-[14px]">{l.label}</span>
                        <i className="fa-solid fa-chevron-right ml-auto text-[11px]" style={{ color: 'var(--text-muted)' }} />
                    </motion.a>
                ))}
            </div>

            {/* Latest audit */}
            <motion.div className="rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="font-bold text-[14px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Últimas 10 acciones</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {ultimaActividad.map((a, i) => (
                        <div key={a.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                                <div className="font-bold text-[13px]">{a.accion}</div>
                                {a.descripcion && <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{a.descripcion}</div>}
                            </div>
                            <div className="text-right">
                                <div className="text-[12px] font-bold">{a.usuario_nombre}</div>
                                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatDate(a.fecha_hora)}</div>
                            </div>
                        </div>
                    ))}
                    {ultimaActividad.length === 0 && <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin actividad</div>}
                </div>
            </motion.div>
        </div>
    )
}
