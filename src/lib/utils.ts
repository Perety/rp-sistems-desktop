import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount).replace('US$', '$')
}

export function escapeHtml(text: string | number | null | undefined): string {
    if (text === null || text === undefined) return ''
    const str = String(text)
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function generateDNI(): string {
    const num = Math.floor(Math.random() * 90000000) + 10000000
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
    const letter = letters[num % 23]
    return `${num}${letter}`
}

export function getStatusColor(status: string): string {
    const map: Record<string, string> = {
        disponible: 'success',
        activa: 'success',
        Normal: 'success',
        pendiente: 'warning',
        suspendida: 'warning',
        descanso: 'warning',
        ocupado: 'danger',
        Buscado: 'danger',
        Robado: 'danger',
        revocada: 'danger',
        en_custodia: 'danger',
        offline: 'muted',
    }
    return map[status] || 'info'
}
