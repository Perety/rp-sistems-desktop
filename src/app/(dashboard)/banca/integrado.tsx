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
    destinatario_nombre?: string
    created_at: string
}

export default function BancaIntegradaPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [cuenta, setCuenta] = useState<any>(null)
    const [tarjetas, setTarjetas] = useState<TarjetaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateTarjeta, setShowCreateTarjeta] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    
    const [createTarjetaForm, setCreateTarjetaForm] = useState({
        pin: '',
        nombre_tarjeta: '',
        tipo_tarjeta: 'debito'
    })
    
    const [transferForm, setTransferForm] = useState({
        destino: '', // Nombre de la tarjeta de destino
        monto: 0,
        tarjeta_origen_id: '',
        concepto: ''
    })

    useEffect(() => {
        fetchData()
    }, [currentServer])

    const fetchData = async () => {
        if (!currentServer || !currentUser?.id) return
        
        // Obtener cuenta principal
        const { data: cData } = await supabase
            .from('cuentas_bancarias')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .eq('servidor_id', currentServer)
            .single()

        setCuenta(cData)

        if (cData) {
            // Obtener tarjetas del usuario
            const { data: tData } = await supabase
                .from('tarjetas_bancarias')
                .select('*')
                .eq('usuario_id', currentUser.id)
                .order('created_at', { ascending: false })
            
            setTarjetas(tData || [])
        }
        
        setLoading(false)
    }

    const handleCreateTarjeta = async () => {
        if (!currentUser?.id) return
        
        if (!createTarjetaForm.pin || !createTarjetaForm.nombre_tarjeta) {
            return toast.error('Completa todos los campos')
        }

        if (createTarjetaForm.pin.length !== 4) {
            return toast.error('El PIN debe tener 4 dígitos')
        }

        if (!cuenta) {
            return toast.error('No tienes una cuenta bancaria principal')
        }

        const { error } = await supabase
            .from('tarjetas_bancarias')
            .insert({
                usuario_id: currentUser.id,
                cuenta_bancaria_id: cuenta.id,
                nombre_tarjeta: createTarjetaForm.nombre_tarjeta.trim(),
                numero_tarjeta: generarNumeroTarjeta(),
                pin: createTarjetaForm.pin.trim(),
                limite_credito: createTarjetaForm.tipo_tarjeta === 'credito' ? 15000 : 8000,
                saldo_disponible: 0,
                tipo_tarjeta: createTarjetaForm.tipo_tarjeta
            })

        if (error) {
            toast.error('Error al crear tarjeta')
        } else {
            toast.success('Tarjeta creada exitosamente')
            setShowCreateTarjeta(false)
            setCreateTarjetaForm({ pin: '', nombre_tarjeta: '', tipo_tarjeta: 'debito' })
            fetchData()
        }
    }

    const handleTransfer = async () => {
        if (!transferForm.destino || transferForm.monto <= 0) {
            return toast.error('Completa todos los campos')
        }

        // Buscar tarjeta por nombre exacto
        const { data: tarjetaDestino, error: tarjetaError } = await supabase
            .from('tarjetas_bancarias')
            .select('*')
            .eq('nombre_tarjeta', transferForm.destino.trim())
            .single()

        if (tarjetaError || !tarjetaDestino) {
            return toast.error('Tarjeta de destino no encontrada')
        }

        // Verificar saldo en tarjeta origen
        const tarjetaOrigen = tarjetas.find(t => t.id === transferForm.tarjeta_origen_id)
        if (!tarjetaOrigen || tarjetaOrigen.saldo_disponible < transferForm.monto) {
            return toast.error('Saldo insuficiente')
        }

        // Realizar transferencia
        const { error: transferError } = await supabase
            .from('transacciones_tarjetas')
            .insert({
                tarjeta_origen_id: tarjetaOrigen.id,
                tarjeta_destino_id: tarjetaDestino.id,
                monto: transferForm.monto,
                tipo: 'transferencia',
                descripcion: `Transferencia a ${tarjetaDestino.nombre_tarjeta}`,
                servidor_id: currentServer
            })

        if (transferError) {
            toast.error('Error al realizar transferencia')
        } else {
            // Actualizar saldos
            await supabase.rpc('transferir_entre_tarjetas', {
                p_tarjeta_origen_id: tarjetaOrigen.id,
                p_tarjeta_destino_id: tarjetaDestino.id,
                p_monto: transferForm.monto
            })

            toast.success(`Transferencia de ${formatCurrency(transferForm.monto)} a ${tarjetaDestino.nombre_tarjeta} completada`)
            setShowTransferModal(false)
            setTransferForm({ destino: '', monto: 0, tarjeta_origen_id: '', concepto: '' })
            fetchData()
        }
    }

    const generarNumeroTarjeta = () => {
        const prefijos = ['4532', '5521', '3782', '6011', '5142']
        const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)]
        const numeros = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `${prefijo}-${numeros}-XXXX`
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>
    }

    if (!cuenta) {
        return <div className="flex items-center justify-center h-64">No tienes una cuenta bancaria</div>
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Banca Digital y Tarjetas</h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Gestiona tu cuenta y tarjetas bancarias
                </p>
            </motion.div>

            {/* Cuenta Principal */}
            <motion.div
                className="rounded-2xl p-6 mb-6"
                style={{ background: 'linear-gradient(135deg, #1a2a3a, #0a1a2a)', border: '1px solid rgba(0,217,255,0.2)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,217,255,0.1)' }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Cuenta Principal</h2>
                        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                            {cuenta.numero_cuenta} · Saldo: {formatCurrency(cuenta.dinero_banco)}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateTarjeta(true)}
                        className="px-4 py-2 rounded-xl font-bold text-[12px] uppercase"
                        style={{ background: 'var(--accent)', color: '#000' }}
                    >
                        <i className="fa-solid fa-plus mr-2" />
                        Crear Tarjeta
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Dinero en Banco</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                            {formatCurrency(cuenta.dinero_banco)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Dinero en Mano</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                            {formatCurrency(cuenta.dinero_mano || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Total</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
                            {formatCurrency((cuenta.dinero_banco || 0) + (cuenta.dinero_mano || 0))}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                        <i className="fa-solid fa-paper-plane mr-2" />
                        Transferir Dinero
                    </button>
                    <button
                        className="flex-1 py-2 rounded-lg text-sm font-medium"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                    >
                        <i className="fa-solid fa-history mr-2" />
                        Ver Movimientos
                    </button>
                </div>
            </motion.div>

            {/* Tarjetas */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Mis Tarjetas</h2>
                    <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                        {tarjetas.length} tarjetas activas
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tarjetas.map((tarjeta, index) => (
                        <motion.div
                            key={tarjeta.id}
                            className="rounded-xl p-5 relative overflow-hidden border"
                            style={{ 
                                background: 'var(--bg-card)', 
                                border: '1px solid var(--border)',
                                borderTop: `3px solid ${tarjeta.tipo_tarjeta === 'credito' ? '#f59e0b' : '#00d9ff'}`
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-[16px] mb-1">{tarjeta.nombre_tarjeta}</h3>
                                    <p className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                        {tarjeta.numero_tarjeta}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <i className={`text-2xl ${tarjeta.tipo_tarjeta === 'credito' ? 'fa-solid fa-cc-visa' : 'fa-solid fa-credit-card'}`} 
                                       style={{ color: tarjeta.tipo_tarjeta === 'credito' ? '#f59e0b' : '#00d9ff' }} />
                                    <div className="text-[10px] mt-1 capitalize" style={{ color: 'var(--text-secondary)' }}>
                                        {tarjeta.tipo_tarjeta}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Saldo</span>
                                    <span className="font-bold text-[14px]" style={{ color: 'var(--success)' }}>
                                        {formatCurrency(tarjeta.saldo_disponible)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Límite</span>
                                    <span className="font-bold text-[14px]" style={{ color: tarjeta.tipo_tarjeta === 'credito' ? '#f59e0b' : '#00d9ff' }}>
                                        {formatCurrency(tarjeta.limite_credito)}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                                PIN: {tarjeta.pin.replace(/./g, '●')}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Modal crear tarjeta */}
            {showCreateTarjeta && (
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
                                <label className="block text-[12px] font-medium mb-1">Nombre de la Tarjeta</label>
                                <input
                                    type="text"
                                    value={createTarjetaForm.nombre_tarjeta}
                                    onChange={(e) => setCreateTarjetaForm({...createTarjetaForm, nombre_tarjeta: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Ej: Visa Platinum"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">PIN (4 dígitos)</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={createTarjetaForm.pin}
                                    onChange={(e) => setCreateTarjetaForm({...createTarjetaForm, pin: e.target.value.replace(/\D/g, '')})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Tipo de Tarjeta</label>
                                <select
                                    value={createTarjetaForm.tipo_tarjeta}
                                    onChange={(e) => setCreateTarjetaForm({...createTarjetaForm, tipo_tarjeta: e.target.value})}
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
                                onClick={() => setShowCreateTarjeta(false)}
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
                        <h2 className="text-xl font-bold mb-4">Transferir Dinero</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Destino</label>
                                <input
                                    type="text"
                                    value={transferForm.destino}
                                    onChange={(e) => setTransferForm({...transferForm, destino: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                    placeholder="Nombre de la tarjeta de destino"
                                />
                                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Ingresa el nombre exacto de la tarjeta de destino
                                </div>
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
                                    placeholder="Transferencia"
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
        </div>
    )
}
