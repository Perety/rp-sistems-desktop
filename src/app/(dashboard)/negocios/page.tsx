'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Negocio, NegocioEmpleado, NegocioStock, Usuario } from '@/types'

export default function NegociosPage() {
    const { currentUser, currentServer } = useAuthStore()
    const isSuperAdmin = currentUser?.rol === 'superadmin'
    const [items, setItems] = useState<Negocio[]>([])
    const [selected, setSelected] = useState<Negocio | null>(null)
    const [empleados, setEmpleados] = useState<NegocioEmpleado[]>([])
    const [stock, setStock] = useState<NegocioStock[]>([])
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState({ nombre: '', tipo: 'general', descripcion: '', direccion: '' })
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
    const [addEmployeeForm, setAddEmployeeForm] = useState({
        usuario_id: '',
        rol_negocio: 'empleado',
        salario: 1500
    })
    const [allUsuarios, setAllUsuarios] = useState<Usuario[]>([])
    const [tab, setTab] = useState<'info' | 'stock' | 'empleados'>('info')

    useEffect(() => { 
        fetchData() 
        fetchUsuarios()
    }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('negocios').select('*').eq('servidor_id', currentServer).order('created_at', { ascending: false })
        setItems(data ?? [])
    }

    const fetchUsuarios = async () => {
        const { data } = await supabase.from('usuarios').select('*').eq('servidor_id', currentServer).eq('activo', true)
        setAllUsuarios(data || [])
    }

    const canManageBusiness = (negocio: Negocio) => {
        return isSuperAdmin || negocio.dueno_personaje_id === currentUser?.id
    }

    const loadDetails = async (n: Negocio) => {
        setSelected(n)
        const [{ data: e }, { data: s }] = await Promise.all([
            supabase.from('negocio_empleados').select('*').eq('negocio_id', n.id),
            supabase.from('negocio_stock').select('*').eq('negocio_id', n.id),
        ])
        setEmpleados(e ?? [])
        setStock(s ?? [])
    }

    const submit = async () => {
        if (!form.nombre) return toast.error('El nombre es requerido')
        const { error } = await supabase.from('negocios').insert({ ...form, servidor_id: currentServer })
        if (error) return toast.error('Error al crear')
        await supabase.from('auditoria').insert({ servidor_id: currentServer, usuario_id: currentUser?.id, usuario_nombre: currentUser?.nombre, accion: 'Negocio Creado', modulo: 'negocios', descripcion: form.nombre })
        toast.success('Negocio creado')
        setModal(false)
        setForm({ nombre: '', tipo: 'general', descripcion: '', direccion: '' })
        fetchData()
    }

    const handleAddEmployee = async () => {
        if (!selected || !addEmployeeForm.usuario_id) {
            return toast.error('Selecciona un usuario')
        }

        // Verificar si ya es empleado
        const { data: existingEmployee } = await supabase
            .from('negocio_empleados')
            .select('*')
            .eq('negocio_id', selected.id)
            .eq('personaje_id', addEmployeeForm.usuario_id)
            .single()

        if (existingEmployee) {
            return toast.error('Este usuario ya es empleado del negocio')
        }

        const { error } = await supabase
            .from('negocio_empleados')
            .insert({
                negocio_id: selected.id,
                personaje_id: addEmployeeForm.usuario_id,
                rol_negocio: addEmployeeForm.rol_negocio,
                salario: addEmployeeForm.salario
            })

        if (error) {
            toast.error('Error al añadir empleado')
        } else {
            toast.success('Empleado añadido exitosamente')
            setShowAddEmployeeModal(false)
            setAddEmployeeForm({
                usuario_id: '',
                rol_negocio: 'empleado',
                salario: 1500
            })
            loadDetails(selected)
        }
    }

    const tipoIcons: Record<string, string> = { restaurante: 'fa-utensils', mecanico: 'fa-wrench', tienda: 'fa-store', farmacia: 'fa-kit-medical', general: 'fa-briefcase' }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Negocios</h1>
                    <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Gestión de negocios del servidor
                    </p>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                        <i className="fa-solid fa-plus" />Crear Negocio
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* List */}
                <div className="space-y-3">
                    {items.map((n, i) => (
                        <motion.button key={n.id} onClick={() => loadDetails(n)} className="w-full text-left rounded-xl p-4 transition-all"
                            style={{ background: 'var(--bg-card)', border: `1px solid ${selected?.id === n.id ? 'var(--accent)' : 'var(--border)'}` }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,217,255,0.1)', color: 'var(--accent)' }}>
                                    <i className={`fa-solid ${tipoIcons[n.tipo] || 'fa-briefcase'}`} />
                                </div>
                                <div>
                                    <div className="font-bold text-[14px]">{n.nombre}</div>
                                    <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{n.tipo} {n.activo ? '' : '· Inactivo'}</div>
                                </div>
                            </div>
                            <div className="mt-3 text-right">
                                <span className="font-bold text-[16px]" style={{ color: '#2ed573' }}>{formatCurrency(n.dinero_caja)}</span>
                                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>en caja</div>
                            </div>
                        </motion.button>
                    ))}
                    {items.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin negocios</div>}
                </div>

                {/* Detail */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div key={selected.id} className="rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                                {/* Header */}
                                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[20px]">{selected.nombre}</h3>
                                        <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', fontSize: '20px' }}>×</button>
                                    </div>
                                    <div className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>{selected.descripcion || selected.tipo}</div>
                                    {selected.direccion && <div className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-location-dot mr-1" />{selected.direccion}</div>}
                                </div>
                                {/* Tabs */}
                                <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                                    {(['info', 'stock', 'empleados'] as const).map((t) => (
                                        <button key={t} onClick={() => setTab(t)} className="flex-1 py-3 font-bold text-[12px] uppercase transition-all"
                                            style={{ borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-5">
                                    {tab === 'info' && (
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, rgba(46,213,115,0.1), rgba(0,217,255,0.08))' }}>
                                                <div className="text-4xl font-bold" style={{ color: '#2ed573' }}>{formatCurrency(selected.dinero_caja)}</div>
                                                <div className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>Capital en Caja</div>
                                            </div>
                                        </div>
                                    )}
                                    {tab === 'stock' && (
                                        <div className="space-y-2">
                                            {stock.map((s) => (
                                                <div key={s.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <div><div className="font-bold text-[13px]">{s.item_nombre}</div><div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Compra: {formatCurrency(s.precio_compra)} · Venta: {formatCurrency(s.precio_venta)}</div></div>
                                                    <Badge variant={s.cantidad > 10 ? 'success' : s.cantidad > 0 ? 'warning' : 'danger'}>{s.cantidad} uds</Badge>
                                                </div>
                                            ))}
                                            {stock.length === 0 && <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin stock</p>}
                                        </div>
                                    )}
                                    {tab === 'empleados' && (
                                        <div className="space-y-2">
                                            {canManageBusiness(selected) && (
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Empleados actuales</span>
                                                    <button
                                                        onClick={() => setShowAddEmployeeModal(true)}
                                                        className="px-3 py-1 rounded-lg text-[11px] font-medium"
                                                        style={{ background: 'var(--accent)', color: '#fff' }}
                                                    >
                                                        <i className="fa-solid fa-plus mr-1" />Añadir Empleado
                                                    </button>
                                                </div>
                                            )}
                                            {empleados.map((e) => (
                                                <div key={e.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <div><div className="font-bold text-[13px]">{e.personaje_id}</div><div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{e.rol_negocio}</div></div>
                                                    <span className="font-bold" style={{ color: '#2ed573' }}>{formatCurrency(e.salario)}</span>
                                                </div>
                                            ))}
                                            {empleados.length === 0 && <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin empleados</p>}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" className="rounded-xl flex flex-col items-center justify-center p-16" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                                <i className="fa-solid fa-briefcase text-4xl mb-3" style={{ color: 'var(--text-muted)' }} />
                                <p style={{ color: 'var(--text-muted)' }}>Selecciona un negocio</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title="Crear Negocio">
                <div className="space-y-4">
                    <div><label>Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
                    <div>
                        <label>Tipo</label>
                        <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                            {['general', 'restaurante', 'mecanico', 'tienda', 'farmacia'].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div><label>Descripción</label><textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} /></div>
                    <div><label>Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} /></div>
                    <button onClick={submit} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>Crear</button>
                </div>
            </Modal>

            {showAddEmployeeModal && selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">Añadir Empleado - {selected.nombre}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Usuario</label>
                                <select
                                    value={addEmployeeForm.usuario_id}
                                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, usuario_id: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="">Selecciona un usuario</option>
                                    {allUsuarios
                                        .filter(u => !empleados.some(e => e.personaje_id === u.id))
                                        .map(usuario => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {usuario.nombre} (@{usuario.username})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Rol en Negocio</label>
                                <select
                                    value={addEmployeeForm.rol_negocio}
                                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, rol_negocio: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="empleado">Empleado</option>
                                    <option value="gerente">Gerente</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="cajero">Cajero</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Salario</label>
                                <input
                                    type="number"
                                    value={addEmployeeForm.salario}
                                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, salario: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddEmployee}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Añadir Empleado
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddEmployeeModal(false)
                                    setAddEmployeeForm({
                                        usuario_id: '',
                                        rol_negocio: 'empleado',
                                        salario: 1500
                                    })
                                }}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
