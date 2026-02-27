'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    subtitle?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/80"
                        style={{ backdropFilter: 'blur(4px)' }}
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className={cn(
                            'relative w-full rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]',
                            sizeMap[size]
                        )}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                        }}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>

                        {title && (
                            <div className="mb-6">
                                <h3
                                    className="text-2xl font-bold tracking-wide mb-1"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {title}
                                </h3>
                                {subtitle && (
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        )}

                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
