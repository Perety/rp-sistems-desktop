'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Radio, RadioPermiso } from '@/types/radios'

export default function RadiosAdminPage() {
    const { currentServer } = useAuthStore()
    const [radios, setRadios] = useState<Radio[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [selectedRadio, setSelectedRadio] = useState<Radio | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [permisos, setPermisos] = useState<RadioPermiso[]>([])

    // Formulario para crear/editar radio
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        frecuencia: '',
        tipo: 'publica' as 'publica' | 'privada' | 'emergencia',
        max_usuarios: 50,
        es_emergencia: false,
        prioridad: 1
    })

    // Permisos para la radio seleccionada
    const [radioPermisos, setRadioPermisos] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (currentServer) {
            cargarRadios()
            cargarRoles()
        }
    }, [currentServer])

    const cargarRadios = async () => {
        try {
            const { data, error } = await supabase
                .from('radios')
                .select('*')
                .eq('servidor_id', currentServer)
                .order('prioridad', { ascending: false })

            if (error) throw error
            setRadios(data || [])
        } catch (error) {
            console.error('Error cargando radios:', error)
            toast.error('Error al cargar radios')
        }
    }

    const cargarRoles = async () => {
        try {
            const { data, error } = await supabase
                .from('roles_permisos')
                .select('id, nombre_rol')
                .eq('servidor_id', currentServer)
                .order('jerarquia', { ascending: false })

            if (error) throw error
            setRoles(data || [])
        } catch (error) {
            console.error('Error cargando roles:', error)
            toast.error('Error al cargar roles')
        }
    }

    const cargarPermisosRadio = async (radioId: string) => {
        try {
            const { data, error } = await supabase
                .from('radio_permisos')
                .select('*')
                .eq('radio_id', radioId)

            if (error) throw error

            // Convertir a formato fácil de usar
            const permisosMap: Record<string, boolean> = {}
            data?.forEach(perm => {
                permisosMap[perm.rol_id] = perm.puede_unirse
            })

            setRadioPermisos(permisosMap)
            setPermisos(data || [])
        } catch (error) {
            console.error('Error cargando permisos de radio:', error)
        }
    }

    const crearRadio = async () => {
        if (!formData.nombre.trim()) {
            return toast.error('El nombre es requerido')
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('radios')
                .insert({
                    ...formData,
                    servidor_id: currentServer
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Radio creada exitosamente')
            setShowCreateModal(false)
            setFormData({
                nombre: '',
                descripcion: '',
                frecuencia: '',
                tipo: 'publica',
                max_usuarios: 50,
                es_emergencia: false,
                prioridad: 1
            })
            cargarRadios()
        } catch (error) {
            console.error('Error creando radio:', error)
            toast.error('Error al crear radio')
        }
        setLoading(false)
    }

    const eliminarRadio = async (radioId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta radio?')) return

        try {
            const { error } = await supabase
                .from('radios')
                .delete()
                .eq('id', radioId)

            if (error) throw error

            toast.success('Radio eliminada')
            cargarRadios()
            if (selectedRadio?.id === radioId) {
                setSelectedRadio(null)
            }
        } catch (error) {
            console.error('Error eliminando radio:', error)
            toast.error('Error al eliminar radio')
        }
    }

    const togglePermiso = (rolId: string) => {
        setRadioPermisos(prev => ({
            ...prev,
            [rolId]: !prev[rolId]
        }))
    }

    const guardarPermisos = async () => {
        if (!selectedRadio) return

        setLoading(true)
        try {
            // Eliminar permisos existentes
            await supabase
                .from('radio_permisos')
                .delete()
                .eq('radio_id', selectedRadio.id)

            // Insertar nuevos permisos
            const nuevosPermisos = Object.entries(radioPermisos)
                .filter(([_, puede]) => puede)
                .map(([rolId]) => ({
                    radio_id: selectedRadio.id,
                    rol_id: rolId,
                    servidor_id: currentServer,
                    puede_unirse: true,
                    puede_hablar: true,
                    es_admin: false
                }))

            if (nuevosPermisos.length > 0) {
                const { error } = await supabase
                    .from('radio_permisos')
                    .insert(nuevosPermisos)

                if (error) throw error
            }

            toast.success('Permisos guardados')
            cargarPermisosRadio(selectedRadio.id)
        } catch (error) {
            console.error('Error guardando permisos:', error)
            toast.error('Error al guardar permisos')
        }
        setLoading(false)
    }

    const seleccionarRadio = (radio: Radio) => {
        setSelectedRadio(radio)
        cargarPermisosRadio(radio.id)
    }

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'publica': return '#10B981'
            case 'privada': return '#F59E0B'
            case 'emergencia': return '#EF4444'
            default: return '#6B7280'
        }
    }

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'publica': return 'Pública'
            case 'privada': return 'Privada'
            case 'emergencia': return 'Emergencia'
            default: return tipo
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Radios</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {radios.length} radios configuradas
                    </p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase"
                    style={{ background: 'var(--accent)', color: '#000' }}
                >
                    <i className="fa-solid fa-plus" />
                    Nueva Radio
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Radios */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <h3 className="font-bold text-sm mb-4">Radios</h3>
                        <div className="space-y-2">
                            {radios.map((radio) => (
                                <motion.button
                                    key={radio.id}
                                    onClick={() => seleccionarRadio(radio)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        selectedRadio?.id === radio.id ? 'ring-2' : ''
                                    }`}
                                    style={{
                                        background: selectedRadio?.id === radio.id ? 'var(--accent)' : 'var(--bg-hover)',
                                        color: selectedRadio?.id === radio.id ? '#000' : 'var(--text-primary)',
                                        border: selectedRadio?.id === radio.id ? '2px solid var(--accent)' : 'none'
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{radio.nombre}</div>
                                            <div className="text-xs opacity-75">{radio.frecuencia}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span 
                                                className="text-xs px-2 py-1 rounded"
                                                style={{ 
                                                    background: getTipoColor(radio.tipo),
                                                    color: '#fff'
                                                }}
                                            >
                                                {getTipoLabel(radio.tipo)}
                                            </span>
                                            {radio.es_emergencia && (
                                                <i className="fa-solid fa-exclamation-triangle text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detalles y Permisos */}
                <div className="lg:col-span-2">
                    {selectedRadio ? (
                        <div className="space-y-6">
                            {/* Detalles de la Radio */}
                            <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">{selectedRadio.nombre}</h3>
                                    <button
                                        onClick={() => eliminarRadio(selectedRadio.id)}
                                        className="px-3 py-1 rounded-lg text-sm"
                                        style={{ background: '#EF4444', color: '#fff' }}
                                    >
                                        <i className="fa-solid fa-trash mr-2" />
                                        Eliminar
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Frecuencia:</span>
                                        <div>{selectedRadio.frecuencia}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium">Tipo:</span>
                                        <div>{getTipoLabel(selectedRadio.tipo)}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium">Máx. Usuarios:</span>
                                        <div>{selectedRadio.max_usuarios}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium">Prioridad:</span>
                                        <div>{selectedRadio.prioridad}</div>
                                    </div>
                                </div>
                                
                                {selectedRadio.descripcion && (
                                    <div className="mt-4">
                                        <span className="font-medium text-sm">Descripción:</span>
                                        <div className="text-sm mt-1">{selectedRadio.descripcion}</div>
                                    </div>
                                )}
                            </div>

                            {/* Permisos por Rol */}
                            <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Permisos por Rol</h3>
                                    <button
                                        onClick={guardarPermisos}
                                        disabled={loading}
                                        className="px-4 py-2 rounded-lg font-bold text-sm"
                                        style={{ background: 'var(--accent)', color: '#000' }}
                                    >
                                        {loading ? 'Guardando...' : 'Guardar Permisos'}
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {roles.map((rol) => (
                                        <div key={rol.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={radioPermisos[rol.id] || false}
                                                    onChange={() => togglePermiso(rol.id)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="font-medium">{rol.nombre_rol}</span>
                                            </div>
                                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {radioPermisos[rol.id] ? 'Puede unirse' : 'No puede unirse'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <i className="fa-solid fa-radio text-4xl mb-4" style={{ color: 'var(--text-muted)' }} />
                            <h3 className="font-bold text-lg mb-2">Selecciona una Radio</h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Elige una radio de la lista para ver sus detalles y configurar permisos
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Radio */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div 
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h3 className="font-bold text-lg mb-4">Crear Nueva Radio</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    placeholder="Ej: Radio Principal"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    placeholder="Descripción de la radio..."
                                    rows={3}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Frecuencia</label>
                                <input
                                    type="text"
                                    value={formData.frecuencia}
                                    onChange={(e) => setFormData({...formData, frecuencia: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    placeholder="Ej: 101.5, POL-1"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                                    className="w-full px-3 py-2 rounded-lg"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                    <option value="publica">Pública</option>
                                    <option value="privada">Privada</option>
                                    <option value="emergencia">Emergencia</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Máx. Usuarios</label>
                                    <input
                                        type="number"
                                        value={formData.max_usuarios}
                                        onChange={(e) => setFormData({...formData, max_usuarios: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 rounded-lg"
                                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        min="1"
                                        max="100"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prioridad</label>
                                    <select
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({...formData, prioridad: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 rounded-lg"
                                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value={1}>Baja</option>
                                        <option value={2}>Media</option>
                                        <option value={3}>Alta</option>
                                        <option value={4}>Muy Alta</option>
                                        <option value={5}>Emergencia</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.es_emergencia}
                                    onChange={(e) => setFormData({...formData, es_emergencia: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-medium">Radio de Emergencia</label>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearRadio}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg font-bold"
                                style={{ background: 'var(--accent)', color: '#000' }}
                            >
                                {loading ? 'Creando...' : 'Crear Radio'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
