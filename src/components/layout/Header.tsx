'use client'

import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'
import supabase from '@/lib/supabase'

const themes = [
    { key: 'cyan', label: 'Cyan', color: '#00d9ff' },
    { key: 'blue', label: 'Azul', color: '#3b82f6' },
    { key: 'green', label: 'Verde', color: '#10b981' },
    { key: 'purple', label: 'Púrpura', color: '#8b5cf6' },
    { key: 'red', label: 'Rojo', color: '#ef4444' },
]

interface HeaderProps {
    onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
    const { currentUser, serverName, logout, setTheme, theme } = useAuthStore()
    const router = useRouter()
    const [themeOpen, setThemeOpen] = useState(false)

    const handleLogout = () => {
        if (!confirm('¿Cerrar sesión?')) return
        logout()
        router.push('/')
        toast('Sesión cerrada', { icon: '👋' })
    }

    const handleTheme = (t: string) => {
        setTheme(t)
        document.documentElement.setAttribute('data-theme', t)
        setThemeOpen(false)
    }

    return (
        <header
            className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 h-[65px] gap-3"
            style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                >
                    <i className="fa-solid fa-bars" />
                </button>
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #0088cc)' }}
                >
                    <i className="fa-solid fa-shield-halved text-white" />
                </div>
                <div className="hidden sm:block">
                    <div className="font-bold text-[16px] tracking-wider uppercase">Sistema RP</div>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Centro de Comando
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Server badge */}
                {serverName && (
                    <div
                        className="hidden md:flex px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase"
                        style={{
                            background: 'rgba(0,217,255,0.08)',
                            border: '1px solid var(--accent)',
                            color: 'var(--accent)',
                        }}
                    >
                        {serverName}
                    </div>
                )}

                {/* User badge */}
                {currentUser && (
                    <div
                        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, var(--accent), #0088cc)' }}
                        >
                            {getInitials(currentUser.nombre)}
                        </div>
                        <div>
                            <div className="text-[13px] font-bold leading-none">{currentUser.nombre}</div>
                            <div className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {currentUser.placa ? `Placa: ${currentUser.placa}` : currentUser.rol.toUpperCase()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Theme selector */}
                <div className="relative">
                    <button
                        onClick={() => setThemeOpen(!themeOpen)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                        <i className="fa-solid fa-palette" />
                    </button>
                    {themeOpen && (
                        <div
                            className="absolute right-0 mt-2 w-40 rounded-xl p-2 z-50 shadow-2xl"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                        >
                            {themes.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => handleTheme(t.key)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-80 text-left"
                                    style={{ color: 'var(--text-secondary)', background: theme === t.key ? 'var(--bg-hover)' : 'transparent' }}
                                >
                                    <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all hover:bg-red-500 hover:text-white"
                    style={{
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <i className="fa-solid fa-right-from-bracket" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </header>
    )
}
