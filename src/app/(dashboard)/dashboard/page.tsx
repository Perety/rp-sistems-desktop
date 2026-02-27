'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { obtenerSancionesActivas, formatearMensajeSancion } from '@/lib/validarSanciones'
import { StatCard } from '@/components/ui/StatCard'
import type { Auditoria, Servicio } from '@/types'

export default function DashboardPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [stats, setStats] = useState({ ciudadanos: 0, multas: 0, arrestos: 0, llamadas: 0, enServicio: 0 })
    const [logs, setLogs] = useState<Auditoria[]>([])
    const [servicioList, setServicioList] = useState<Servicio[]>([])
    const [sanciones, setSanciones] = useState<any[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (!currentServer) return
        fetchStats()
        fetchLogs()
        fetchServicio()
        fetchSanciones()
        checkAdmin()
    }, [currentServer])

    const checkAdmin = () => {
        setIsAdmin(currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin')
    }

    const fetchStats = async () => {
        const [c, m, a, l, s] = await Promise.all([
            supabase.from('ciudadanos').select('id', { count: 'exact' }).eq('servidor_id', currentServer),
            supabase.from('multas').select('id', { count: 'exact' }).eq('servidor_id', currentServer),
            supabase.from('arrestos').select('id', { count: 'exact' }).eq('servidor_id', currentServer),
            supabase.from('llamadas').select('id', { count: 'exact' }).eq('servidor_id', currentServer),
            supabase.from('servicio').select('id', { count: 'exact' }).eq('servidor_id', currentServer).is('hora_fin', null),
        ])
        setStats({
            ciudadanos: c.count ?? 0,
            multas: m.count ?? 0,
            arrestos: a.count ?? 0,
            llamadas: l.count ?? 0,
            enServicio: s.count ?? 0,
        })
    }

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('auditoria')
            .select('*')
            .eq('servidor_id', currentServer)
            .order('fecha_hora', { ascending: false })
            .limit(10)
        setLogs(data ?? [])
    }

    const fetchServicio = async () => {
        const { data } = await supabase
            .from('servicio')
            .select('*, usuarios(nombre, placa, rango)')
            .eq('servidor_id', currentServer)
            .is('hora_fin', null)
            .limit(6)
        setServicioList((data ?? []) as any)
    }

    const fetchSanciones = async () => {
        if (!currentUser?.id || !currentServer) return
        
        // Usar el nuevo sistema de sanciones funcionales
        const sancionesActivas = await obtenerSancionesActivas(currentUser.id, currentServer)
        setSanciones(sancionesActivas)
    }

    const moduleName: Record<string, string> = {
        auth: 'Autenticación',
        mdt: 'CAD/MDT',
        multas: 'Multas',
        arrestos: 'Arrestos',
        banca: 'Banca',
        llamadas: 'Llamadas',
        bolo: 'BOLO',
        admin: 'Administración',
    }

    const estadoColor = (estado: string) => {
        if (['disponible'].includes(estado)) return '#2ed573'
        if (['ocupado'].includes(estado)) return '#ff4757'
        if (['descanso'].includes(estado)) return '#ffa502'
        return '#8b96a5'
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Welcome */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">
                    Bienvenido, <span style={{ color: 'var(--accent)' }}>{currentUser?.nombre}</span>
                </h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{currentUser?.placa && `Placa ${currentUser.placa} · `}{currentUser?.rango}
                </p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <StatCard icon="fa-solid fa-users" title="Ciudadanos" value={stats.ciudadanos} delay={0} />
                <StatCard icon="fa-solid fa-file-invoice-dollar" title="Multas" value={stats.multas} delay={0.05} iconColor="#ffa502" iconBg="rgba(255,165,2,0.1)" />
                <StatCard icon="fa-solid fa-handcuffs" title="Arrestos" value={stats.arrestos} delay={0.1} iconColor="#ff4757" iconBg="rgba(255,71,87,0.1)" />
                <StatCard icon="fa-solid fa-phone" title="Llamadas" value={stats.llamadas} delay={0.15} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" />
                <StatCard icon="fa-solid fa-circle-check" title="En Servicio" value={stats.enServicio} delay={0.2} iconColor="#2ed573" iconBg="rgba(46,213,115,0.1)" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Officers on duty */}
                <motion.div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <h3 className="font-bold text-[15px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-users mr-2" style={{ color: 'var(--accent)' }} />
                        Oficiales en Servicio
                    </h3>
                    {servicioList.length === 0 ? (
                        <p className="text-center py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>Nadie en servicio</p>
                    ) : (
                        <div className="space-y-2">
                            {servicioList.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div>
                                        <div className="font-bold text-[14px]">{s.usuarios?.nombre}</div>
                                        <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                            {s.usuarios?.rango} {s.usuarios?.placa && `· Placa ${s.usuarios.placa}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: estadoColor(s.estado) }} />
                                        <span className="text-[11px] font-bold uppercase" style={{ color: estadoColor(s.estado) }}>{s.estado}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Recent activity */}
                <motion.div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="font-bold text-[15px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-clock-rotate-left mr-2" style={{ color: 'var(--accent)' }} />
                        Actividad Reciente
                    </h3>
                    {logs.length === 0 ? (
                        <p className="text-center py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin actividad</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {logs.map((l) => (
                                <div key={l.id} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0" style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}>
                                        <i className="fa-solid fa-terminal" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-[13px]">{l.accion}</div>
                                        <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                            {(moduleName[l.modulo] || l.modulo)} · {l.usuario_nombre}
                                        </div>
                                    </div>
                                    <div className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                        {formatDate(l.fecha_hora)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Mis Sanciones */}
                <motion.div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[15px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-gavel mr-2" style={{ color: 'var(--accent)' }} />
                            Mis Sanciones
                        </h3>
                        {isAdmin && (
                            <button
                                onClick={() => window.location.href = '/admin/sanciones'}
                                className="px-2 py-1 rounded text-[10px] font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Gestionar
                            </button>
                        )}
                    </div>
                    {sanciones.length === 0 ? (
                        <p className="text-center py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin sanciones activas</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {sanciones.map((s) => (
                                <div key={s.id} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0" style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--danger)' }}>
                                        <i className="fa-solid fa-gavel" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-[13px]">{s.tipo_sancion}</div>
                                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                            {s.motivo}
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            Por: {s.emitido_por}
                                            {s.fecha_expiracion && ` · Expira: ${new Date(s.fecha_expiracion).toLocaleDateString('es-ES')}`}
                                        </div>
                                    </div>
                                    <div className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                        {formatDate(s.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
