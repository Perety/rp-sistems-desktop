'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { RolPermiso } from '@/types'

const PERMISOS: Array<{ key: keyof RolPermiso; label: string; categoria: string }> = [
    // 👤 USUARIOS
    { key: 'puede_banear', label: 'Banear usuarios', categoria: 'Usuarios' },
    { key: 'puede_advertir', label: 'Advertir usuarios', categoria: 'Usuarios' },
    { key: 'puede_gestionar_usuarios', label: 'Gestionar usuarios', categoria: 'Usuarios' },
    { key: 'puede_ver_usuarios', label: 'Ver usuarios', categoria: 'Usuarios' },
    { key: 'puede_crear_usuarios', label: 'Crear usuarios', categoria: 'Usuarios' },
    { key: 'puede_editar_usuarios', label: 'Editar usuarios', categoria: 'Usuarios' },
    { key: 'puede_eliminar_usuarios', label: 'Eliminar usuarios', categoria: 'Usuarios' },
    
    // 🏦 ECONOMÍA
    { key: 'puede_ver_economia', label: 'Ver economía', categoria: 'Economía' },
    { key: 'puede_dar_dinero', label: 'Dar dinero', categoria: 'Economía' },
    { key: 'puede_quitar_dinero', label: 'Quitar dinero', categoria: 'Economía' },
    { key: 'puede_transferir_dinero', label: 'Transferir dinero', categoria: 'Economía' },
    { key: 'puede_ver_transacciones', label: 'Ver transacciones', categoria: 'Economía' },
    { key: 'puede_crear_cuentas', label: 'Crear cuentas bancarias', categoria: 'Economía' },
    
    // 🏪 NEGOCIOS
    { key: 'puede_crear_negocios', label: 'Crear negocios', categoria: 'Negocios' },
    { key: 'puede_editar_negocios', label: 'Editar negocios', categoria: 'Negocios' },
    { key: 'puede_eliminar_negocios', label: 'Eliminar negocios', categoria: 'Negocios' },
    { key: 'puede_ver_negocios', label: 'Ver negocios', categoria: 'Negociios' },
    { key: 'puede_gestionar_stock', label: 'Gestionar stock', categoria: 'Negocios' },
    { key: 'puede_emitir_facturas', label: 'Emitir facturas', categoria: 'Negocios' },
    
    // 🚗 VEHÍCULOS
    { key: 'puede_ver_vehiculos', label: 'Ver vehículos', categoria: 'Vehículos' },
    { key: 'puede_crear_vehiculos', label: 'Crear vehículos', categoria: 'Vehículos' },
    { key: 'puede_editar_vehiculos', label: 'Editar vehículos', categoria: 'Vehículos' },
    { key: 'puede_eliminar_vehiculos', label: 'Eliminar vehículos', categoria: 'Vehículos' },
    { key: 'puede_transferir_vehiculos', label: 'Transferir vehículos', categoria: 'Vehículos' },
    
    // 🚔 POLICÍA / MDT
    { key: 'puede_ver_mdt', label: 'Ver MDT', categoria: 'Policía' },
    { key: 'puede_editar_mdt', label: 'Editar MDT', categoria: 'Policía' },
    { key: 'puede_emitir_multas', label: 'Emitir multas', categoria: 'Policía' },
    { key: 'puede_arrestar', label: 'Arrestar ciudadanos', categoria: 'Policía' },
    { key: 'puede_ver_citizen', label: 'Ver ciudadanos', categoria: 'Policía' },
    { key: 'puede_editar_citizen', label: 'Editar ciudadanos', categoria: 'Policía' },
    { key: 'puede_buscar_personas', label: 'Buscar personas', categoria: 'Policía' },
    
    // 🏥 MÉDICO
    { key: 'puede_ver_pacientes', label: 'Ver pacientes', categoria: 'Médico' },
    { key: 'puede_tratar_pacientes', label: 'Tratar pacientes', categoria: 'Médico' },
    { key: 'puede_emitir_recetas', label: 'Emitir recetas', categoria: 'Médico' },
    { key: 'puede_ver_historial', label: 'Ver historial médico', categoria: 'Médico' },
    
    // 📋 LICENCIAS
    { key: 'puede_emitir_licencias', label: 'Emitir licencias', categoria: 'Licencias' },
    { key: 'puede_revocar_licencias', label: 'Revocar licencias', categoria: 'Licencias' },
    { key: 'puede_ver_licencias', label: 'Ver licencias', categoria: 'Licencias' },
    
    // 📦 INVENTARIO
    { key: 'puede_gestionar_inventario', label: 'Gestionar inventario', categoria: 'Inventario' },
    { key: 'puede_ver_inventario', label: 'Ver inventario', categoria: 'Inventario' },
    { key: 'puede_crear_items', label: 'Crear items', categoria: 'Inventario' },
    { key: 'puede_transferir_items', label: 'Transferir items', categoria: 'Inventario' },
    
    // 🔍 AUDITORÍA
    { key: 'puede_ver_auditoria', label: 'Ver auditoría', categoria: 'Auditoría' },
    { key: 'puede_exportar_auditoria', label: 'Exportar auditoría', categoria: 'Auditoría' },
    { key: 'puede_limpiar_auditoria', label: 'Limpiar auditoría', categoria: 'Auditoría' },
    
    // ⚙️ ADMINISTRACIÓN
    { key: 'puede_gestionar_roles', label: 'Gestionar roles', categoria: 'Administración' },
    { key: 'puede_crear_roles', label: 'Crear roles', categoria: 'Administración' },
    { key: 'puede_editar_roles', label: 'Editar roles', categoria: 'Administración' },
    { key: 'puede_eliminar_roles', label: 'Eliminar roles', categoria: 'Administración' },
    { key: 'puede_ver_config', label: 'Ver configuración', categoria: 'Administración' },
    { key: 'puede_editar_config', label: 'Editar configuración', categoria: 'Administración' },
    
    // 🌐 SERVIDOR
    { key: 'puede_ver_logs', label: 'Ver logs del servidor', categoria: 'Servidor' },
    { key: 'puede_reiniciar_servidor', label: 'Reiniciar servidor', categoria: 'Servidor' },
    { key: 'puede_ver_estadisticas', label: 'Ver estadísticas', categoria: 'Servidor' },
    { key: 'puede_mantenimiento', label: 'Modo mantenimiento', categoria: 'Servidor' }
]

