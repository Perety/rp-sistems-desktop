'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'info' | 'success' | 'warning' | 'danger' | 'muted'
    className?: string
}

const variantMap = {
    info: { bg: 'rgba(0,217,255,0.15)', color: 'var(--accent)', border: 'var(--accent)' },
    success: { bg: 'rgba(46,213,115,0.15)', color: 'var(--success)', border: 'var(--success)' },
    warning: { bg: 'rgba(255,165,2,0.15)', color: 'var(--warning)', border: 'var(--warning)' },
    danger: { bg: 'rgba(255,71,87,0.15)', color: 'var(--danger)', border: 'var(--danger)' },
    muted: { bg: 'rgba(90,100,116,0.2)', color: 'var(--text-muted)', border: 'var(--text-muted)' },
}

export function Badge({ children, variant = 'info', className }: BadgeProps) {
    const v = variantMap[variant]
    return (
        <span
            className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border', className)}
            style={{ background: v.bg, color: v.color, borderColor: v.border }}
        >
            {children}
        </span>
    )
}

interface TagProps {
    children: React.ReactNode
    variant?: 'info' | 'success' | 'warning' | 'danger' | 'muted'
    className?: string
}

export function Tag({ children, variant = 'info', className }: TagProps) {
    const v = variantMap[variant]
    return (
        <span
            className={cn('inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase border', className)}
            style={{ background: v.bg, color: v.color, borderColor: v.border }}
        >
            {children}
        </span>
    )
}
