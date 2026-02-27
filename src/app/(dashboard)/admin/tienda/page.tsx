'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import ProductImageUpload from '@/components/ProductImageUpload'

interface Producto {
    id: string
    nombre: string
    descripcion: string
    categoria: string
    precio: number
    stock: number
    imagen_url?: string
    imagen_id?: string
    activo: boolean
}

export default function AdminTiendaPage() {
    const { currentServer } = useAuthStore()
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null)

    const [createForm, setCreateForm] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'general',
        precio: 0,
        stock: -1,
        imagen_url: '',
        imagen_id: ''
    })

    const categories = ['general', 'tecnologia', 'equipamiento', 'medico', 'herramientas']

    useEffect(() => {
        if (!currentServer) return
        fetchProductos()
    }, [currentServer])

    const fetchProductos = async () => {
        const { data, error } = await supabase
            .from('productos_con_imagenes')
            .select('*')
            .eq('servidor_id', currentServer)
            .order('nombre')

        if (error) {
            toast.error('Error al cargar productos')
        } else {
            setProductos(data || [])
        }
        setLoading(false)
    }

    const handleCreateProduct = async () => {
        if (!createForm.nombre || !createForm.descripcion || createForm.precio <= 0) {
            return toast.error('Completa todos los campos requeridos')
        }

        try {
            let productData: any = {
                nombre: createForm.nombre.trim(),
                descripcion: createForm.descripcion.trim(),
                categoria: createForm.categoria,
                precio: createForm.precio,
                stock: createForm.stock,
                servidor_id: currentServer
            }

            // Manejar la imagen según si es URL directa o archivo subido
            if (createForm.imagen_url && createForm.imagen_id) {
                // Si el ID empieza con "url_", es una URL directa
                if (createForm.imagen_id.startsWith('url_')) {
                    // Guardar URL directamente en la base de datos (sin imagen_id)
                    productData.imagen_url = createForm.imagen_url
                    productData.imagen_id = null
                } else {
                    // Es un archivo subido, guardar el ID de la imagen
                    productData.imagen_id = createForm.imagen_id
                    productData.imagen_url = null
                }
            } else {
                // Sin imagen
                productData.imagen_id = null
                productData.imagen_url = null
            }

            let error
            if (editingProduct) {
                ({ error } = await supabase
                    .from('productos')
                    .update(productData)
                    .eq('id', editingProduct.id))
            } else {
                ({ error } = await supabase
                    .from('productos')
                    .insert(productData))
            }

            if (error) {
                console.error('Error detallado:', error)
                toast.error('Error al guardar producto: ' + error.message)
            } else {
                toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado')
                setShowCreateModal(false)
                setEditingProduct(null)
                setCreateForm({
                    nombre: '',
                    descripcion: '',
                    categoria: 'general',
                    precio: 0,
                    stock: -1,
                    imagen_url: '',
                    imagen_id: ''
                })
                fetchProductos()
            }
        } catch (error) {
            console.error('Error en handleCreateProduct:', error)
            toast.error('Error al guardar producto')
        }
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return

        const { error } = await supabase
            .from('productos')
            .update({ activo: false })
            .eq('id', productId)

        if (error) {
            toast.error('Error al eliminar producto')
        } else {
            toast.success('Producto eliminado')
            fetchProductos()
        }
    }

    const handleEditProduct = (product: Producto) => {
        setEditingProduct(product)
        setCreateForm({
            nombre: product.nombre,
            descripcion: product.descripcion,
            categoria: product.categoria,
            precio: product.precio,
            stock: product.stock,
            imagen_url: product.imagen_url || '',
            imagen_id: product.imagen_id || ''
        })
        setShowCreateModal(true)
    }

    const handleImageUpload = (imageUrl: string, imageId: string) => {
        setCreateForm({
            ...createForm,
            imagen_url: imageUrl,
            imagen_id: imageId
        })
    }

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
                        <h1 className="text-3xl font-bold">Gestión de Tienda</h1>
                        <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Administra los productos disponibles en la tienda
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 rounded-xl font-bold text-[12px] uppercase"
                        style={{ background: 'var(--accent)', color: '#000' }}
                    >
                        <i className="fa-solid fa-plus mr-2" />
                        Nuevo Producto
                    </button>
                </div>
            </motion.div>

            {/* Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productos.map((producto, index) => (
                    <motion.div
                        key={producto.id}
                        className="rounded-xl overflow-hidden group"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        {/* Imagen del producto */}
                        <div className="h-40 flex items-center justify-center relative overflow-hidden product-image-container" style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-hover))' }}>
                            {producto.imagen_url ? (
                                <img
                                    src={producto.imagen_url}
                                    alt={producto.nombre}
                                    className="w-full h-full object-contain product-image-transparent"
                                    style={{ 
                                        background: 'transparent',
                                        imageRendering: 'auto',
                                        mixBlendMode: 'normal',
                                        padding: '12px'
                                    }}
                                />
                            ) : (
                                <i className="text-4xl" style={{ color: '#000' }}>
                                    {producto.categoria === 'tecnologia' && 'fa-solid fa-mobile-screen'}
                                    {producto.categoria === 'equipamiento' && 'fa-solid fa-shield-halved'}
                                    {producto.categoria === 'medico' && 'fa-solid fa-kit-medical'}
                                    {producto.categoria === 'herramientas' && 'fa-solid fa-wrench'}
                                    {producto.categoria === 'general' && 'fa-solid fa-box'}
                                </i>
                            )}
                            
                            {/* Overlay de acciones */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleEditProduct(producto)}
                                    className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                                    title="Editar"
                                >
                                    <i className="fa-solid fa-edit text-sm" />
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(producto.id)}
                                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    title="Eliminar"
                                >
                                    <i className="fa-solid fa-trash text-sm" />
                                </button>
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
                            
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded capitalize" style={{ 
                                    background: 'rgba(0,217,255,0.1)',
                                    color: 'var(--accent)'
                                }}>
                                    {producto.categoria}
                                </span>
                                <span className="text-xs px-2 py-1 rounded" style={{ 
                                    background: producto.activo ? 'rgba(46,213,115,0.1)' : 'rgba(255,71,87,0.1)',
                                    color: producto.activo ? 'var(--success)' : 'var(--danger)'
                                }}>
                                    {producto.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {productos.length === 0 && (
                <div className="text-center py-12">
                    <i className="text-4xl mb-4" style={{ color: 'var(--text-muted)' }}>fa-solid fa-store</i>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                        No hay productos en la tienda
                    </p>
                </div>
            )}

            {/* Modal Crear/Editar Producto */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Imagen */}
                            <div className="md:col-span-2">
                                <label className="block text-[12px] font-medium mb-2">Imagen del Producto</label>
                                <ProductImageUpload
                                    onImageUpload={handleImageUpload}
                                    currentImage={createForm.imagen_url}
                                    productName={createForm.nombre}
                                    label="Imagen del producto"
                                    placeholder="https://ejemplo.com/producto.jpg"
                                    className="max-w-sm mx-auto"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={createForm.nombre}
                                    onChange={(e) => setCreateForm({...createForm, nombre: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Nombre del producto"
                                />
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Categoría *</label>
                                <select
                                    value={createForm.categoria}
                                    onChange={(e) => setCreateForm({...createForm, categoria: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Precio */}
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Precio *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={createForm.precio}
                                    onChange={(e) => setCreateForm({...createForm, precio: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Stock</label>
                                <input
                                    type="number"
                                    min="-1"
                                    value={createForm.stock}
                                    onChange={(e) => setCreateForm({...createForm, stock: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="-1 para ilimitado"
                                />
                                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                    -1 = Stock ilimitado
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="md:col-span-2">
                                <label className="block text-[12px] font-medium mb-1">Descripción *</label>
                                <textarea
                                    value={createForm.descripcion}
                                    onChange={(e) => setCreateForm({...createForm, descripcion: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm h-24 resize-none"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Describe el producto..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateProduct}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setEditingProduct(null)
                                    setCreateForm({
                                        nombre: '',
                                        descripcion: '',
                                        categoria: 'general',
                                        precio: 0,
                                        stock: -1,
                                        imagen_url: '',
                                        imagen_id: ''
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
