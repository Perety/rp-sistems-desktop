// Tipos para el sistema de radios

export interface Radio {
    id: string
    servidor_id: string
    nombre: string
    descripcion: string
    frecuencia: string
    tipo: 'publica' | 'privada' | 'emergencia'
    max_usuarios: number
    es_emergencia: boolean
    prioridad: number // 1-5
    activa: boolean
    created_at: string
    updated_at: string
    usuarios_conectados?: RadioUsuario[]
}

export interface RadioPermiso {
    id: string
    radio_id: string
    rol_id: string
    servidor_id: string
    puede_unirse: boolean
    puede_hablar: boolean
    es_admin: boolean
    created_at: string
}

export interface RadioUsuario {
    id: string
    radio_id: string
    usuario_id: string
    personaje_id?: string
    servidor_id: string
    estado: 'conectado' | 'hablando' | 'silenciado' | 'ausente'
    volumen: number // 0.0-1.0
    is_transmitiendo: boolean
    ultima_transmision?: string
    ip_address?: string
    created_at: string
    updated_at: string
    usuario?: {
        id: string
        username: string
        nombre: string
        apellidos: string
    }
    personaje?: {
        id: string
        nombre: string
        apellidos: string
    }
}

export interface UsuarioAudioConfig {
    id: string
    usuario_id: string
    servidor_id: string
    dispositivo_entrada?: string
    dispositivo_salida?: string
    volumen_general: number
    umbral_voz: number
    tecla_ptt: string
    supresion_ruido: boolean
    eco_cancelacion: boolean
    calidad_audio: 'low' | 'medium' | 'high'
    created_at: string
    updated_at: string
}

export interface RadioTransmision {
    id: string
    radio_id: string
    usuario_id: string
    personaje_id?: string
    servidor_id: string
    tipo: 'normal' | 'susurro' | 'emergencia'
    duracion_ms: number
    calidad?: string
    destinatarios: string[]
    created_at: string
}

export interface WebRTCConnection {
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
    audioStream?: MediaStream
    isConnected: boolean
    userId: string
    radioId: string
}

export interface AudioProcessor {
    context: AudioContext
    source: MediaStreamAudioSourceNode
    processor: ScriptProcessorNode
    gainNode: GainNode
    analyser: AnalyserNode
    isProcessing: boolean
}

export interface RadioState {
    // Estado actual del usuario
    radioActual?: Radio
    isTransmitiendo: boolean
    isMuted: boolean
    volumenGeneral: number
    teclaPTT: string
    
    // Conexiones WebRTC
    conexiones: Map<string, WebRTCConnection>
    audioProcessor?: AudioProcessor
    
    // Configuración
    audioConfig: UsuarioAudioConfig
    
    // Radios disponibles
    radiosDisponibles: Radio[]
    usuariosEnRadio: RadioUsuario[]
    
    // Estado de transmisión
    usuariosTransmitiendo: Set<string>
    
    // WebSocket para signaling
    signalingSocket?: WebSocket
}

// Eventos del sistema de radios
export interface RadioEvent {
    tipo: 'usuario_conectado' | 'usuario_desconectado' | 'usuario_hablando' | 'usuario_silenciado' | 'transmision_iniciada' | 'transmision_finalizada'
    radioId: string
    usuarioId: string
    datos?: any
    timestamp: number
}

// Configuración WebRTC
export interface WebRTCConfig {
    iceServers: RTCIceServer[]
    audioConstraints: MediaStreamConstraints
    offerOptions: RTCOfferOptions
}

// Configuración por defecto
export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { 
            urls: 'turn:turn.server.com:3478',
            username: 'user',
            credential: 'pass'
        }
    ],
    audioConstraints: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
        },
        video: false
    },
    offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
    }
}

// Calidades de audio
export const AUDIO_QUALITIES = {
    low: { bitrate: 16000, sampleRate: 16000 },
    medium: { bitrate: 32000, sampleRate: 24000 },
    high: { bitrate: 64000, sampleRate: 48000 }
}

// Teclas PTT comunes
export const PTT_KEYS = [
    { key: 'CAPS_LOCK', label: 'Bloq Mayús' },
    { key: 'SHIFT', label: 'Shift' },
    { key: 'CTRL', label: 'Ctrl' },
    { key: 'ALT', label: 'Alt' },
    { key: 'SPACE', label: 'Espacio' },
    { key: 'ENTER', label: 'Enter' },
    { key: 'TAB', label: 'Tab' },
    { key: 'F1', label: 'F1' },
    { key: 'F2', label: 'F2' },
    { key: 'F3', label: 'F3' },
    { key: 'F4', label: 'F4' },
    { key: 'F5', label: 'F5' },
    { key: 'F6', label: 'F6' }
]
