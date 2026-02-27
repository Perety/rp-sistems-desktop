import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Radio, RadioUsuario, UsuarioAudioConfig, WebRTCConnection, AudioProcessor, RadioState } from '@/types/radios'

interface RadioStore extends RadioState {
    // Acciones básicas
    setRadioActual: (radio: Radio | undefined) => void
    setTransmitiendo: (transmitiendo: boolean) => void
    setMuted: (muted: boolean) => void
    setVolumenGeneral: (volumen: number) => void
    setTeclaPTT: (tecla: string) => void
    
    // Gestión de radios
    cargarRadios: () => Promise<void>
    unirseRadio: (radioId: string) => Promise<void>
    salirRadio: () => Promise<void>
    
    // Gestión de usuarios
    cargarUsuariosEnRadio: (radioId: string) => Promise<void>
    actualizarUsuarioEstado: (usuarioId: string, estado: RadioUsuario['estado']) => void
    
    // Configuración de audio
    cargarAudioConfig: () => Promise<void>
    actualizarAudioConfig: (config: Partial<UsuarioAudioConfig>) => Promise<void>
    
    // WebRTC
    inicializarAudio: () => Promise<void>
    crearConexionWebRTC: (userId: string, radioId: string) => Promise<WebRTCConnection>
    cerrarConexionWebRTC: (userId: string) => void
    
    // Transmisiones
    iniciarTransmision: (tipo?: 'normal' | 'susurro' | 'emergencia', destinatarios?: string[]) => Promise<void>
    finalizarTransmision: () => Promise<void>
    
    // Utilidades
    limpiarEstado: () => void
}

