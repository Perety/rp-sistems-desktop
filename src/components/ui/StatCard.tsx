'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
    icon: string
    title: string
    value: string | number
    iconColor?: string
    iconBg?: string
    delay?: number
}

export function StatCard({ icon, title, value, iconColor = 'var(--accent)', iconBg = 'rgba(0,217,255,0.1)', delay = 0 }: StatCardProps) {
    return (
        <motion.div
            className="rounded-xl p-5 cursor-default transition-all border hover:scale-[1.02]"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ borderColor: 'var(--accent)' }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: iconBg, color: iconColor }}
                >
                    <i className={icon} />
                </div>
            </div>
            <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-secondary)' }}
            >
                {title}
            </div>
            <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
            </div>
        </motion.div>
    )
}
