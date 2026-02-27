'use client'

import { useAuthStore } from '@/store/authStore'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface NavItem {
    label: string
    icon: string
    href: string
    roles?: string[]
}

interface NavGroup {
    section: string
    items: NavItem[]
}

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navItems: NavGroup[] = [
    {
        section: 'Principal',
        items: [
            { label: 'Dashboard', icon: 'fa-solid fa-chart-line', href: '/dashboard' },
            { label: 'Ciudadanos', icon: 'fa-solid fa-users', href: '/ciudadanos' },
            { label: 'Vehículos', icon: 'fa-solid fa-car', href: '/vehiculos' },
        ],
    },
    {
        section: 'Operaciones',
        items: [
            { label: 'Multas', icon: 'fa-solid fa-file-invoice-dollar', href: '/multas', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
            { label: 'Arrestos', icon: 'fa-solid fa-handcuffs', href: '/arrestos', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
            { label: 'Llamadas 911', icon: 'fa-solid fa-phone', href: '/llamadas', roles: ['lspd', 'bcso', 'ems', 'admin', 'superadmin'] },
            { label: 'BOLO', icon: 'fa-solid fa-bullhorn', href: '/bolo', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
        ],
    },
    {
        section: 'Gestión',
        items: [
            { label: 'Denuncias', icon: 'fa-solid fa-clipboard-list', href: '/denuncias', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
            { label: 'Investigaciones', icon: 'fa-solid fa-magnifying-glass', href: '/investigaciones', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
            { label: 'Servicio', icon: 'fa-solid fa-circle-check', href: '/servicio' },
            { label: 'CAD/MDT', icon: 'fa-solid fa-fingerprint', href: '/mdt', roles: ['lspd', 'bcso', 'admin', 'superadmin'] },
        ],
    },
    {
        section: 'Economía',
        items: [
            { label: 'Banca', icon: 'fa-solid fa-building-columns', href: '/banca' },
            { label: 'Tarjetas', icon: 'fa-solid fa-credit-card', href: '/tarjetas' },
            { label: 'Negocios', icon: 'fa-solid fa-briefcase', href: '/negocios', roles: ['admin', 'superadmin'] },
            { label: 'Tienda', icon: 'fa-solid fa-shop', href: '/tienda' },
            { label: 'Mi DNI', icon: 'fa-solid fa-id-card', href: '/dni' },
        ],
    },
]

const adminItems: NavGroup = {
    section: 'Administración',
    items: [
        { label: 'Panel Admin', icon: 'fa-solid fa-gauge-high', href: '/admin/panel' },
        { label: 'Usuarios', icon: 'fa-solid fa-user-gear', href: '/admin/usuarios' },
        { label: 'Roles', icon: 'fa-solid fa-shield', href: '/admin/roles' },
        { label: 'Radios', icon: 'fa-solid fa-radio', href: '/admin/radios' },
        { label: 'Sanciones', icon: 'fa-solid fa-gavel', href: '/admin/sanciones' },
        { label: 'Auditoría', icon: 'fa-solid fa-clipboard-check', href: '/admin/auditoria' },
        { label: 'Cuentas', icon: 'fa-solid fa-wallet', href: '/admin/cuentas' },
        { label: 'Tienda', icon: 'fa-solid fa-shop', href: '/admin/tienda' },
    ],
}

interface NavItem {
    label: string
    icon: string
    href: string
    roles?: string[]
}

interface NavGroup {
    section: string
    items: NavItem[]
}

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { currentUser } = useAuthStore()
    const pathname = usePathname()
    const isAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin'

    const allNav = isAdmin ? [...navItems, adminItems] : navItems

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-[65px] left-0 h-[calc(100vh-65px)] w-[240px] z-40',
                    'overflow-y-auto py-4 px-3 transition-transform duration-300',
                    'lg:relative lg:top-0 lg:h-full lg:translate-x-0 lg:flex-shrink-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
                style={{
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border)',
                }}
            >
                {allNav.map((group) => (
                    <div key={group.section} className="mb-6">
                        <div
                            className="text-[10px] font-bold uppercase tracking-[1.5px] px-3 mb-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {group.section}
                        </div>
                        {group.items.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + '/')
                            const hasPermission = !item.roles || item.roles.includes(currentUser?.rol || '')
                            
                            if (!hasPermission) return null
                            
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-[14px] font-semibold transition-all',
                                        active ? 'font-bold' : 'hover:opacity-90'
                                    )}
                                    style={
                                        active
                                            ? {
                                                background: 'rgba(0,217,255,0.08)',
                                                color: 'var(--accent)',
                                            }
                                            : {
                                                color: 'var(--text-secondary)',
                                            }
                                    }
                                >
                                    <i className={cn(item.icon, 'w-5 text-center text-base')} />
                                    <span>{item.label}</span>
                                    {active && (
                                        <motion.div
                                            layoutId="sidebar-indicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full"
                                            style={{ background: 'var(--accent)' }}
                                        />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </aside>
        </>
    )
}
