'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Ciudadano, Personaje } from '@/types'

export default function CiudadanosPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Ciudadano[]>([])
    const [personajes, setPersonajes] = useState<Personaje[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', direccion: '', notas: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => { 
        fetchData() 
        fetchPersonajes()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('ciudadanos')
            .select('*')
            .eq('servidor_id', currentServer)
            .order('created_at', { ascending: false })
        setItems(data ?? [])
        setLoading(false)
    }

    const fetchPersonajes = async () => {
        const { data } = await supabase
            .from('personajes')
            .select('*')
            .eq('servidor_id', currentServer)
            .eq('vivo', true)
            .order('nombre', { ascending: true })
        setPersonajes(data ?? [])
    }

    const submit = async () => {
        if (!form.nombre.trim()) return toast.error('El nombre es requerido')
        const { error } = await supabase
            .from('ciudadanos')
            .insert({ 
                ...form, 
                servidor_id: currentServer, 
                oficial_registro: currentUser?.nombre 
            })
        if (error) return toast.error('Error al registrar')
        await supabase.from('auditoria').insert({
            servidor_id: currentServer,
            usuario_id: currentUser?.id,
            usuario_nombre: currentUser?.nombre,
            accion: 'Ciudadano Registrado',
            modulo: 'ciudadanos',
            descripcion: form.nombre
        })
        toast.success('Ciudadano registrado')
        setModal(false)
        setForm({ nombre: '', dni: '', telefono: '', direccion: '', notas: '' })
        fetchData()
    }

    // Combinar ciudadanos y personajes para búsqueda completa
    const allCitizens = [
        ...items,
        ...personajes.map(p => ({
            id: p.id,
            nombre: `${p.nombre} ${p.apellidos}`,
            dni: p.dni,
            telefono: '',
            direccion: '',
            notas: 'Personaje del sistema',
            oficial_registro: 'Sistema',
            created_at: p.created_at,
            tipo: 'personaje'
        }))
    ]

    const filtered = allCitizens.filter((c) => 
        c.nombre.toLowerCase().includes(search.toLowerCase()) || 
        (c.dni ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold">Panel de Ciudadanos</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {allCitizens.length} registros totales ({items.length} ciudadanos + {personajes.length} personajes)
                    </p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-plus" />Registrar
                </button>
            </div>

            {/* Búsqueda */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                    />
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                </div>
            </div>

            {/* Lista de Ciudadanos */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <i className="fa-solid fa-users text-4xl mb-3" style={{ color: 'var(--text-muted)' }} />
                            <p className="font-medium">No se encontraron ciudadanos</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                Intenta con otra búsqueda o registra un nuevo ciudadano
                            </p>
                        </div>
                    ) : (
                        filtered.map((ciudadano, index) => (
                            <motion.div
                                key={ciudadano.id}
                                className="p-4 rounded-xl"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{ciudadano.nombre}</h3>
                                            {(ciudadano as any).tipo === 'personaje' && (
                                                <Badge variant="muted" className="text-xs">
                                                    <i className="fa-solid fa-user mr-1" />
                                                    Personaje
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            {ciudadano.dni && (
                                                <div>
                                                    <span className="font-medium">DNI:</span>
                                                    <p className="font-mono" style={{ color: 'var(--accent)' }}>{ciudadano.dni}</p>
                                                </div>
                                            )}
                                            {ciudadano.telefono && (
                                                <div>
                                                    <span className="font-medium">Teléfono:</span>
                                                    <p>{ciudadano.telefono}</p>
                                                </div>
                                            )}
                                            {ciudadano.direccion && (
                                                <div>
                                                    <span className="font-medium">Dirección:</span>
                                                    <p>{ciudadano.direccion}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-medium">Registrado:</span>
                                                <p>{formatDate(ciudadano.created_at)}</p>
                                            </div>
                                        </div>

                                        {ciudadano.notas && (
                                            <div className="mt-3">
                                                <span className="font-medium text-sm">Notas:</span>
                                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    {ciudadano.notas}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="text-xs px-2 py-1 rounded" style={{ 
                                            background: 'var(--bg-hover)', 
                                            color: 'var(--text-secondary)' 
                                        }}>
                                            {ciudadano.oficial_registro || 'Sistema'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Registro */}
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Ciudadano">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium mb-1">Nombre completo *</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            placeholder="Ej: Juan Pérez García"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[12px] font-medium mb-1">DNI</label>
                        <input
                            type="text"
                            value={form.dni}
                            onChange={(e) => setForm({ ...form, dni: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            placeholder="Ej: 12345678A"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium mb-1">Teléfono</label>
                        <input
                            type="text"
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            placeholder="Ej: 600123456"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium mb-1">Dirección</label>
                        <input
                            type="text"
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            placeholder="Ej: Calle Principal 123, Ciudad"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium mb-1">Notas</label>
                        <textarea
                            value={form.notas}
                            onChange={(e) => setForm({ ...form, notas: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            rows={3}
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                            placeholder="Notas adicionales sobre el ciudadano..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={submit}
                            className="flex-1 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                            style={{ background: 'var(--accent)', color: '#000' }}
                        >
                            <i className="fa-solid fa-save mr-2" />
                            Registrar Ciudadano
                        </button>
                        <button
                            onClick={() => setModal(false)}
                            className="flex-1 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
