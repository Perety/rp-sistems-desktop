'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import WorkingRadioInterface from '@/components/WorkingRadioInterface'
import WhisperSystem from '@/components/WhisperSystem'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { currentUser, theme } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!currentUser) {
            router.replace('/')
        }
    }, [currentUser, router])

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    if (!currentUser) return null

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main column */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={typeof window !== 'undefined' ? window.location.pathname : ''}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            
            {/* Radio Interface */}
            <WorkingRadioInterface />
            
            {/* Whisper System */}
            <WhisperSystem />
        </div>
    )
}
