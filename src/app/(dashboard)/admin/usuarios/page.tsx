'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Usuario } from '@/types'

const ROLES = ['superadmin', 'admin', 'mod', 'lspd', 'ems', 'ciudadano']
const roleBadge: Record<string, any> = {
    superadmin: 'danger', admin: 'warning', mod: 'info', lspd: 'info', ems: 'success', ciudadano: 'muted',
}

export default function UsuariosAdminPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [items, setItems] = useState<Usuario[]>([])
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ username: '', password: '', nombre: '', placa: '', rango: '', rol: 'ciudadano' })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('usuarios').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const submit = async () => {
        if (!form.username || !form.password || !form.nombre) return toast.error('Completa los campos requeridos')
        const { error } = await supabase.from('usuarios').insert({ ...form, servidor_id: currentServer })
        if (error) return toast.error(error.message)
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Usuario Creado', modulo: 'admin', descripcion: form.username })
        toast.success('Usuario creado')
        setModal(false)
        setForm({ username: '', password: '', nombre: '', placa: '', rango: '', rol: 'ciudadano' })
        fetchData()
    }

    const toggleActivo = async (id: string, activo: boolean) => {
        await supabase.from('usuarios').update({ activo: !activo }).eq('id', id)
        fetchData()
        toast.success(activo ? 'Usuario desactivado' : 'Usuario activado')
    }

    const changeRol = async (id: string, rol: string) => {
        await supabase.from('usuarios').update({ rol }).eq('id', id)
        fetchData()
        toast.success(`Rol cambiado a ${rol}`)
    }

    const filtered = items.filter((u) => u.nombre.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{items.length} usuarios</p>
                </div>
                <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                    <i className="fa-solid fa-user-plus" />Crear Usuario
                </button>
            </div>

            <div className="mb-4"><input type="text" placeholder="Buscar por nombre o usuario..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-[13px]">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr>{['Usuario', 'Nombre', 'Placa', 'Rol', 'Estado', 'Acciones'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <motion.tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>{u.username}</td>
                                <td className="px-4 py-3 font-bold">{u.nombre}</td>
                                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.placa || '—'}</td>
                                <td className="px-4 py-3">
                                    <select value={u.rol} onChange={(e) => changeRol(u.id, e.target.value)} className="w-auto text-[11px] py-1 rounded-lg" style={{ width: 'auto' }}
                                        disabled={u.id === currentUser?.id}>
                                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-3"><Badge variant={u.activo ? 'success' : 'muted'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                                <td className="px-4 py-3">
                                    {u.id !== currentUser?.id && (
                                        <button onClick={() => toggleActivo(u.id, u.activo)} className="px-3 py-1 rounded-lg text-[11px] font-bold"
                                            style={{ background: u.activo ? 'rgba(255,71,87,0.1)' : 'rgba(46,213,115,0.1)', color: u.activo ? 'var(--danger)' : 'var(--success)' }}>
                                            {u.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin usuarios</td></tr>}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title="Crear Usuario">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label>Usuario *</label><input type="text" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} /></div>
                        <div><label>Contraseña *</label><input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} /></div>
                    </div>
                    <div><label>Nombre Completo *</label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label>Placa</label><input type="text" value={form.placa} onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value }))} /></div>
                        <div><label>Rango</label><input type="text" value={form.rango} onChange={(e) => setForm((p) => ({ ...p, rango: e.target.value }))} /></div>
                    </div>
                    <div>
                        <label>Rol</label>
                        <select value={form.rol} onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>Crear Usuario</button>
                </div>
            </Modal>
        </div>
    )
}
