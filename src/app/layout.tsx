import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
    title: 'Sistema RP — Plataforma Multi-Servidor',
    description: 'Plataforma de gestión para servidores de Roleplay. MDT, Economía, CAD y más.',
    icons: { icon: '/logo.png' },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
            </head>
            <body>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#151b23',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderLeft: '3px solid #00d9ff',
                            fontFamily: 'Rajdhani, sans-serif',
                            fontWeight: 600,
                            fontSize: '15px',
                            borderRadius: '8px',
                            padding: '14px 18px',
                        },
                        success: {
                            style: { borderLeft: '3px solid #2ed573' },
                            iconTheme: { primary: '#2ed573', secondary: '#151b23' },
                        },
                        error: {
                            style: { borderLeft: '3px solid #ff4757' },
                            iconTheme: { primary: '#ff4757', secondary: '#151b23' },
                        },
                    }}
                />
            </body>
        </html>
    )
}
