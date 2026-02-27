'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { CuentaBancaria, Transaccion } from '@/types'

export default function BancaPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [cuenta, setCuenta] = useState<CuentaBancaria | null>(null)
    const [transacciones, setTransacciones] = useState<Transaccion[]>([])
    const [loading, setLoading] = useState(true)
    const [transferModal, setTransferModal] = useState(false)
    const [transferData, setTransferData] = useState({ destino: '', cantidad: '', descripcion: '' })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        if (!currentServer || !currentUser?.id) return
        
        // Buscar cuenta directamente por usuario_id
        const { data: cData } = await supabase
            .from('cuentas_bancarias')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .eq('servidor_id', currentServer)
            .single()

        setCuenta(cData ?? null)
        setLoading(false)

        if (cData) {
            const { data: tData } = await supabase
                .from('transacciones')
                .select('*')
                .or(`cuenta_origen_id.eq.${cData.id},cuenta_destino_id.eq.${cData.id}`)
                .order('created_at', { ascending: false })
                .limit(30)
            setTransacciones(tData ?? [])
        }
    }

    const submitTransfer = async () => {
        if (!transferData.destino || !transferData.cantidad) return toast.error('Completa los campos')
        const amount = parseFloat(transferData.cantidad)
        if (isNaN(amount) || amount <= 0) return toast.error('Cantidad inválida')
        if (cuenta && amount > cuenta.dinero_banco) return toast.error('Saldo insuficiente')

        // Find destination account
        const { data: destCuenta } = await supabase
            .from('cuentas_bancarias')
            .select('id, dinero_banco')
            .eq('numero_cuenta', transferData.destino.trim())
            .maybeSingle()

        if (!destCuenta) return toast.error('Cuenta destino no encontrada')

        // Debit origin
        const { error: e1 } = await supabase
            .from('cuentas_bancarias')
            .update({ dinero_banco: (cuenta!.dinero_banco || 0) - amount })
            .eq('id', cuenta!.id)

        if (e1) return toast.error('Error al procesar transferencia')

        // Credit destination
        await supabase
            .from('cuentas_bancarias')
            .update({ dinero_banco: (destCuenta.dinero_banco || 0) + amount })
            .eq('id', destCuenta.id)

        // Log transaction
        await supabase.from('transacciones').insert({
            servidor_id: currentServer,
            cuenta_origen_id: cuenta!.id,
            cuenta_destino_id: destCuenta.id,
            tipo: 'transferencia',
            cantidad: amount,
            descripcion: transferData.descripcion || 'Transferencia',
            creado_por: currentUser?.nombre,
        })

        toast.success(`Transferencia de ${formatCurrency(amount)} completada`)
        setTransferModal(false)
        setTransferData({ destino: '', cantidad: '', descripcion: '' })
        fetchData()
    }

    // Build chart data from last 7 days
    const chartData = (() => {
        const days: Record<string, number> = {}
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
            days[key] = 0
        }
        transacciones.forEach((t) => {
            const d = new Date(t.created_at)
            const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
            if (key in days) days[key] += t.cantidad
        })
        return Object.entries(days).map(([fecha, total]) => ({ fecha, total }))
    })()

    const tipoIcon: Record<string, string> = {
        transferencia: 'fa-solid fa-arrow-right-arrow-left',
        multa: 'fa-solid fa-gavel',
        salario: 'fa-solid fa-money-bill-wave',
        compra: 'fa-solid fa-cart-shopping',
        impuesto: 'fa-solid fa-landmark',
        admin: 'fa-solid fa-star',
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <i className="fa-solid fa-spinner fa-spin text-3xl" style={{ color: 'var(--accent)' }} />
        </div>
    )

    if (!cuenta) return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <i className="fa-solid fa-building-columns text-4xl mb-3" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No tienes personaje o cuenta bancaria asignada.</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Pide al admin que te cree un personaje.</p>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Banca Digital</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Nº {cuenta.numero_cuenta}
                </p>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <motion.div
                    className="rounded-2xl p-6"
                    style={{ background: 'linear-gradient(135deg, #1a2a3a, #0a1a2a)', border: '1px solid rgba(0,217,255,0.2)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,217,255,0.1)' }}
                >
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                        <i className="fa-solid fa-building-columns" />
                        Saldo Bancario
                    </div>
                    <div className="text-4xl font-bold">{formatCurrency(cuenta.dinero_banco)}</div>
                    <div className="mt-4 flex items-center justify-between">
                        <button
                            onClick={() => setTransferModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px] uppercase"
                            style={{ background: 'var(--accent)', color: '#000' }}
                        >
                            <i className="fa-solid fa-paper-plane" />
                            Transferir
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    className="rounded-2xl p-6"
                    style={{ background: 'linear-gradient(135deg, #1a2116, #0a1408)', border: '1px solid rgba(46,213,115,0.2)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#2ed573' }}>
                        <i className="fa-solid fa-wallet" />
                        Dinero en Mano
                    </div>
                    <div className="text-4xl font-bold">{formatCurrency(cuenta.dinero_mano)}</div>
                    <div className="mt-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        Total: {formatCurrency(cuenta.dinero_mano + cuenta.dinero_banco)}
                    </div>
                </motion.div>
            </div>

            {/* Chart */}
            <motion.div
                className="rounded-xl p-5 mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h3 className="font-bold text-[13px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Actividad — Últimos 7 días
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="gradBanca" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="fecha" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Rajdhani' }}
                            formatter={(v: any) => [formatCurrency(v), 'Movimiento']}
                        />
                        <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} fill="url(#gradBanca)" />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Transacciones */}
            <motion.div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <h3 className="font-bold text-[13px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Últimas Transacciones
                </h3>
                {transacciones.length === 0 ? (
                    <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin movimientos</p>
                ) : (
                    <div className="space-y-2">
                        {transacciones.map((t) => {
                            const isIncoming = t.cuenta_destino_id === cuenta.id
                            return (
                                <div key={t.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
                                        style={{ background: 'var(--bg-hover)', color: isIncoming ? 'var(--success)' : 'var(--danger)' }}
                                    >
                                        <i className={tipoIcon[t.tipo] || 'fa-solid fa-circle'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[13px]">{t.descripcion || t.tipo}</div>
                                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(t.created_at)}</div>
                                    </div>
                                    <div className="font-bold text-[15px]" style={{ color: isIncoming ? 'var(--success)' : 'var(--danger)' }}>
                                        {isIncoming ? '+' : '-'}{formatCurrency(t.cantidad)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            {/* Transfer Modal */}
            <Modal isOpen={transferModal} onClose={() => setTransferModal(false)} title="Nueva Transferencia">
                <div className="space-y-4">
                    <div>
                        <label>Número de cuenta destino</label>
                        <input type="text" placeholder="ES1234567890123" value={transferData.destino} onChange={(e) => setTransferData((p) => ({ ...p, destino: e.target.value }))} />
                    </div>
                    <div>
                        <label>Cantidad ($)</label>
                        <input type="number" placeholder="100" value={transferData.cantidad} onChange={(e) => setTransferData((p) => ({ ...p, cantidad: e.target.value }))} />
                    </div>
                    <div>
                        <label>Concepto (opcional)</label>
                        <input type="text" placeholder="Pago de alquiler..." value={transferData.descripcion} onChange={(e) => setTransferData((p) => ({ ...p, descripcion: e.target.value }))} />
                    </div>
                    <button onClick={submitTransfer} className="w-full py-3 rounded-xl font-bold uppercase" style={{ background: 'var(--accent)', color: '#000' }}>
                        Confirmar Transferencia
                    </button>
                </div>
            </Modal>
        </div>
    )
}
