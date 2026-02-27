import supabase from '@/lib/supabase'

interface PermisosUsuario {
    puede_entrar: boolean
    puede_hablar: boolean
    puede_escribir_chat: boolean
}

interface SancionActiva {
    id: string
    tipo_sancion: string
    motivo: string
    fecha_expiracion?: string
    emitido_por: string
}

export async function verificarPermisosUsuario(usuarioId: string, servidorId: string): Promise<PermisosUsuario> {
    try {
        // Limpiar sanciones expiradas primero
        await limpiarSancionesExpiradas()
        
        // Obtener permisos actuales
        const { data, error } = await supabase
            .from('permisos_usuario')
            .select('puede_entrar, puede_hablar, puede_escribir_chat')
            .eq('usuario_id', usuarioId)
            .eq('servidor_id', servidorId)
            .single()
        
        if (error || !data) {
            // Si no hay permisos registrados, dar permisos por defecto
            return {
                puede_entrar: true,
                puede_hablar: true,
                puede_escribir_chat: true
            }
        }
        
        return data
    } catch (error) {
        console.error('Error verificando permisos:', error)
        return {
            puede_entrar: true,
            puede_hablar: true,
            puede_escribir_chat: true
        }
    }
}

export async function obtenerSancionesActivas(usuarioId: string, servidorId: string): Promise<SancionActiva[]> {
    try {
        const { data, error } = await supabase
            .from('sanciones')
            .select('id, tipo_sancion, motivo, fecha_expiracion, emitido_por')
            .eq('usuario_sancionado_id', usuarioId)
            .eq('servidor_id', servidorId)
            .eq('estado', 'activa')
            .or('fecha_expiracion.is.null,fecha_expiracion.gt.now()')
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('Error obteniendo sanciones:', error)
            return []
        }
        
        return data || []
    } catch (error) {
        console.error('Error obteniendo sanciones:', error)
        return []
    }
}

export async function limpiarSancionesExpiradas(): Promise<void> {
    try {
        await supabase.rpc('limpiar_sanciones_expiradas')
    } catch (error) {
        console.error('Error limpiando sanciones expiradas:', error)
    }
}

export async function verificarAccesoLogin(usuarioId: string, servidorId: string): Promise<{
    permitido: boolean
    motivo?: string
    sanciones?: SancionActiva[]
}> {
    const permisos = await verificarPermisosUsuario(usuarioId, servidorId)
    const sanciones = await obtenerSancionesActivas(usuarioId, servidorId)
    
    // Si hay un ban activo, bloquear acceso
    const banActivo = sanciones.find(s => s.tipo_sancion === 'ban')
    if (banActivo) {
        const mensaje = banActivo.fecha_expiracion 
            ? `Estás baneado hasta ${new Date(banActivo.fecha_expiracion).toLocaleString('es-ES')}`
            : 'Estás baneado permanentemente'
        
        return {
            permitido: false,
            motivo: `${mensaje}. Motivo: ${banActivo.motivo}`,
            sanciones
        }
    }
    
    // Verificar permisos de entrada
    if (!permisos.puede_entrar) {
        return {
            permitido: false,
            motivo: 'No tienes permiso para entrar al servidor',
            sanciones
        }
    }
    
    return {
        permitido: true,
        sanciones
    }
}

export function formatearMensajeSancion(sanciones: SancionActiva[]): string {
    if (sanciones.length === 0) return ''
    
    const mensajes = sanciones.map(sancion => {
        let mensaje = `• ${sancion.tipo_sancion.toUpperCase()}: ${sancion.motivo}`
        
        if (sancion.fecha_expiracion) {
            const fecha = new Date(sancion.fecha_expiracion)
            mensaje += ` (expira: ${fecha.toLocaleString('es-ES')})`
        } else {
            mensaje += ' (permanente)'
        }
        
        mensaje += ` - por ${sancion.emitido_por}`
        
        return mensaje
    })
    
    return `Tienes ${sanciones.length} sanción(es) activa(s):\n${mensajes.join('\n')}`
}
