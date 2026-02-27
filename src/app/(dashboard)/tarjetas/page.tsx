'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface TarjetaBancaria {
    id: string
    usuario_id: string
    cuenta_bancaria_id: string
    nombre_tarjeta: string
    numero_tarjeta: string
    pin: string
    limite_credito: number
    saldo_disponible: number
    activa: boolean
    tipo_tarjeta: string
    created_at: string
}

interface TransaccionTarjeta {
    id: string
    tarjeta_origen_id: string
    tarjeta_destino_id: string
    monto: number
    concepto: string
    created_at: string
}

export default function TarjetasPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [tarjetas, setTarjetas] = useState<TarjetaBancaria[]>([])
    const [transacciones, setTransacciones] = useState<TransaccionTarjeta[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaBancaria | null>(null)
    
    const [createForm, setCreateForm] = useState({
        numero_cuenta: '',
        pin: '',
        nombre_tarjeta: '',
        tipo_tarjeta: 'debito'
    })
    
    const [transferForm, setTransferForm] = useState({
        tarjeta_origen_id: '',
        tarjeta_destino_id: '',
        monto: 0,
        concepto: ''
    })

    useEffect(() => {
        fetchTarjetas()
        fetchTransacciones()
    }, [currentServer])

    const fetchTarjetas = async () => {
        if (!currentUser?.id) return
        
        const { data } = await supabase
            .from('tarjetas_bancarias')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .order('created_at', { ascending: false })
        
        setTarjetas(data || [])
        setLoading(false)
    }

    const fetchTransacciones = async () => {
        if (!currentUser?.id) return
        
        const { data } = await supabase
            .from('transacciones_tarjetas')
            .select('*')
            .eq('servidor_id', currentServer)
            .order('created_at', { ascending: false })
            .limit(20)
        
        setTransacciones(data || [])
    }

    const handleCreateTarjeta = async () => {
        if (!currentUser?.id) return
        
        if (!createForm.numero_cuenta || !createForm.pin || !createForm.nombre_tarjeta) {
            return toast.error('Completa todos los campos')
        }

        // Verificar cuenta bancaria y PIN
        const { data: cuenta } = await supabase
            .from('cuentas_bancarias')
            .select('id, usuario_id')
            .eq('numero_cuenta', createForm.numero_cuenta.trim())
            .single()

        if (!cuenta || cuenta.usuario_id !== currentUser.id) {
            return toast.error('Cuenta no encontrada o no te pertenece')
        }

        // Verificar si ya existe una tarjeta con ese nombre
        const { data: existente } = await supabase
            .from('tarjetas_bancarias')
            .select('id')
            .eq('usuario_id', currentUser.id)
            .eq('nombre_tarjeta', createForm.nombre_tarjeta.trim())
            .single()

        if (existente) {
            return toast.error('Ya tienes una tarjeta con ese nombre')
        }

        const { error } = await supabase
            .from('tarjetas_bancarias')
            .insert({
                usuario_id: currentUser.id,
                cuenta_bancaria_id: cuenta.id,
                nombre_tarjeta: createForm.nombre_tarjeta.trim(),
                numero_tarjeta: generarNumeroTarjeta(),
                pin: createForm.pin.trim(),
                limite_credito: createForm.tipo_tarjeta === 'credito' ? 10000 : 5000,
                saldo_disponible: 0,
                tipo_tarjeta: createForm.tipo_tarjeta
            })

        if (error) {
            toast.error('Error al crear tarjeta')
        } else {
            toast.success('Tarjeta creada exitosamente')
            setShowCreateModal(false)
            setCreateForm({ numero_cuenta: '', pin: '', nombre_tarjeta: '', tipo_tarjeta: 'debito' })
            fetchTarjetas()
        }
    }

    const handleTransfer = async () => {
        if (!transferForm.tarjeta_origen_id || !transferForm.tarjeta_destino_id || transferForm.monto <= 0) {
            return toast.error('Completa todos los campos')
        }

        const tarjetaOrigen = tarjetas.find(t => t.id === transferForm.tarjeta_origen_id)
        if (!tarjetaOrigen || transferForm.monto > tarjetaOrigen.saldo_disponible) {
            return toast.error('Saldo insuficiente en la tarjeta origen')
        }

        const { error } = await supabase
            .from('transacciones_tarjetas')
            .insert({
                tarjeta_origen_id: transferForm.tarjeta_origen_id,
                tarjeta_destino_id: transferForm.tarjeta_destino_id,
                monto: transferForm.monto,
                concepto: transferForm.concepto || 'Transferencia entre tarjetas',
                servidor_id: currentServer
            })

        if (error) {
            toast.error('Error al realizar transferencia')
        } else {
            // Actualizar saldos
            await supabase
                .from('tarjetas_bancarias')
                .update({ saldo_disponible: tarjetaOrigen.saldo_disponible - transferForm.monto })
                .eq('id', transferForm.tarjeta_origen_id)

            const tarjetaDestino = tarjetas.find(t => t.id === transferForm.tarjeta_destino_id)
            if (tarjetaDestino) {
                await supabase
                    .from('tarjetas_bancarias')
                    .update({ saldo_disponible: tarjetaDestino.saldo_disponible + transferForm.monto })
                    .eq('id', transferForm.tarjeta_destino_id)
            }

            toast.success(`Transferencia de ${formatCurrency(transferForm.monto)} completada`)
            setShowTransferModal(false)
            setTransferForm({ tarjeta_origen_id: '', tarjeta_destino_id: '', monto: 0, concepto: '' })
            fetchTarjetas()
            fetchTransacciones()
        }
    }

    const generarNumeroTarjeta = () => {
        const prefijos = ['4532', '5521', '3782', '6011']
        const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)]
        const numeros = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `${prefijo}-${numeros}-XXXX`
    }

    const tipoTarjetaIcon: Record<string, string> = {
        debito: 'fa-solid fa-credit-card',
        credito: 'fa-solid fa-cc-visa'
    }

    const tipoTarjetaColor: Record<string, string> = {
        debito: 'var(--accent)',
        credito: 'var(--warning)'
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Mis Tarjetas Bancarias</h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Gestiona tus tarjetas y realiza transferencias
                </p>
            </motion.div>

            {/* Botón crear tarjeta */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full py-3 rounded-xl font-bold text-[14px] uppercase tracking-wide"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                >
                    <i className="fa-solid fa-plus mr-2" />
                    Crear Nueva Tarjeta
                </button>
            </motion.div>

            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {tarjetas.map((tarjeta, index) => (
                    <motion.div
                        key={tarjeta.id}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)',
                            borderTop: `3px solid ${tipoTarjetaColor[tarjeta.tipo_tarjeta]}`
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-[16px] mb-1">{tarjeta.nombre_tarjeta}</h3>
                                <p className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                    {tarjeta.numero_tarjeta}
                                </p>
                            </div>
                            <div className="text-right">
                                <i className={`text-2xl ${tipoTarjetaIcon[tarjeta.tipo_tarjeta]}`} 
                                   style={{ color: tipoTarjetaColor[tarjeta.tipo_tarjeta] }} />
                                <div className="text-[10px] mt-1 capitalize" style={{ color: 'var(--text-secondary)' }}>
                                    {tarjeta.tipo_tarjeta}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Saldo Disponible</span>
                                <span className="font-bold text-[14px]" style={{ color: 'var(--success)' }}>
                                    {formatCurrency(tarjeta.saldo_disponible)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Límite Crédito</span>
                                <span className="font-bold text-[14px]" style={{ color: tipoTarjetaColor[tarjeta.tipo_tarjeta] }}>
                                    {formatCurrency(tarjeta.limite_credito)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setSelectedTarjeta(tarjeta)
                                    setTransferForm({
                                        tarjeta_origen_id: tarjeta.id,
                                        tarjeta_destino_id: '',
                                        monto: 0,
                                        concepto: ''
                                    })
                                    setShowTransferModal(true)
                                }}
                                className="flex-1 py-2 rounded-lg text-[11px] font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                <i className="fa-solid fa-paper-plane mr-1" />
                                Transferir
                            </button>
                            <button
                                className="flex-1 py-2 rounded-lg text-[11px] font-medium"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                <i className="fa-solid fa-eye mr-1" />
                                Detalles
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal crear tarjeta */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">Crear Nueva Tarjeta</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Número de Cuenta Bancaria</label>
                                <input
                                    type="text"
                                    value={createForm.numero_cuenta}
                                    onChange={(e) => setCreateForm({...createForm, numero_cuenta: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="ACC-XXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">PIN (4 dígitos)</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={createForm.pin}
                                    onChange={(e) => setCreateForm({...createForm, pin: e.target.value.replace(/\D/g, '')})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Nombre de la Tarjeta</label>
                                <input
                                    type="text"
                                    value={createForm.nombre_tarjeta}
                                    onChange={(e) => setCreateForm({...createForm, nombre_tarjeta: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Ej: Visa Platinum"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Tipo de Tarjeta</label>
                                <select
                                    value={createForm.tipo_tarjeta}
                                    onChange={(e) => setCreateForm({...createForm, tipo_tarjeta: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="debito">Débito</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateTarjeta}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Crear Tarjeta
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal transferencia */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">Transferir Entre Tarjetas</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Tarjeta Origen</label>
                                <select
                                    value={transferForm.tarjeta_origen_id}
                                    onChange={(e) => setTransferForm({...transferForm, tarjeta_origen_id: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="">Selecciona tarjeta</option>
                                    {tarjetas.map(tarjeta => (
                                        <option key={tarjeta.id} value={tarjeta.id}>
                                            {tarjeta.nombre_tarjeta} ({formatCurrency(tarjeta.saldo_disponible)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Tarjeta Destino</label>
                                <select
                                    value={transferForm.tarjeta_destino_id}
                                    onChange={(e) => setTransferForm({...transferForm, tarjeta_destino_id: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="">Selecciona tarjeta</option>
                                    {tarjetas.filter(t => t.id !== transferForm.tarjeta_origen_id).map(tarjeta => (
                                        <option key={tarjeta.id} value={tarjeta.id}>
                                            {tarjeta.nombre_tarjeta}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Monto</label>
                                <input
                                    type="number"
                                    value={transferForm.monto}
                                    onChange={(e) => setTransferForm({...transferForm, monto: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="0.00"
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
                                    placeholder="Transferencia entre tarjetas"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleTransfer}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Transferir
                            </button>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Últimas transacciones */}
            <motion.div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="font-bold text-[13px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Últimas Transacciones Entre Tarjetas
                </h3>
                {transacciones.length === 0 ? (
                    <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        Sin transacciones entre tarjetas
                    </p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {transacciones.map((trans) => {
                            const tarjetaOrigen = tarjetas.find(t => t.id === trans.tarjeta_origen_id)
                            const tarjetaDestino = tarjetas.find(t => t.id === trans.tarjeta_destino_id)
                            
                            return (
                                <div key={trans.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0" 
                                         style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}>
                                        <i className="fa-solid fa-arrow-right-arrow-left" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[13px]">
                                            {tarjetaOrigen?.nombre_tarjeta} → {tarjetaDestino?.nombre_tarjeta}
                                        </div>
                                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                            {trans.concepto || 'Transferencia'}
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(trans.created_at).toLocaleString('es-ES')}
                                        </div>
                                    </div>
                                    <div className="font-bold text-[15px]" style={{ color: 'var(--danger)' }}>
                                        -{formatCurrency(trans.monto)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