export const useRadioStore = create<RadioStore>()(
    subscribeWithSelector((set, get) => ({
        // Estado inicial
        radioActual: undefined,
        isTransmitiendo: false,
        isMuted: false,
        volumenGeneral: 1.0,
        teclaPTT: 'CAPS_LOCK',
        conexiones: new Map(),
        audioConfig: {
            id: '',
            usuario_id: '',
            servidor_id: '',
            volumen_general: 1.0,
            umbral_voz: 0.02,
            tecla_ptt: 'CAPS_LOCK',
            supresion_ruido: true,
            eco_cancelacion: true,
            calidad_audio: 'high',
            created_at: '',
            updated_at: ''
        },
        radiosDisponibles: [],
        usuariosEnRadio: [],
        usuariosTransmitiendo: new Set(),
        signalingSocket: undefined,

        // Acciones básicas
        setRadioActual: (radio) => set({ radioActual: radio }),
        
        setTransmitiendo: (transmitiendo) => set({ isTransmitiendo: transmitiendo }),
        
        setMuted: (muted) => set({ isMuted: muted }),
        
        setVolumenGeneral: (volumen) => set({ volumenGeneral: Math.max(0, Math.min(1, volumen)) }),
        
        setTeclaPTT: (tecla) => set({ teclaPTT: tecla }),

        // Cargar radios disponibles
        cargarRadios: async () => {
            try {
                const response = await fetch('/api/radios')
                if (!response.ok) throw new Error('Error al cargar radios')
                
                const radios = await response.json()
                set({ radiosDisponibles: radios })
            } catch (error) {
                console.error('Error cargando radios:', error)
            }
        },

        // Unirse a una radio
        unirseRadio: async (radioId: string) => {
            try {
                const response = await fetch(`/api/radios/${radioId}/unirse`, {
                    method: 'POST'
                })
                
                if (!response.ok) throw new Error('Error al unirse a la radio')
                
                const radio = await response.json()
                set({ radioActual: radio })
                
                // Cargar usuarios en la radio
                get().cargarUsuariosEnRadio(radioId)
                
                // Inicializar audio si no está hecho
                if (!get().audioProcessor) {
                    await get().inicializarAudio()
                }
                
            } catch (error) {
                console.error('Error uniéndose a la radio:', error)
                throw error
            }
        },

        // Salir de la radio actual
        salirRadio: async () => {
            const { radioActual } = get()
            if (!radioActual) return

            try {
                await fetch(`/api/radios/${radioActual.id}/salir`, {
                    method: 'POST'
                })
                
                // Cerrar todas las conexiones WebRTC
                get().conexiones.forEach((_, userId) => {
                    get().cerrarConexionWebRTC(userId)
                })
                
                set({ 
                    radioActual: undefined,
                    usuariosEnRadio: [],
                    usuariosTransmitiendo: new Set()
                })
                
            } catch (error) {
                console.error('Error saliendo de la radio:', error)
            }
        },

        // Cargar usuarios en una radio
        cargarUsuariosEnRadio: async (radioId: string) => {
            try {
                const response = await fetch(`/api/radios/${radioId}/usuarios`)
                if (!response.ok) throw new Error('Error al cargar usuarios')
                
                const usuarios = await response.json()
                set({ usuariosEnRadio: usuarios })
                
            } catch (error) {
                console.error('Error cargando usuarios en radio:', error)
            }
        },

        // Actualizar estado de un usuario
        actualizarUsuarioEstado: (usuarioId: string, estado) => {
            set((state) => ({
                usuariosEnRadio: state.usuariosEnRadio.map(usuario =>
                    usuario.usuario_id === usuarioId ? { ...usuario, estado } : usuario
                )
            }))
        },

        // Cargar configuración de audio
        cargarAudioConfig: async () => {
            try {
                const response = await fetch('/api/radios/audio-config')
                if (!response.ok) throw new Error('Error al cargar configuración')
                
                const config = await response.json()
                set({ 
                    audioConfig: config,
                    volumenGeneral: config.volumen_general,
                    teclaPTT: config.tecla_ptt
                })
                
            } catch (error) {
                console.error('Error cargando configuración de audio:', error)
            }
        },

        // Actualizar configuración de audio
        actualizarAudioConfig: async (configUpdate) => {
            try {
                const { audioConfig } = get()
                const newConfig = { ...audioConfig, ...configUpdate }
                
                const response = await fetch('/api/radios/audio-config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newConfig)
                })
                
                if (!response.ok) throw new Error('Error al actualizar configuración')
                
                const updatedConfig = await response.json()
                set({ audioConfig: updatedConfig })
                
            } catch (error) {
                console.error('Error actualizando configuración de audio:', error)
                throw error
            }
        },

        // Inicializar sistema de audio
        inicializarAudio: async () => {
            try {
                // Solicitar permisos de micrófono
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 1
                    },
                    video: false
                })

                // Crear contexto de audio
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                
                // Crear nodos de procesamiento
                const source = audioContext.createMediaStreamSource(stream)
                const gainNode = audioContext.createGain()
                const analyser = audioContext.createAnalyser()
                
                // Conectar nodos
                source.connect(gainNode)
                gainNode.connect(analyser)
                
                // Crear procesador para análisis en tiempo real
                const processor = audioContext.createScriptProcessor(4096, 1, 1)
                gainNode.connect(processor)
                processor.connect(audioContext.destination)
                
                processor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0)
                    const outputData = event.outputBuffer.getChannelData(0)
                    
                    // Detectar nivel de voz
                    let sum = 0
                    for (let i = 0; i < inputData.length; i++) {
                        sum += Math.abs(inputData[i])
                        outputData[i] = inputData[i]
                    }
                    
                    const average = sum / inputData.length
                    const { audioConfig, isTransmitiendo } = get()
                    
                    // Auto-PTT si está activado
                    if (average > audioConfig.umbral_voz && !isTransmitiendo) {
                        get().iniciarTransmision()
                    } else if (average < audioConfig.umbral_voz * 0.5 && isTransmitiendo) {
                        get().finalizarTransmision()
                    }
                }
                
                const audioProcessor: AudioProcessor = {
                    context: audioContext,
                    source,
                    processor,
                    gainNode,
                    analyser,
                    isProcessing: true
                }
                
                set({ audioProcessor })
                
            } catch (error) {
                console.error('Error inicializando audio:', error)
                throw error
            }
        },

        // Crear conexión WebRTC con otro usuario
        crearConexionWebRTC: async (userId: string, radioId: string) => {
            try {
                const peerConnection = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                })

                // Crear data channel para signaling
                const dataChannel = peerConnection.createDataChannel('radio-audio')
                
                // Añadir stream de audio si está disponible
                const { audioProcessor } = get()
                if (audioProcessor?.source?.mediaStream) {
                    audioProcessor.source.mediaStream.getTracks().forEach(track => {
                        peerConnection.addTrack(track, audioProcessor.source.mediaStream)
                    })
                }

                const connection: WebRTCConnection = {
                    peerConnection,
                    dataChannel,
                    isConnected: false,
                    userId,
                    radioId
                }

                // Manejar eventos WebRTC
                peerConnection.oniceconnectionstatechange = () => {
                    connection.isConnected = peerConnection.iceConnectionState === 'connected'
                }

                peerConnection.ontrack = (event) => {
                    // Manejar audio entrante
                    event.streams[0].getTracks().forEach(track => {
                        // Procesar audio entrante
                    })
                }

                // Guardar conexión
                set((state) => ({
                    conexiones: new Map(state.conexiones).set(userId, connection)
                }))

                return connection
                
            } catch (error) {
                console.error('Error creando conexión WebRTC:', error)
                throw error
            }
        },

        // Cerrar conexión WebRTC
        cerrarConexionWebRTC: (userId: string) => {
            const { conexiones } = get()
            const connection = conexiones.get(userId)
            
            if (connection) {
                connection.peerConnection.close()
                connection.dataChannel.close()
                
                set((state) => {
                    const newConexiones = new Map(state.conexiones)
                    newConexiones.delete(userId)
                    return { conexiones: newConexiones }
                })
            }
        },

        // Iniciar transmisión
        iniciarTransmision: async (tipo = 'normal', destinatarios?: string[]) => {
            const { radioActual, isMuted } = get()
            
            if (!radioActual) {
                throw new Error('No estás en ninguna radio')
            }
            
            if (isMuted) {
                throw new Error('Estás silenciado')
            }

            try {
                // Notificar al servidor
                await fetch(`/api/radios/${radioActual.id}/transmision/iniciar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo, destinatarios })
                })

                set({ isTransmitiendo: true })
                
                // Añadir a usuarios transmitiendo
                set((state) => ({
                    usuariosTransmitiendo: new Set(state.usuariosTransmitiendo).add('current_user')
                }))
                
            } catch (error) {
                console.error('Error iniciando transmisión:', error)
                throw error
            }
        },

        // Finalizar transmisión
        finalizarTransmision: async () => {
            const { radioActual } = get()
            
            if (!radioActual) return

            try {
                // Notificar al servidor
                await fetch(`/api/radios/${radioActual.id}/transmision/finalizar`, {
                    method: 'POST'
                })

                set({ isTransmitiendo: false })
                
                // Quitar de usuarios transmitiendo
                set((state) => {
                    const newSet = new Set(state.usuariosTransmitiendo)
                    newSet.delete('current_user')
                    return { usuariosTransmitiendo: newSet }
                })
                
            } catch (error) {
                console.error('Error finalizando transmisión:', error)
            }
        },

        // Limpiar estado
        limpiarEstado: () => {
            // Cerrar todas las conexiones
            get().conexiones.forEach((_, userId) => {
                get().cerrarConexionWebRTC(userId)
            })

            // Detener procesador de audio
            const { audioProcessor } = get()
            if (audioProcessor) {
                audioProcessor.processor.disconnect()
                audioProcessor.source.disconnect()
                audioProcessor.context.close()
            }

            // Resetear estado
            set({
                radioActual: undefined,
                isTransmitiendo: false,
                isMuted: false,
                conexiones: new Map(),
                audioProcessor: undefined,
                usuariosEnRadio: [],
                usuariosTransmitiendo: new Set()
            })
        }
    }))
)