export default function RolesPage() {
    const { currentServer } = useAuthStore()
    const [roles, setRoles] = useState<RolPermiso[]>([])
    const [selected, setSelected] = useState<RolPermiso | null>(null)
    const [saving, setSaving] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newRole, setNewRole] = useState({ nombre_rol: '', color: '#3B82F6', jerarquia: 50 })

    useEffect(() => { fetchRoles() }, [])

    const fetchRoles = async () => {
        const { data } = await supabase.from('roles_permisos').select('*').eq('servidor_id', currentServer).order('jerarquia', { ascending: false })
        setRoles(data ?? [])
        if (data && data.length > 0 && !selected) setSelected(data[0])
    }

    const togglePerm = (key: keyof RolPermiso) => {
        if (!selected) return
        setSelected({ ...selected, [key]: !selected[key] })
    }

    const createRole = async () => {
        if (!newRole.nombre_rol.trim()) return toast.error('El nombre del rol es requerido')
        
        // Crear todos los permisos en false por defecto
        const roleData: Partial<RolPermiso> = {
            nombre_rol: newRole.nombre_rol.trim(),
            color: newRole.color,
            jerarquia: newRole.jerarquia,
            servidor_id: currentServer,
            ...Object.fromEntries(PERMISOS.map(p => [p.key, false]))
        }

        const { error } = await supabase.from('roles_permisos').insert(roleData)
        if (error) toast.error('Error al crear rol')
        else {
            toast.success('Rol creado exitosamente')
            setShowCreateModal(false)
            setNewRole({ nombre_rol: '', color: '#3B82F6', jerarquia: 50 })
            fetchRoles()
        }
    }

    const deleteRole = async (roleId: string) => {
        if (!confirm('¿Estás seguro de eliminar este rol?')) return
        
        const { error } = await supabase.from('roles_permisos').delete().eq('id', roleId)
        if (error) toast.error('Error al eliminar rol')
        else {
            toast.success('Rol eliminado')
            fetchRoles()
            if (selected?.id === roleId) setSelected(null)
        }
    }

    const save = async () => {
        if (!selected) return
        setSaving(true)
        const { error } = await supabase.from('roles_permisos').update(selected).eq('id', selected.id)
        if (error) toast.error('Error al guardar')
        else toast.success('Permisos guardados')
        setSaving(false)
    }    fetchRoles()
    }

    const updateColor = (color: string) => {
        if (!selected) return
        setSelected({ ...selected, color })
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestión de Roles</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Configura permisos por rol</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Role selector */}
                <div className="space-y-2">
                    {roles.map((r) => (
                        <motion.button key={r.id} onClick={() => setSelected(r)} className="w-full text-left px-4 py-3 rounded-xl font-bold text-[14px] transition-all"
                            style={{ background: selected?.id === r.id ? `${r.color}20` : 'var(--bg-card)', border: `1px solid ${selected?.id === r.id ? r.color : 'var(--border)'}`, color: selected?.id === r.id ? r.color : 'var(--text-secondary)' }}
                            whileHover={{ scale: 1.01 }}>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: r.color }} />
                                {r.nombre_rol.toUpperCase()}
                            </div>
                            <div className="text-[11px] mt-0.5 font-normal" style={{ color: 'var(--text-muted)' }}>Jerarquía: {r.jerarquia}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Permissions editor */}
                {selected && (
                    <motion.div className="md:col-span-2 rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-sm" style={{ background: selected.color }} />
                                <h3 className="font-bold text-[18px] uppercase">{selected.nombre_rol}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <label className="text-[11px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Color</label>
                                    <input type="color" value={selected.color} onChange={(e) => updateColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                                </div>
                                <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl font-bold text-[12px] uppercase disabled:opacity-50" style={{ background: 'var(--accent)', color: '#000' }}>
                                    {saving ? <i className="fa-solid fa-spinner fa-spin" /> : 'Guardar'}
                                </button>
                            </div>
                        </div>

                        {/* Permissions toggles */}
                        <div className="space-y-2">
                            {PERMISOS.map((p) => {
                                const enabled = selected[p.key] as boolean
                                return (
                                    <div key={p.key} onClick={() => togglePerm(p.key)}
                                        className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all"
                                        style={{ background: enabled ? 'rgba(0,217,255,0.05)' : 'var(--bg-hover)' }}>
                                        <span className="text-[14px] font-semibold" style={{ color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {p.label}
                                        </span>
                                        {/* Toggle */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-6 rounded-full transition-all" style={{ background: enabled ? 'var(--accent)' : 'var(--bg-card)', border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border)'}` }}>
                                                <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                                                    animate={{ x: enabled ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
