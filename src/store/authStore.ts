'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario, Servidor } from '@/types'

interface AuthState {
    currentUser: Usuario | null
    currentServer: string | null
    serverName: string | null
    activeServiceId: string | null
    theme: string
    setUser: (user: Usuario | null) => void
    setServer: (serverId: string | null, serverName?: string | null) => void
    setActiveServiceId: (id: string | null) => void
    setTheme: (theme: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUser: null,
            currentServer: null,
            serverName: null,
            activeServiceId: null,
            theme: 'cyan',
            setUser: (user) => set({ currentUser: user }),
            setServer: (serverId, serverName) => set({ currentServer: serverId, serverName: serverName ?? null }),
            setActiveServiceId: (id) => set({ activeServiceId: id }),
            setTheme: (theme) => set({ theme }),
            logout: () =>
                set({
                    currentUser: null,
                    currentServer: null,
                    serverName: null,
                    activeServiceId: null,
                }),
        }),
        {
            name: 'rp-auth',
            partialize: (state) => ({
                theme: state.theme,
                // Don't persist session for security
            }),
        }
    )
)
