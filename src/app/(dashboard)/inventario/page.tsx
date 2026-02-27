'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'

interface InventarioItem {
    id: string
    producto_id: string
    cantidad: number
    estado: string
    imagen_id?: string
    imagen_url?: string
    producto: {
        id: string
        nombre: string
        descripcion: string
        categoria: string
        precio: number
        imagen_id?: string
        imagen_url?: string
    }
    fecha_adquisicion: string
}

interface Transferencia {
    id: string
    usuario_origen_id: string
    usuario_destino_id: string
    producto_id: string
    cantidad: number
    concepto?: string
    estado: string
    created_at: string
    producto: {
        nombre: string
        imagen_url?: string
    }
    origen_usuario: {
        nombre: string
        username: string
    }
}

export default function InventarioPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [inventario, setInventario] = useState<InventarioItem[]>([])
    const [transferenciasEnviadas, setTransferenciasEnviadas] = useState<Transferencia[]>([])
    const [transferenciasRecibidas, setTransferenciasRecibidas] = useState<Transferencia[]>([])
    const [loading, setLoading] = useState(true)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null)

    const [transferForm, setTransferForm] = useState({
        usuario_destino: '',
        cantidad: 1,
        concepto: ''
    })

    useEffect(() => {
        if (!currentServer) return
        fetchInventario()
        fetchTransferencias()
    }, [currentServer])

    const fetchInventario = async () => {
        const { data, error } = await supabase
            .from('inventario_con_imagenes')
            .select('*')
            .eq('usuario_id', currentUser?.id)
            .eq('servidor_id', currentServer)

        if (error) {
            toast.error('Error al cargar inventario')
        } else {
            setInventario(data || [])
        }
        setLoading(false)
    }

    const fetchTransferencias = async () => {
        const [enviadas, recibidas] = await Promise.all([
            supabase
                .from('transferencias_inventario')
                .select(`
                    *,
                    producto:productos(nombre, imagen_url),
                    origen_usuario:usuarios!usuario_origen_id(nombre, username)
                `)
                .eq('usuario_origen_id', currentUser?.id)
                .eq('servidor_id', currentServer)
                .order('created_at', { ascending: false }),
            
            supabase
                .from('transferencias_inventario')
                .select(`
                    *,
                    producto:productos(nombre, imagen_url),
                    destino_usuario:usuarios!usuario_destino_id(nombre, username)
                `)
                .eq('usuario_destino_id', currentUser?.id)
                .eq('servidor_id', currentServer)
                .order('created_at', { ascending: false })
        ])

        setTransferenciasEnviadas(enviadas.data || [])
        setTransferenciasRecibidas(recibidas.data || [])
    }

    const handleTransfer = async () => {
        if (!selectedItem || !transferForm.usuario_destino || transferForm.cantidad <= 0) {
            return toast.error('Completa todos los campos')
        }

        if (transferForm.cantidad > selectedItem.cantidad) {
            return toast.error('No tienes suficientes items')
        }

        // Buscar usuario destino
        const { data: usuarioDestino } = await supabase
            .from('usuarios')
            .select('id')
            .eq('username', transferForm.usuario_destino.trim())
            .single()

        if (!usuarioDestino) {
            return toast.error('Usuario no encontrado')
        }

        // Crear transferencia
        const { error } = await supabase.rpc('transferir_item_inventario', {
            p_usuario_origen_id: currentUser?.id,
            p_usuario_destino_id: usuarioDestino.id,
            p_producto_id: selectedItem.producto.id,
            p_cantidad: transferForm.cantidad,
            p_concepto: transferForm.concepto || null,
            p_servidor_id: currentServer
        })

        if (error) {
            toast.error('Error al crear transferencia')
        } else {
            toast.success('Transferencia enviada exitosamente')
            setShowTransferModal(false)
            setTransferForm({ usuario_destino: '', cantidad: 1, concepto: '' })
            setSelectedItem(null)
            fetchInventario()
            fetchTransferencias()
        }
    }

    const handleAcceptTransfer = async (transferenciaId: string) => {
        const { error } = await supabase.rpc('aceptar_transferencia_inventario', {
            p_transferencia_id: transferenciaId,
            p_usuario_responde_id: currentUser?.id
        })

        if (error) {
            toast.error('Error al aceptar transferencia')
        } else {
            toast.success('Transferencia aceptada')
            fetchInventario()
            fetchTransferencias()
        }
    }

    const handleRejectTransfer = async (transferenciaId: string) => {
        const { error } = await supabase.rpc('rechazar_transferencia_inventario', {
            p_transferencia_id: transferenciaId,
            p_usuario_responde_id: currentUser?.id
        })

        if (error) {
            toast.error('Error al rechazar transferencia')
        } else {
            toast.success('Transferencia rechazada')
            fetchTransferencias()
        }
    }

    const handleImageUpload = async (imageUrl: string, imageId: string) => {
        if (!selectedItem) return

        const { error } = await supabase
            .from('inventario_usuario')
            .update({ imagen_id: imageId || null })
            .eq('id', selectedItem.id)

        if (error) {
            toast.error('Error al actualizar imagen')
        } else {
            toast.success('Imagen actualizada')
            fetchInventario()
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando inventario...</div>
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Mi Inventario</h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Gestiona tus objetos y transfiérelos a otros usuarios
                </p>
            </motion.div>

            {/* Inventario */}
            <motion.div
                className="rounded-xl p-6 mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 className="text-xl font-bold mb-4">Mis Objetos</h2>
                {inventario.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        No tienes objetos en tu inventario
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {inventario.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className="rounded-lg overflow-hidden group"
                                style={{ background: 'var(--bg-hover)' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {/* Imagen del item */}
                                <div className="h-32 flex items-center justify-center relative">
                                    {item.imagen_url ? (
                                        <img
                                            src={item.imagen_url}
                                            alt={item.producto.nombre}
                                            className="w-full h-full object-cover"
                                            style={{ background: 'transparent' }}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: '#000' }}>
                                            <i className="fa-solid fa-box text-2xl" />
                                        </div>
                                    )}
                                    
                                    {/* Overlay con acciones */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item)
                                                setShowTransferModal(true)
                                            }}
                                            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                                            title="Transferir"
                                        >
                                            <i className="fa-solid fa-paper-plane text-sm" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item)
                                                // Abrir modal de imagen
                                            }}
                                            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                                            title="Cambiar imagen"
                                        >
                                            <i className="fa-solid fa-camera text-sm" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-3">
                                    <h3 className="font-bold text-sm mb-1">{item.producto.nombre}</h3>
                                    <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                        {item.producto.descripcion}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium">
                                            Cantidad: {item.cantidad}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded" style={{ 
                                            background: item.estado === 'disponible' ? 'rgba(46,213,115,0.1)' : 'rgba(255,165,2,0.1)',
                                            color: item.estado === 'disponible' ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {item.estado}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Transferencias Enviadas */}
            <motion.div
                className="rounded-xl p-6 mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="text-xl font-bold mb-4">Transferencias Enviadas</h2>
                {transferenciasEnviadas.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        No has enviado transferencias
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transferenciasEnviadas.map(transfer => (
                            <div key={transfer.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                <div className="flex items-center gap-3">
                                    {transfer.producto.imagen_url ? (
                                        <img
                                            src={transfer.producto.imagen_url}
                                            alt={transfer.producto.nombre}
                                            className="w-10 h-10 rounded object-cover"
                                            style={{ background: 'transparent' }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: 'var(--accent)', color: '#000' }}>
                                            <i className="fa-solid fa-box text-sm" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{transfer.producto.nombre}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Para: {transfer.origen_usuario?.nombre} (@{transfer.origen_usuario?.username})
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{transfer.cantidad}x</p>
                                    <span className="text-xs px-2 py-1 rounded" style={{ 
                                        background: transfer.estado === 'pendiente' ? 'rgba(255,165,2,0.1)' : 
                                                   transfer.estado === 'aceptada' ? 'rgba(46,213,115,0.1)' : 'rgba(255,71,87,0.1)',
                                        color: transfer.estado === 'pendiente' ? 'var(--warning)' : 
                                               transfer.estado === 'aceptada' ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        {transfer.estado}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Transferencias Recibidas */}
            <motion.div
                className="rounded-xl p-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-xl font-bold mb-4">Transferencias Recibidas</h2>
                {transferenciasRecibidas.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        No tienes transferencias pendientes
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transferenciasRecibidas.map(transfer => (
                            <div key={transfer.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                <div className="flex items-center gap-3">
                                    {transfer.producto.imagen_url ? (
                                        <img
                                            src={transfer.producto.imagen_url}
                                            alt={transfer.producto.nombre}
                                            className="w-10 h-10 rounded object-cover"
                                            style={{ background: 'transparent' }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: 'var(--accent)', color: '#000' }}>
                                            <i className="fa-solid fa-box text-sm" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{transfer.producto.nombre}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            De: {transfer.concepto || 'Sin concepto'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{transfer.cantidad}x</span>
                                    {transfer.estado === 'pendiente' && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleAcceptTransfer(transfer.id)}
                                                className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleRejectTransfer(transfer.id)}
                                                className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                    {transfer.estado !== 'pendiente' && (
                                        <span className="text-xs px-2 py-1 rounded" style={{ 
                                            background: transfer.estado === 'aceptada' ? 'rgba(46,213,115,0.1)' : 'rgba(255,71,87,0.1)',
                                            color: transfer.estado === 'aceptada' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {transfer.estado}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Modal de Transferencia */}
            {showTransferModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">Transferir Objeto</h2>
                        
                        {/* Vista previa del objeto */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                            {selectedItem.imagen_url ? (
                                <img
                                    src={selectedItem.imagen_url}
                                    alt={selectedItem.producto.nombre}
                                    className="w-12 h-12 rounded object-cover"
                                    style={{ background: 'transparent' }}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: 'var(--accent)', color: '#000' }}>
                                    <i className="fa-solid fa-box" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{selectedItem.producto.nombre}</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Disponible: {selectedItem.cantidad}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Usuario Destino</label>
                                <input
                                    type="text"
                                    value={transferForm.usuario_destino}
                                    onChange={(e) => setTransferForm({...transferForm, usuario_destino: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Username del usuario"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedItem.cantidad}
                                    value={transferForm.cantidad}
                                    onChange={(e) => setTransferForm({...transferForm, cantidad: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Concepto (opcional)</label>
                                <input
                                    type="text"
                                    value={transferForm.concepto}
                                    onChange={(e) => setTransferForm({...transferForm, concepto: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="¿Por qué lo transfieres?"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleTransfer}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Enviar Transferencia
                            </button>
                            <button
                                onClick={() => {
                                    setShowTransferModal(false)
                                    setSelectedItem(null)
                                    setTransferForm({ usuario_destino: '', cantidad: 1, concepto: '' })
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
