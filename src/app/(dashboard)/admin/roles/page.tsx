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
    { key: 'puede_ver_negocios', label: 'Ver negocios', categoria: 'Negocios' },
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
    { key: 'puede_agregar_items', label: 'Agregar items', categoria: 'Inventario' },
    { key: 'puede_eliminar_items', label: 'Eliminar items', categoria: 'Inventario' },
    
    // 🔍 AUDITORÍA
    { key: 'puede_ver_auditoria', label: 'Ver auditoría', categoria: 'Auditoría' },
    { key: 'puede_ver_logs', label: 'Ver logs', categoria: 'Auditoría' },
    { key: 'puede_exportar_datos', label: 'Exportar datos', categoria: 'Auditoría' },
    
    // ⚙️ ADMINISTRACIÓN
    { key: 'puede_gestionar_roles', label: 'Gestionar roles', categoria: 'Administración' },
    { key: 'puede_crear_roles', label: 'Crear roles', categoria: 'Administración' },
    { key: 'puede_editar_roles', label: 'Editar roles', categoria: 'Administración' },
    { key: 'puede_eliminar_roles', label: 'Eliminar roles', categoria: 'Administración' },
    { key: 'puede_ver_config', label: 'Ver configuración', categoria: 'Administración' },
    { key: 'puede_editar_config', label: 'Editar configuración', categoria: 'Administración' },
    
    // 🌐 SERVIDOR
    { key: 'puede_ver_consola', label: 'Ver consola', categoria: 'Servidor' },
    { key: 'puede_ejecutar_comandos', label: 'Ejecutar comandos', categoria: 'Servidor' },
    { key: 'puede_gestionar_plugins', label: 'Gestionar plugins', categoria: 'Servidor' },
    { key: 'puede_ver_recursos', label: 'Ver recursos', categoria: 'Servidor' }
]

