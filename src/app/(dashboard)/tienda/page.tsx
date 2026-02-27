'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface Producto {
    id: string
    nombre: string
    descripcion: string
    categoria: string
    precio: number
    stock: number
    imagen_url?: string
    activo: boolean
}

interface InventarioItem {
    id: string
    producto_id: string
    cantidad: number
    estado: string
    producto: Producto
    fecha_adquisicion: string
}

export default function TiendaPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [productos, setProductos] = useState<Producto[]>([])
    const [inventario, setInventario] = useState<InventarioItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('todos')
    const [showInventario, setShowInventario] = useState(false)

    const categories = ['todos', 'tecnologia', 'equipamiento', 'medico', 'herramientas']

    useEffect(() => {
        if (!currentServer) return
        fetchProductos()
        fetchInventario()
    }, [currentServer])

    const fetchProductos = async () => {
        const { data, error } = await supabase
            .from('productos_con_imagenes')
            .select('*')
            .eq('servidor_id', currentServer)
            .eq('activo', true)
            .order('nombre')

        if (error) {
            toast.error('Error al cargar productos')
        } else {
            setProductos(data || [])
        }
        setLoading(false)
    }

    const fetchInventario = async () => {
        const { data, error } = await supabase
            .from('inventario_usuario')
            .select(`
                *,
                producto:productos(*)
            `)
            .eq('usuario_id', currentUser?.id)
            .eq('servidor_id', currentServer)

        if (error) {
            console.error('Error al cargar inventario:', error)
        } else {
            setInventario(data || [])
        }
    }

    const handleCompra = async (producto: Producto) => {
        if (!currentUser?.id) return

        // Verificar stock
        if (producto.stock !== -1 && producto.stock <= 0) {
            return toast.error('Producto sin stock disponible')
        }

        // Obtener cuenta bancaria del usuario
        const { data: cuenta } = await supabase
            .from('cuentas_bancarias')
            .select('dinero_banco')
            .eq('usuario_id', currentUser.id)
            .eq('servidor_id', currentServer)
            .single()

        if (!cuenta || cuenta.dinero_banco < producto.precio) {
            return toast.error('Saldo insuficiente en cuenta bancaria')
        }

        // Realizar compra
        const { error: compraError } = await supabase
            .from('transacciones_tienda')
            .insert({
                usuario_id: currentUser.id,
                producto_id: producto.id,
                cantidad: 1,
                precio_unitario: producto.precio,
                precio_total: producto.precio,
                metodo_pago: 'banco',
                servidor_id: currentServer
            })

        if (compraError) {
            toast.error('Error al procesar compra')
            return
        }

        // Descontar dinero de la cuenta
        const { error: dineroError } = await supabase
            .from('cuentas_bancarias')
            .update({
                dinero_banco: cuenta.dinero_banco - producto.precio
            })
            .eq('usuario_id', currentUser.id)
            .eq('servidor_id', currentServer)

        if (dineroError) {
            toast.error('Error al actualizar saldo')
            return
        }

        // Añadir al inventario
        const { error: inventarioError } = await supabase
            .from('inventario_usuario')
            .upsert({
                usuario_id: currentUser.id,
                producto_id: producto.id,
                cantidad: 1,
                servidor_id: currentServer
            }, {
                onConflict: 'usuario_id,producto_id,servidor_id',
                ignoreDuplicates: false
            })

        if (inventarioError) {
            // Si ya existe, incrementar cantidad
            await supabase.rpc('incrementar_inventario', {
                p_usuario_id: currentUser.id,
                p_producto_id: producto.id,
                p_servidor_id: currentServer,
                p_cantidad: 1
            })
        }

        // Actualizar stock si es limitado
        if (producto.stock !== -1) {
            await supabase
                .from('productos')
                .update({
                    stock: producto.stock - 1
                })
                .eq('id', producto.id)
        }

        toast.success(`¡${producto.nombre} comprado exitosamente!`)
        fetchProductos()
        fetchInventario()
    }

    const filteredProductos = selectedCategory === 'todos' 
        ? productos 
        : productos.filter(p => p.categoria === selectedCategory)

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando tienda...</div>
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Tienda</h1>
                        <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Compra productos para mejorar tu experiencia
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInventario(!showInventario)}
                        className="px-4 py-2 rounded-xl font-bold text-[12px] uppercase"
                        style={{ 
                            background: showInventario ? 'var(--accent)' : 'var(--bg-hover)', 
                            color: showInventario ? '#000' : 'var(--text-primary)' 
                        }}
                    >
                        <i className="fa-solid fa-box mr-2" />
                        Mi Inventario ({inventario.length})
                    </button>
                </div>
            </motion.div>

            {/* Filtros */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex gap-2 flex-wrap">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                            style={{
                                background: selectedCategory === category ? 'var(--accent)' : 'var(--bg-hover)',
                                color: selectedCategory === category ? '#000' : 'var(--text-primary)'
                            }}
                        >
                            {category === 'todos' ? 'Todos' : category}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Inventario */}
            {showInventario && (
                <motion.div
                    className="rounded-xl p-6 mb-6"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-bold mb-4">Mi Inventario</h2>
                    {inventario.length === 0 ? (
                        <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                            No tienes productos en tu inventario
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inventario.map(item => (
                                <div key={item.id} className="p-4 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: '#000' }}>
                                            <i className="fa-solid fa-box" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm">{item.producto.nombre}</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {item.producto.descripcion}
                                            </p>
                                            <div className="flex justify-between items-center mt-2">
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProductos.map((producto, index) => (
                    <motion.div
                        key={producto.id}
                        className="rounded-xl overflow-hidden group cursor-pointer"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,217,255,0.1)' }}
                    >
                        <div className="h-32 flex items-center justify-center relative overflow-hidden product-image-container" style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-hover))' }}>
                            {producto.imagen_url && !producto.imagen_url.startsWith('file://') ? (
                                <img
                                    src={producto.imagen_url}
                                    alt={producto.nombre}
                                    className="w-full h-full object-contain product-image-transparent"
                                    style={{ 
                                        background: 'transparent',
                                        imageRendering: 'auto',
                                        mixBlendMode: 'normal',
                                        padding: '8px'
                                    }}
                                    onError={(e) => {
                                        // Si la imagen falla, mostrar icono
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                />
                            ) : (
                                <div className="hidden text-4xl" style={{ color: '#000' }}>
                                    {producto.categoria === 'tecnologia' && <i className="fa-solid fa-mobile-screen" />}
                                    {producto.categoria === 'equipamiento' && <i className="fa-solid fa-shield-halved" />}
                                    {producto.categoria === 'medico' && <i className="fa-solid fa-kit-medical" />}
                                    {producto.categoria === 'herramientas' && <i className="fa-solid fa-wrench" />}
                                    {producto.categoria === 'general' && <i className="fa-solid fa-box" />}
                                </div>
                            )}
                            {/* Icono por defecto */}
                            <div className="text-4xl" style={{ color: '#000' }}>
                                {producto.categoria === 'tecnologia' && <i className="fa-solid fa-mobile-screen" />}
                                {producto.categoria === 'equipamiento' && <i className="fa-solid fa-shield-halved" />}
                                {producto.categoria === 'medico' && <i className="fa-solid fa-kit-medical" />}
                                {producto.categoria === 'herramientas' && <i className="fa-solid fa-wrench" />}
                                {producto.categoria === 'general' && <i className="fa-solid fa-box" />}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-sm mb-1">{producto.nombre}</h3>
                            <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                {producto.descripcion}
                            </p>
                            
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                                    {formatCurrency(producto.precio)}
                                </span>
                                <span className="text-xs px-2 py-1 rounded capitalize" style={{ 
                                    background: producto.stock === -1 ? 'rgba(46,213,115,0.1)' : 
                                               producto.stock > 0 ? 'rgba(0,217,255,0.1)' : 'rgba(255,71,87,0.1)',
                                    color: producto.stock === -1 ? 'var(--success)' : 
                                           producto.stock > 0 ? 'var(--accent)' : 'var(--danger)'
                                }}>
                                    {producto.stock === -1 ? '∞' : producto.stock}
                                </span>
                            </div>
                            
                            <button
                                onClick={() => handleCompra(producto)}
                                className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: producto.stock === 0 ? 'var(--bg-hover)' : 'var(--accent)',
                                    color: producto.stock === 0 ? 'var(--text-muted)' : '#000',
                                    cursor: producto.stock === 0 ? 'not-allowed' : 'pointer'
                                }}
                                disabled={producto.stock === 0}
                            >
                                {producto.stock === 0 ? 'Sin Stock' : 'Comprar'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredProductos.length === 0 && (
                <div className="text-center py-12">
                    <i className="text-4xl mb-4" style={{ color: 'var(--text-muted)' }}>fa-solid fa-store</i>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                        No hay productos en esta categoría
                    </p>
                </div>
            )}
        </div>
    )
}
