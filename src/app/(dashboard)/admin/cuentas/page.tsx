'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/utils'
import type { Usuario } from '@/types'

interface CuentaBancaria {
    id: string
    servidor_id: string
    tipo: string
    dinero_banco: number
    activa: boolean
    created_at: string
    usuarios?: Usuario
    usuario_id?: string  // AÑADIDO para compatibilidad
}

export default function AdminCuentasPage() {
    const { currentUser, currentServer } = useAuthStore()
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [montoInicial, setMontoInicial] = useState(1000)
    const [montoQuitar, setMontoQuitar] = useState(1000)
    const [selectedCuentas, setSelectedCuentas] = useState<string[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createForm, setCreateForm] = useState({
        usuario_id: '',
        tipo: 'personal',
        dinero_banco: 1000,
        activa: true
    })
    const [usuarios, setUsuarios] = useState<Usuario[]>([])

    useEffect(() => {
        fetchCuentas()
        fetchUsuarios()
    }, [currentServer])

    const fetchCuentas = async () => {
        const { data } = await supabase
            .from('cuentas_bancarias')
            .select(`
                *,
                usuarios (
                    id,
                    username,
                    nombre
                )
            `)
            .eq('servidor_id', currentServer)
        setCuentas(data || [])
        setLoading(false)
    }

    const fetchUsuarios = async () => {
        const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('servidor_id', currentServer)
            .eq('activo', true)
        setUsuarios(data || [])
    }

    const handleDarDinero = async () => {
        console.log('🔍 Iniciando handleDarDinero')
        console.log('📊 Cuentas seleccionadas:', selectedCuentas)
        console.log('💰 Monto a dar:', montoInicial)
        
        if (selectedCuentas.length === 0) {
            console.log('❌ No hay cuentas seleccionadas')
            return toast.error('Selecciona al menos una cuenta')
        }

        try {
            // Obtener saldos actuales y sumar el monto
            const { data: cuentasActuales, error: fetchError } = await supabase
                .from('cuentas_bancarias')
                .select('*')
                .in('id', selectedCuentas)

            console.log('📋 Cuentas actuales:', cuentasActuales)
            console.log('⚠️ Error fetch:', fetchError)

            if (fetchError) {
                console.error('Error al obtener cuentas:', fetchError)
                return toast.error('Error al obtener cuentas: ' + fetchError.message)
            }

            if (!cuentasActuales || cuentasActuales.length === 0) {
                console.log('❌ No se encontraron cuentas')
                return toast.error('No se encontraron las cuentas seleccionadas')
            }

            const cuentasActualizadas = cuentasActuales.map(cuenta => ({
                ...cuenta, // Mantener todos los campos existentes
                dinero_banco: cuenta.dinero_banco + montoInicial
            }))

            console.log('💳 Cuentas a actualizar:', cuentasActualizadas)

            const { error } = await supabase
                .from('cuentas_bancarias')
                .upsert(cuentasActualizadas)

            console.log('⚠️ Error upsert:', error)

            if (error) {
                console.error('Error al actualizar cuentas:', error)
                toast.error('Error al dar dinero: ' + error.message)
            } else {
                console.log('✅ Dinero dado exitosamente')
                toast.success(`Se han dado ${formatCurrency(montoInicial)} a ${selectedCuentas.length} cuentas`)
                fetchCuentas()
                setSelectedCuentas([])
            }
        } catch (error) {
            console.error('💥 Error inesperado:', error)
            toast.error('Error inesperado: ' + error)
        }
    }

const handleQuitarDinero = async () => {
        console.log('🔍 Iniciando handleQuitarDinero')
        console.log('📊 Cuentas seleccionadas:', selectedCuentas)
        console.log('💰 Monto a quitar:', montoQuitar)
        
        if (selectedCuentas.length === 0) {
            console.log('❌ No hay cuentas seleccionadas')
            return toast.error('Selecciona al menos una cuenta')
        }

        try {
            const { data: cuentasActuales, error: fetchError } = await supabase
                .from('cuentas_bancarias')
                .select('*')
                .in('id', selectedCuentas)

            console.log('📋 Cuentas actuales:', cuentasActuales)
            console.log('⚠️ Error fetch:', fetchError)

            // Mostrar detalles de cada cuenta para quitar dinero
            if (cuentasActuales) {
                cuentasActuales.forEach(cuenta => {
                    console.log(`💳 Cuenta ${cuenta.id}: saldo=${cuenta.dinero_banco}, monto_a_quitar=${montoQuitar}, suficiente=${cuenta.dinero_banco >= montoQuitar}`)
                })
            }

            if (fetchError) {
                console.error('Error al obtener cuentas:', fetchError)
                return toast.error('Error al obtener cuentas: ' + fetchError.message)
            }

            if (!cuentasActuales || cuentasActuales.length === 0) {
                console.log('❌ No se encontraron cuentas')
                return toast.error('No se encontraron las cuentas seleccionadas')
            }

            const cuentasValidas = cuentasActuales.filter(cuenta => cuenta.dinero_banco >= montoQuitar)
            const cuentasInvalidas = cuentasActuales.filter(cuenta => cuenta.dinero_banco < montoQuitar)

            console.log('✅ Cuentas válidas:', cuentasValidas)
            console.log('❌ Cuentas inválidas:', cuentasInvalidas)

            if (cuentasInvalidas.length > 0) {
                console.log('❌ Hay cuentas sin saldo suficiente')
                return toast.error(`${cuentasInvalidas.length} cuentas no tienen suficiente saldo`)
            }

            const cuentasActualizadas = cuentasValidas.map(cuenta => ({
                ...cuenta, // Mantener todos los campos existentes
                dinero_banco: cuenta.dinero_banco - montoQuitar
            }))

            console.log('💳 Cuentas a actualizar:', cuentasActualizadas)

            const { error } = await supabase
                .from('cuentas_bancarias')
                .upsert(cuentasActualizadas)

            console.log('⚠️ Error upsert:', error)

            if (error) {
                console.error('Error al quitar dinero:', error)
                toast.error('Error al quitar dinero: ' + error.message)
            } else {
                console.log('✅ Dinero quitado exitosamente')
                toast.success(`Se han quitado ${formatCurrency(montoQuitar)} de ${cuentasValidas.length} cuentas`)
                fetchCuentas()
                setSelectedCuentas([])
            }
        } catch (error) {
            console.error('💥 Error inesperado:', error)
            toast.error('Error inesperado: ' + error)
        }
    }

    const handleCreateCuenta = async () => {
        if (!createForm.usuario_id) {
            return toast.error('Selecciona un usuario')
        }

        // Verificar si ya tiene cuenta
        const { data: existingCuenta } = await supabase
            .from('cuentas_bancarias')
            .select('*')
            .eq('usuario_id', createForm.usuario_id)
            .single()

        if (existingCuenta) {
            return toast.error('Este usuario ya tiene una cuenta bancaria')
        }

        const { error } = await supabase
            .from('cuentas_bancarias')
            .insert({
                ...createForm,
                servidor_id: currentServer
            })

        if (error) {
            toast.error('Error al crear cuenta')
        } else {
            toast.success('Cuenta creada exitosamente')
            setShowCreateModal(false)
            setCreateForm({
                usuario_id: '',
                tipo: 'personal',
                dinero_banco: 1000,  // CAMBIADO: saldo -> dinero_banco
                activa: true
            })
            fetchCuentas()
        }
    }

    const handleToggleCuenta = (cuentaId: string) => {
        setSelectedCuentas(prev => 
            prev.includes(cuentaId) 
                ? prev.filter(id => id !== cuentaId)
                : [...prev, cuentaId]
        )
    }

    const handleSelectAll = () => {
        if (selectedCuentas.length === cuentas.length) {
            setSelectedCuentas([])
        } else {
            setSelectedCuentas(cuentas.map(c => c.id))
        }
    }

    const stats = {
        totalCuentas: cuentas.length,
        saldoTotal: cuentas.reduce((sum, c) => sum + (c.dinero_banco || 0), 0), // CAMBIADO: saldo -> dinero_banco
        cuentasActivas: cuentas.filter(c => c.activa).length,
        saldoPromedio: cuentas.length > 0 ? Math.round(cuentas.reduce((sum, c) => sum + (c.dinero_banco || 0), 0) / cuentas.length) : 0 // CAMBIADO: saldo -> dinero_banco
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Administración de Cuentas Bancarias</h1>
                <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Gestiona las cuentas bancarias de todos los usuarios
                </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon="fa-solid fa-wallet" title="Total Cuentas" value={stats.totalCuentas} delay={0} />
                <StatCard icon="fa-solid fa-dollar-sign" title="Saldo Total" value={formatCurrency(stats.saldoTotal)} delay={0.05} iconColor="#2ed573" iconBg="rgba(46,213,115,0.1)" />
                <StatCard icon="fa-solid fa-check-circle" title="Cuentas Activas" value={stats.cuentasActivas} delay={0.1} iconColor="#00d9ff" iconBg="rgba(0,217,255,0.1)" />
                <StatCard icon="fa-solid fa-chart-line" title="Saldo Promedio" value={formatCurrency(stats.saldoPromedio)} delay={0.15} iconColor="#ffa502" iconBg="rgba(255,165,2,0.1)" />
            </div>

            {/* Acciones masivas */}
            <motion.div
                className="rounded-xl p-5 mb-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="font-bold text-[15px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <i className="fa-solid fa-coins mr-2" style={{ color: 'var(--accent)' }} />
                    Acciones Masivas
                </h3>
                <div className="flex flex-wrap gap-3 items-end">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ 
                            background: 'var(--accent)', 
                            color: '#fff'
                        }}
                    >
                        <i className="fa-solid fa-plus mr-2" />
                        Crear Cuenta
                    </button>
                    <div>
                        <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Monto Inicial
                        </label>
                        <input
                            type="number"
                            value={montoInicial}
                            onChange={(e) => setMontoInicial(Number(e.target.value))}
                            className="px-3 py-2 rounded-lg text-sm"
                            style={{ 
                                background: 'var(--bg-hover)', 
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                width: '150px'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleDarDinero}
                        disabled={selectedCuentas.length === 0}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                        style={{ 
                            background: selectedCuentas.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
                            color: '#fff'
                        }}
                    >
                        Dar Dinero a {selectedCuentas.length} Cuentas
                    </button>
                    <div>
                        <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Monto a Quitar
                        </label>
                        <input
                            type="number"
                            value={montoQuitar}
                            onChange={(e) => setMontoQuitar(Number(e.target.value))}
                            className="px-3 py-2 rounded-lg text-sm"
                            style={{ 
                                background: 'var(--bg-hover)', 
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                width: '150px'
                            }}
                        />
                        {selectedCuentas.length === 1 && (
                            <div className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Saldo disponible: {formatCurrency(
                                    cuentas.find(c => c.id === selectedCuentas[0])?.dinero_banco || 0
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleQuitarDinero}
                        disabled={selectedCuentas.length === 0}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                        style={{ 
                            background: selectedCuentas.length > 0 ? '#EF4444' : 'var(--text-muted)',
                            color: '#fff'
                        }}
                    >
                        Quitar Dinero a {selectedCuentas.length} Cuentas
                    </button>
                    <button
                        onClick={handleSelectAll}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ 
                            background: 'var(--bg-hover)', 
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {selectedCuentas.length === cuentas.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                </div>
            </motion.div>

            {/* Lista de cuentas */}
            <motion.div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="font-bold text-[15px] uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <i className="fa-solid fa-list mr-2" style={{ color: 'var(--accent)' }} />
                    Todas las Cuentas
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                                <th className="text-left py-3 px-2 text-[12px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedCuentas.length === cuentas.length && cuentas.length > 0}
                                        onChange={handleSelectAll}
                                        className="mr-2"
                                    />
                                    Usuario
                                </th>
                                <th className="text-left py-3 px-2 text-[12px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Tipo
                                </th>
                                <th className="text-left py-3 px-2 text-[12px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Saldo
                                </th>
                                <th className="text-left py-3 px-2 text-[12px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Estado
                                </th>
                                <th className="text-left py-3 px-2 text-[12px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Creada
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentas.map((cuenta) => (
                                <tr key={cuenta.id} className="border-b hover:bg-opacity-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedCuentas.includes(cuenta.id)}
                                                onChange={() => handleToggleCuenta(cuenta.id)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-bold text-[14px]">{cuenta.usuarios?.nombre}</div>
                                                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                                    @{cuenta.usuarios?.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-[13px] capitalize">{cuenta.tipo}</span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="font-bold text-[14px]" style={{ color: 'var(--success)' }}>
                                            {formatCurrency(cuenta.dinero_banco || 0)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-full ${
                                            cuenta.activa ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {cuenta.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(cuenta.created_at).toLocaleDateString('es-ES')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {cuentas.length === 0 && (
                        <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                            No hay cuentas bancarias registradas
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Modal para crear cuenta */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="rounded-xl p-6 w-full max-w-md"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h2 className="text-xl font-bold mb-4">Crear Nueva Cuenta</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Usuario</label>
                                <select
                                    value={createForm.usuario_id}
                                    onChange={(e) => setCreateForm({...createForm, usuario_id: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="">Selecciona un usuario</option>
                                    {usuarios
                                        .filter(u => !cuentas.some(c => c.usuario_id === u.id))
                                        .map(usuario => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {usuario.nombre} (@{usuario.username})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Tipo</label>
                                <select
                                    value={createForm.tipo}
                                    onChange={(e) => setCreateForm({...createForm, tipo: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                >
                                    <option value="personal">Personal</option>
                                    <option value="negocio">Negocio</option>
                                    <option value="ahorros">Ahorros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium mb-1">Dinero Inicial</label>
                                <input
                                    type="number"
                                    value={createForm.dinero_banco}  // CAMBIADO: saldo -> dinero_banco
                                    onChange={(e) => setCreateForm({...createForm, dinero_banco: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="activa"
                                    checked={createForm.activa}
                                    onChange={(e) => setCreateForm({...createForm, activa: e.target.checked})}
                                    className="mr-2"
                                />
                                <label htmlFor="activa" className="text-sm">Cuenta activa</label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateCuenta}
                                className="flex-1 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                Crear Cuenta
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setCreateForm({
                                        usuario_id: '',
                                        tipo: 'personal',
                                        dinero_banco: 1000,  
                                        activa: true
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
