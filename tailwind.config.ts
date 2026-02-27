import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                rajdhani: ['Rajdhani', 'sans-serif'],
            },
            colors: {
                bg: {
                    primary: '#0a0e14',
                    secondary: '#151b23',
                    card: '#1a2129',
                    hover: '#222930',
                },
                accent: {
                    DEFAULT: '#00d9ff',
                    hover: '#00b8d4',
                },
                danger: '#ff4757',
                success: '#2ed573',
                warning: '#ffa502',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'scan': 'scan 1.5s ease-in-out',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                slideIn: {
                    from: { transform: 'translateX(400px)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                scan: {
                    '0%': { top: '0%' },
                    '50%': { top: '100%' },
                    '100%': { top: '0%' },
                },
            },
        },
    },
    plugins: [],
}

export default config
