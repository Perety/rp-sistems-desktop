'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Ciudadano, Personaje, Licencia } from '@/types'

export default function MDTPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState<'nombre' | 'dni' | 'matricula' | 'apellidos'>('nombre')
    const [scanning, setScanning] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [selected, setSelected] = useState<any | null>(null)
    const [personaje, setPersonaje] = useState<Personaje | null>(null)
    const [licencias, setLicencias] = useState<Licencia[]>([])
    const [multaModal, setMultaModal] = useState(false)
    const [arrestoModal, setArrestoModal] = useState(false)
    const [multaData, setMultaData] = useState({ importe: '', motivo: '' })
    const [arrestoData, setArrestoData] = useState({ tiempo: '', fianza: '', cargos: '' })

    const logAudit = async (accion: string, descripcion: string) => {
        await supabase.from('auditoria').insert({
            servidor_id: currentServer,
            usuario_id: currentUser?.id,
            usuario_nombre: currentUser?.nombre,
            accion,
            modulo: 'mdt',
            descripcion,
        })
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return toast.error('Ingresa un término de búsqueda')
        setScanning(true)
        setResults([])
        setSelected(null)
        setPersonaje(null)
        await new Promise((r) => setTimeout(r, 1200)) // scan animation

        try {
            if (searchType === 'matricula') {
                const { data } = await supabase
                    .from('vehiculos')
                    .select('*')
                    .eq('servidor_id', currentServer)
                    .ilike('matricula', `%${searchQuery}%`)
                setResults(data ?? [])
            } else if (searchType === 'dni') {
                // Buscar en personajes y ciudadanos por DNI
                const [personajesData, ciudadanosData] = await Promise.all([
                    supabase
                        .from('personajes')
                        .select('*')
                        .eq('servidor_id', currentServer)
                        .ilike('dni', `%${searchQuery}%`),
                    supabase
                        .from('ciudadanos')
                        .select('*')
                        .eq('servidor_id', currentServer)
                        .ilike('dni', `%${searchQuery}%`)
                ])
                
                const combined = [
                    ...(personajesData.data || []).map(p => ({
                        ...p,
                        nombre: `${p.nombre} ${p.apellidos}`,
                        tipo: 'personaje'
                    })),
                    ...(ciudadanosData.data || []).map(c => ({
                        ...c,
                        tipo: 'ciudadano'
                    }))
                ]
                setResults(combined)
            } else if (searchType === 'apellidos') {
                // Buscar por apellidos en personajes
                const { data } = await supabase
                    .from('personajes')
                    .select('*')
                    .eq('servidor_id', currentServer)
                    .ilike('apellidos', `%${searchQuery}%`)
                
                const formatted = (data || []).map(p => ({
                    ...p,
                    nombre: `${p.nombre} ${p.apellidos}`,
                    tipo: 'personaje'
                }))
                setResults(formatted)
            } else {
                // Buscar por nombre en ambos sistemas
                const [personajesData, ciudadanosData] = await Promise.all([
                    supabase
                        .from('personajes')
                        .select('*')
                        .eq('servidor_id', currentServer)
                        .ilike('nombre', `%${searchQuery}%`),
                    supabase
                        .from('ciudadanos')
                        .select('*')
                        .eq('servidor_id', currentServer)
                        .ilike('nombre', `%${searchQuery}%`)
                ])
                
                const combined = [
                    ...(personajesData.data || []).map(p => ({
                        ...p,
                        nombre: `${p.nombre} ${p.apellidos}`,
                        tipo: 'personaje'
                    })),
                    ...(ciudadanosData.data || []).map(c => ({
                        ...c,
                        tipo: 'ciudadano'
                    }))
                ]
                setResults(combined)
            }
            await logAudit('Búsqueda MDT', `Buscó "${searchQuery}" por ${searchType}`)
        } catch {
            toast.error('Error de búsqueda')
        } finally {
            setScanning(false)
        }
    }

    const selectCiudadano = async (c: any) => {
        setSelected(c)
        // Try to find linked personaje
        const { data: pData } = await supabase
            .from('personajes')
            .select('*')
            .eq('servidor_id', currentServer)
            .ilike('nombre', `%${c.nombre}%`)
            .limit(1)
            .maybeSingle()
        setPersonaje(pData ?? null)
        if (pData) {
            const { data: lData } = await supabase.from('licencias').select('*').eq('personaje_id', pData.id)
            setLicencias(lData ?? [])
        }
    }

    const submitMulta = async () => {
        if (!multaData.importe || !multaData.motivo) return toast.error('Completa todos los campos')
        const { error } = await supabase.from('multas').insert({
            servidor_id: currentServer,
            ciudadano_nombre: selected.nombre,
            importe: parseFloat(multaData.importe),
            motivo: multaData.motivo,
            oficial_nombre: currentUser?.nombre,
            oficial_id: currentUser?.id,
        })
        if (error) { toast.error('Error al registrar multa'); return }
        await logAudit('Multa Creada', `$${multaData.importe} a ${selected.nombre} — ${multaData.motivo}`)
        toast.success('Multa registrada correctamente')
        setMultaModal(false)
        setMultaData({ importe: '', motivo: '' })
    }

    const submitArresto = async () => {
        if (!arrestoData.tiempo || !arrestoData.cargos) return toast.error('Completa todos los campos')
        const { error } = await supabase.from('arrestos').insert({
            servidor_id: currentServer,
            ciudadano_nombre: selected.nombre,
            tiempo: parseInt(arrestoData.tiempo),
            fianza: parseFloat(arrestoData.fianza || '0'),
            cargos: arrestoData.cargos,
            oficial_nombre: currentUser?.nombre,
            oficial_id: currentUser?.id,
        })
        if (error) { toast.error('Error al registrar arresto'); return }
        await logAudit('Arresto Registrado', `${selected.nombre} — ${arrestoData.cargos}`)
        toast.success('Arresto registrado')
        setArrestoModal(false)
        setArrestoData({ tiempo: '', fianza: '', cargos: '' })
    }

    const licenseStatus = { activa: 'success', suspendida: 'warning', revocada: 'danger' } as const

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">CAD / MDT</h1>
                <p className="text-[13px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Sistema de Despacho y Terminal de Datos
                </p>
            </div>

            {/* Search bar */}
            <motion.div
                className="rounded-xl p-5 mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex gap-3 mb-4">
                    {['nombre', 'apellidos', 'dni', 'matricula'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setSearchType(t as any)}
                            className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all"
                            style={{
                                background: searchType === t ? 'var(--accent)' : 'var(--bg-hover)',
                                color: searchType === t ? '#000' : 'var(--text-secondary)',
                            }}
                        >
                            {t === 'dni' ? 'DNI' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder={`Buscar por ${searchType}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={scanning}
                        className="px-6 py-2 rounded-xl font-bold text-[13px] uppercase disabled:opacity-50 transition-all"
                        style={{ background: 'var(--accent)', color: '#000' }}
                    >
                        {scanning ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-magnifying-glass mr-2" />Buscar</>}
                    </button>
                </div>

                {/* Scan animation */}
                <AnimatePresence>
                    {scanning && (
                        <motion.div
                            className="relative h-1 mt-4 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-hover)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="absolute inset-y-0 w-1/3 rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
                                animate={{ x: ['-100%', '300%'] }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Results list */}
                <motion.div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="font-bold text-[13px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Resultados ({results.length})
                    </h3>
                    {results.length === 0 ? (
                        <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                            {scanning ? 'Escaneando...' : 'Sin resultados'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {results.map((r) => (
                                <motion.button
                                    key={r.id}
                                    onClick={() => selectCiudadano(r)}
                                    className="w-full text-left p-3 rounded-lg transition-all"
                                    style={{
                                        background: selected?.id === r.id ? 'rgba(0,217,255,0.08)' : 'var(--bg-hover)',
                                        border: `1px solid ${selected?.id === r.id ? 'var(--accent)' : 'var(--border)'}`,
                                    }}
                                    whileHover={{ scale: 1.01 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-[13px]">{r.nombre}</div>
                                        {r.tipo && (
                                            <Badge variant={r.tipo === 'personaje' ? 'info' : 'muted'} className="text-xs">
                                                {r.tipo === 'personaje' ? 'Personaje' : 'Ciudadano'}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                        {r.dni && <span className="font-mono">DNI: {r.dni}</span>}
                                        {r.matricula && <span>Matrícula: {r.matricula}</span>}
                                        {r.estado && r.estado !== 'Normal' && (
                                            <span className="ml-2" style={{ color: 'var(--danger)' }}>⚠ {r.estado}</span>
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Detail panel */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected.id}
                                className="rounded-xl p-6"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ type: 'spring', damping: 20 }}
                            >
                                {/* Profile */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div
                                        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--accent), #0088cc)' }}
                                    >
                                        {selected.nombre?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-2xl font-bold">{selected.nombre}</h2>
                                            {personaje?.buscado && <Badge variant="danger">⚠ BUSCADO</Badge>}
                                            {personaje?.en_prision && <Badge variant="warning">EN PRISIÓN</Badge>}
                                        </div>
                                        <div className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            {selected.dni || `DNI: ${personaje?.dni || 'N/A'}`}
                                        </div>
                                        <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                            {selected.telefono || selected.direccion || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Licencias */}
                                {licencias.length > 0 && (
                                    <div className="mb-5">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Licencias
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {licencias.map((l) => (
                                                <div key={l.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                                    <span className="text-[12px] font-bold capitalize">{l.tipo}</span>
                                                    <Badge variant={licenseStatus[l.estado] || 'muted'}>{l.estado}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {(selected.notas || personaje?.notas) && (
                                    <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-hover)', borderLeft: '3px solid var(--warning)' }}>
                                        <div className="text-[12px] font-bold uppercase mb-1" style={{ color: 'var(--warning)' }}>Notas del sistema</div>
                                        <div className="text-[13px]">{selected.notas || personaje?.notas}</div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <button
                                        onClick={() => setMultaModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[13px] transition-all hover:opacity-90"
                                        style={{ background: 'rgba(255,165,2,0.15)', color: '#ffa502', border: '1px solid rgba(255,165,2,0.3)' }}
                                    >
                                        <i className="fa-solid fa-file-invoice-dollar" />
                                        Emitir Multa
                                    </button>
                                    <button
                                        onClick={() => setArrestoModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[13px] transition-all hover:opacity-90"
                                        style={{ background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }}
                                    >
                                        <i className="fa-solid fa-handcuffs" />
                                        Registrar Arresto
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                className="rounded-xl flex flex-col items-center justify-center p-16"
                                style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <i className="fa-solid fa-fingerprint text-5xl mb-4" style={{ color: 'var(--accent)', opacity: 0.4 }} />
                                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                    Selecciona un resultado para ver el perfil
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Multa Modal */}
            <Modal isOpen={multaModal} onClose={() => setMultaModal(false)} title="Emitir Multa" subtitle={selected?.nombre}>
                <div className="space-y-4">
                    <div>
                        <label>Importe ($)</label>
                        <input type="number" placeholder="500" value={multaData.importe} onChange={(e) => setMultaData((p) => ({ ...p, importe: e.target.value }))} />
                    </div>
                    <div>
                        <label>Motivo</label>
                        <textarea placeholder="Describe la infracción..." value={multaData.motivo} onChange={(e) => setMultaData((p) => ({ ...p, motivo: e.target.value }))} />
                    </div>
                    <button onClick={submitMulta} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: '#ffa502', color: '#000' }}>
                        Confirmar Multa
                    </button>
                </div>
            </Modal>

            {/* Arresto Modal */}
            <Modal isOpen={arrestoModal} onClose={() => setArrestoModal(false)} title="Registrar Arresto" subtitle={selected?.nombre}>
                <div className="space-y-4">
                    <div>
                        <label>Tiempo (meses)</label>
                        <input type="number" placeholder="6" value={arrestoData.tiempo} onChange={(e) => setArrestoData((p) => ({ ...p, tiempo: e.target.value }))} />
                    </div>
                    <div>
                        <label>Fianza ($)</label>
                        <input type="number" placeholder="0" value={arrestoData.fianza} onChange={(e) => setArrestoData((p) => ({ ...p, fianza: e.target.value }))} />
                    </div>
                    <div>
                        <label>Cargos</label>
                        <textarea placeholder="Lista los cargos..." value={arrestoData.cargos} onChange={(e) => setArrestoData((p) => ({ ...p, cargos: e.target.value }))} />
                    </div>
                    <button onClick={submitArresto} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--danger)', color: '#fff' }}>
                        Confirmar Arresto
                    </button>
                </div>
            </Modal>
        </div>
    )
}