export default function RolesPage() {
    const { currentServer } = useAuthStore()
    const [roles, setRoles] = useState<RolPermiso[]>([])
    const [selected, setSelected] = useState<RolPermiso | null>(null)
    const [saving, setSaving] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newRole, setNewRole] = useState({ nombre_rol: '', color: '#3B82F6', jerarquia: 50 })

    useEffect(() => { 
        if (currentServer) {
            fetchRoles() 
        } else {
            console.log('❌ No current server in useEffect')
        }
    }, [currentServer])

    const fetchRoles = async () => {
        console.log('🔍 Fetching roles...')
        console.log('📊 Current server:', currentServer)
        
        if (!currentServer) {
            console.log('❌ No current server - skipping fetch')
            setRoles([])
            return
        }
        
        try {
            const { data, error } = await supabase
                .from('roles_permisos')
                .select('*')
                .eq('servidor_id', currentServer)
                .order('jerarquia', { ascending: false })
            
            console.log('📋 Roles data:', data)
            console.log('⚠️ Roles error:', error)
            
            if (error) {
                console.error('Error fetching roles:', error)
                toast.error('Error al cargar roles: ' + error.message)
                setRoles([])
                return
            }
            
            setRoles(data ?? [])
            if (data && data.length > 0 && !selected) setSelected(data[0])
        } catch (err) {
            console.error('💥 Unexpected error fetching roles:', err)
            toast.error('Error inesperado al cargar roles')
            setRoles([])
        }
    }

    const togglePerm = (key: keyof RolPermiso) => {
        if (!selected) return
        setSelected({ ...selected, [key]: !selected[key] })
    }

    const createRole = async () => {
        if (!newRole.nombre_rol.trim()) return toast.error('El nombre del rol es requerido')
        
        // Crear todos los permisos en false por defecto
        const roleData: any = {
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
        
        console.log('🔍 Guardando rol...')
        console.log('📊 Rol a guardar:', selected)
        console.log('🆔 Rol ID:', selected.id)
        
        try {
            // Solo enviar los campos que existen en la tabla
            const updateData = {
                nombre_rol: selected.nombre_rol,
                color: selected.color,
                jerarquia: selected.jerarquia,
                servidor_id: selected.servidor_id,
                // Solo incluir permisos que existen en la interfaz
                ...Object.fromEntries(PERMISOS.map(p => [p.key, selected[p.key]]))
            }
            
            console.log('💾 Datos a actualizar:', updateData)
            
            const { data, error } = await supabase
                .from('roles_permisos')
                .update(updateData)
                .eq('id', selected.id)
            
            console.log('📋 Resultado data:', data)
            console.log('⚠️ Resultado error:', error)
            
            if (error) {
                console.error('Error al guardar rol:', error)
                toast.error('Error al guardar: ' + error.message)
            } else {
                console.log('✅ Rol guardado exitosamente')
                toast.success('Permisos guardados')
                fetchRoles() // Refrescar datos
            }
        } catch (err) {
            console.error('💥 Error inesperado al guardar:', err)
            toast.error('Error inesperado al guardar')
        }
        
        setSaving(false)
    }

    const updateColor = (color: string) => {
        if (!selected) return
        setSelected({ ...selected, color })
    }

    // Agrupar permisos por categoría
    const permisosPorCategoria = PERMISOS.reduce((acc, perm) => {
        if (!acc[perm.categoria]) acc[perm.categoria] = []
        acc[perm.categoria].push(perm)
        return acc
    }, {} as Record<string, typeof PERMISOS>)

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Roles</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {roles.length} roles configurados
                    </p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                    style={{ background: 'var(--accent)', color: '#000' }}
                >
                    <i className="fa-solid fa-plus" />
                    Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Roles */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <h3 className="font-bold text-sm mb-4">Roles</h3>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <motion.button
                                    key={role.id}
                                    onClick={() => setSelected(role)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        selected?.id === role.id ? 'ring-2' : ''
                                    }`}
                                    style={{
                                        background: selected?.id === role.id ? 'rgba(0,217,255,0.08)' : 'var(--bg-hover)',
                                        borderColor: selected?.id === role.id ? 'var(--accent)' : 'var(--border)',
                                        borderWidth: '1px'
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-sm">{role.nombre_rol}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                Jerarquía: {role.jerarquia}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: role.color }}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteRole(role.id)
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <i className="fa-solid fa-trash text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor de Permisos */}
                <div className="lg:col-span-2">
                    {selected ? (
                        <motion.div
                            className="rounded-xl p-6"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-6 h-6 rounded-full" 
                                        style={{ backgroundColor: selected.color }}
                                    />
                                    <div>
                                        <h2 className="text-xl font-bold">{selected.nombre_rol}</h2>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Jerarquía: {selected.jerarquia}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={save}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg font-bold text-sm"
                                    style={{ background: 'var(--accent)', color: '#000' }}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>

                            {/* Selector de Color */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Color del Rol</label>
                                <div className="flex gap-2">
                                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => updateColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 ${
                                                selected.color === color ? 'border-gray-900' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Permisos por Categoría */}
                            <div className="space-y-6">
                                {Object.entries(permisosPorCategoria).map(([categoria, permisos]) => (
                                    <div key={categoria}>
                                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                            {categoria === 'Usuarios' && '👤'}
                                            {categoria === 'Economía' && '🏦'}
                                            {categoria === 'Negocios' && '🏪'}
                                            {categoria === 'Vehículos' && '🚗'}
                                            {categoria === 'Policía' && '🚔'}
                                            {categoria === 'Médico' && '🏥'}
                                            {categoria === 'Licencias' && '📋'}
                                            {categoria === 'Inventario' && '📦'}
                                            {categoria === 'Auditoría' && '🔍'}
                                            {categoria === 'Administración' && '⚙️'}
                                            {categoria === 'Servidor' && '🌐'}
                                            {categoria}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {permisos.map((perm) => (
                                                <label
                                                    key={perm.key}
                                                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50"
                                                    style={{ background: 'var(--bg-hover)' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected[perm.key] as boolean}
                                                        onChange={() => togglePerm(perm.key)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">{perm.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <i className="fa-solid fa-user-shield text-4xl mb-4" style={{ color: 'var(--text-muted)' }} />
                            <p className="font-medium">Selecciona un rol para editar sus permisos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Rol */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3 className="text-xl font-bold mb-4">Crear Nuevo Rol</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre del Rol</label>
                                <input
                                    type="text"
                                    value={newRole.nombre_rol}
                                    onChange={(e) => setNewRole({ ...newRole, nombre_rol: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Ej: Moderador"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jerarquía (1-100)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newRole.jerarquia}
                                    onChange={(e) => setNewRole({ ...newRole, jerarquia: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Color</label>
                                <div className="flex gap-2">
                                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setNewRole({ ...newRole, color })}
                                            className={`w-8 h-8 rounded-full border-2 ${
                                                newRole.color === color ? 'border-gray-900' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={createRole}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                                    style={{ background: 'var(--accent)', color: '#000' }}
                                >
                                    Crear Rol
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
