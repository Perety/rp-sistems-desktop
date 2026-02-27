'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { generateDNI } from '@/lib/utils'

export default function DNIPage() {
    const { currentUser } = useAuthStore()
    const [name, setName] = useState(currentUser?.nombre || '')
    const [job, setJob] = useState(currentUser?.rango || 'Ciudadano')
    const [dni, setDni] = useState(() => generateDNI())
    const cardRef = useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotateX = useTransform(y, [-100, 100], [15, -15])
    const rotateY = useTransform(x, [-100, 100], [-15, 15])
    const gloss = useTransform(x, [-100, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)'])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        x.set(e.clientX - cx)
        y.set(e.clientY - cy)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Mi DNI</h1>
                <p className="text-[13px] mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Documento Nacional de Identidad Digital
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* 3D Card */}
                <div className="flex flex-col items-center">
                    <motion.div
                        ref={cardRef}
                        className="w-full max-w-sm cursor-pointer"
                        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: '1000px' }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    >
                        {/* Card front */}
                        <div
                            className="rounded-2xl p-6 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #0a1f35 0%, #0d2b47 50%, #091926 100%)',
                                border: '1px solid rgba(0,217,255,0.3)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                                aspectRatio: '1.586',
                            }}
                        >
                            {/* Gloss overlay */}
                            <motion.div
                                className="absolute inset-0 rounded-2xl"
                                style={{ background: gloss, pointerEvents: 'none' }}
                            />

                            {/* Background elements */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 right-0 w-48 h-48 rounded-full border-8" style={{ borderColor: 'var(--accent)', transform: 'translate(30%, -30%)' }} />
                                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-4" style={{ borderColor: 'var(--accent)', transform: 'translate(-30%, 30%)' }} />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div>
                                    <div className="text-[9px] font-bold tracking-[3px] uppercase" style={{ color: 'rgba(0,217,255,0.7)' }}>DOCUMENTO</div>
                                    <div className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--accent)' }}>Nacional de Identidad</div>
                                </div>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,217,255,0.2)', border: '1px solid rgba(0,217,255,0.4)' }}>
                                    <i className="fa-solid fa-shield-halved text-lg" style={{ color: 'var(--accent)' }} />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex gap-4 relative z-10">
                                {/* Photo placeholder */}
                                <div
                                    className="w-16 h-20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                                    style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)' }}
                                >
                                    <i className="fa-solid fa-user" style={{ color: 'rgba(0,217,255,0.5)' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(0,217,255,0.6)' }}>Nombre Completo</div>
                                    <div className="font-bold text-[15px] leading-tight">{name || 'Tu Nombre'}</div>
                                    <div className="mt-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(0,217,255,0.6)' }}>Ocupación</div>
                                        <div className="font-semibold text-[13px]">{job}</div>
                                    </div>
                                </div>
                            </div>

                            {/* DNI Number */}
                            <div className="relative z-10 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(0,217,255,0.15)' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,217,255,0.6)' }}>N.º Identificación</div>
                                        <div className="font-bold text-[16px] tracking-wider font-mono" style={{ color: 'var(--accent)' }}>{dni}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,217,255,0.6)' }}>Válido hasta</div>
                                        <div className="font-bold text-[13px]">12/2030</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <p className="text-[12px] mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                        Mueve el cursor sobre la tarjeta para ver el efecto 3D
                    </p>
                </div>

                {/* Editor */}
                <div className="space-y-5">
                    <motion.div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 className="font-bold text-[15px] mb-4 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                            Personalizar DNI
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label>Nombre Completo</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre..." />
                            </div>
                            <div>
                                <label>Ocupación / Rango</label>
                                <input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="Agente, Médico..." />
                            </div>
                            <div>
                                <label>Número DNI</label>
                                <div className="flex gap-2">
                                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="flex-1" />
                                    <button onClick={() => setDni(generateDNI())} className="px-4 py-2 rounded-xl font-bold text-[12px] flex-shrink-0" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                        <i className="fa-solid fa-shuffle" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <h3 className="font-bold text-[13px] uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
                            Información del titular
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Usuario', value: currentUser?.username || '—' },
                                { label: 'Rol', value: currentUser?.rol?.toUpperCase() || '—' },
                                { label: 'Placa', value: currentUser?.placa || '—' },
                                { label: 'Rango', value: currentUser?.rango || '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <span className="text-[12px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</span>
                                    <span className="text-[13px] font-bold">{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
