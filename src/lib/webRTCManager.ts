import type { WebRTCConnection, WebRTCConfig, AudioProcessor } from '@/types/radios'

export class WebRTCManager {
    private connections: Map<string, WebRTCConnection> = new Map()
    private audioProcessor?: AudioProcessor
    private signalingSocket?: WebSocket
    private userId: string
    private config: WebRTCConfig

    constructor(userId: string, config: WebRTCConfig) {
        this.userId = userId
        this.config = config
    }

    // Inicializar sistema de audio
    async initializeAudio(): Promise<MediaStream> {
        try {
            // Solicitar acceso al micrófono
            const stream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints)

            // Crear contexto de audio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            
            // Crear nodos de procesamiento
            const source = audioContext.createMediaStreamSource(stream)
            const gainNode = audioContext.createGain()
            const analyser = audioContext.createAnalyser()
            
            // Configurar analizador
            analyser.fftSize = 2048
            analyser.smoothingTimeConstant = 0.8
            
            // Conectar nodos
            source.connect(gainNode)
            gainNode.connect(analyser)
            
            // Crear procesador para detección de voz
            const processor = audioContext.createScriptProcessor(4096, 1, 1)
            gainNode.connect(processor)
            processor.connect(audioContext.destination)
            
            this.audioProcessor = {
                context: audioContext,
                source,
                processor,
                gainNode,
                analyser,
                isProcessing: true
            }

            return stream
        } catch (error) {
            console.error('Error inicializando audio:', error)
            throw new Error('No se pudo acceder al micrófono')
        }
    }

    // Crear conexión P2P con otro usuario
    async createConnection(targetUserId: string, radioId: string): Promise<WebRTCConnection> {
        try {
            const peerConnection = new RTCPeerConnection(this.config)

            // Crear data channel para señalización
            const dataChannel = peerConnection.createDataChannel('radio-audio', {
                ordered: true,
                maxRetransmits: 3
            })

            // Añadir stream de audio si está disponible
            if (this.audioProcessor?.source?.mediaStream) {
                this.audioProcessor.source.mediaStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.audioProcessor!.source!.mediaStream!)
                })
            }

            const connection: WebRTCConnection = {
                peerConnection,
                dataChannel,
                isConnected: false,
                userId: targetUserId,
                radioId
            }

            // Configurar handlers de conexión
            this.setupConnectionHandlers(connection)

            // Guardar conexión
            this.connections.set(targetUserId, connection)

            return connection
        } catch (error) {
            console.error('Error creando conexión WebRTC:', error)
            throw error
        }
    }

    // Configurar handlers de eventos WebRTC
    private setupConnectionHandlers(connection: WebRTCConnection): void {
        const { peerConnection, dataChannel } = connection

        // Data channel events
        dataChannel.onopen = () => {
            console.log(`Data channel abierto con ${connection.userId}`)
            connection.isConnected = true
        }

        dataChannel.onclose = () => {
            console.log(`Data channel cerrado con ${connection.userId}`)
            connection.isConnected = false
        }

        dataChannel.onmessage = (event) => {
            this.handleDataChannelMessage(event.data, connection.userId)
        }

        // Peer connection events
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState
            console.log(`ICE connection state con ${connection.userId}:`, state)
            
            connection.isConnected = state === 'connected' || state === 'completed'
        }

        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState
            console.log(`Connection state con ${connection.userId}:`, state)
        }

        peerConnection.ontrack = (event) => {
            console.log(`Track recibido de ${connection.userId}:`, event.streams)
            this.handleIncomingAudio(event.streams[0], connection.userId)
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetUserId: connection.userId,
                    radioId: connection.radioId
                })
            }
        }
    }

    // Crear oferta para conexión
    async createOffer(targetUserId: string): Promise<void> {
        const connection = this.connections.get(targetUserId)
        if (!connection) throw new Error('Conexión no encontrada')

        try {
            const offer = await connection.peerConnection.createOffer(this.config.offerOptions)
            await connection.peerConnection.setLocalDescription(offer)

            this.sendSignalingMessage({
                type: 'offer',
                offer,
                targetUserId,
                radioId: connection.radioId
            })
        } catch (error) {
            console.error('Error creando oferta:', error)
            throw error
        }
    }

    // Responder a oferta
    async handleOffer(offer: RTCSessionDescriptionInit, fromUserId: string, radioId: string): Promise<void> {
        try {
            // Crear conexión si no existe
            let connection = this.connections.get(fromUserId)
            if (!connection) {
                connection = await this.createConnection(fromUserId, radioId)
            }

            await connection.peerConnection.setRemoteDescription(offer)
            const answer = await connection.peerConnection.createAnswer()
            await connection.peerConnection.setLocalDescription(answer)

            this.sendSignalingMessage({
                type: 'answer',
                answer,
                targetUserId: fromUserId,
                radioId
            })
        } catch (error) {
            console.error('Error manejando oferta:', error)
            throw error
        }
    }

    // Manejar respuesta
    async handleAnswer(answer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
        const connection = this.connections.get(fromUserId)
        if (!connection) throw new Error('Conexión no encontrada')

        try {
            await connection.peerConnection.setRemoteDescription(answer)
        } catch (error) {
            console.error('Error manejando respuesta:', error)
            throw error
        }
    }

    // Manejar ICE candidate
    async handleIceCandidate(candidate: RTCIceCandidateInit, fromUserId: string): Promise<void> {
        const connection = this.connections.get(fromUserId)
        if (!connection) return

        try {
            await connection.peerConnection.addIceCandidate(candidate)
        } catch (error) {
            console.error('Error añadiendo ICE candidate:', error)
        }
    }

    // Enviar mensaje de señalización
    private sendSignalingMessage(message: any): void {
        if (this.signalingSocket?.readyState === WebSocket.OPEN) {
            this.signalingSocket.send(JSON.stringify(message))
        } else {
            console.warn('WebSocket no disponible para señalización')
        }
    }

    // Manejar mensaje de data channel
    private handleDataChannelMessage(data: string, fromUserId: string): void {
        try {
            const message = JSON.parse(data)
            
            switch (message.type) {
                case 'audio-data':
                    // Procesar datos de audio
                    this.processAudioData(message.data, fromUserId)
                    break
                case 'voice-activity':
                    // Actividad de voz
                    this.handleVoiceActivity(message.isActive, fromUserId)
                    break
                default:
                    console.log('Mensaje desconocido:', message)
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error)
        }
    }

    // Manejar audio entrante
    private handleIncomingAudio(stream: MediaStream, fromUserId: string): void {
        // Crear elemento de audio para reproducir
        const audioElement = new Audio()
        audioElement.srcObject = stream
        audioElement.autoplay = true
        audioElement.volume = 0.8 // Ajustar volumen
        
        // Aplicar efectos de audio
        this.applyAudioEffects(audioElement, fromUserId)
    }

    // Aplicar efectos de audio
    private applyAudioEffects(audioElement: HTMLAudioElement, userId: string): void {
        const audioContext = new AudioContext()
        const mediaStream = audioElement.srcObject as MediaStream
        const source = audioContext.createMediaStreamSource(mediaStream)
        const gainNode = audioContext.createGain()
        
        // Conectar a salida
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Ajustar volumen según distancia o preferencias
        gainNode.gain.value = 0.8
    }

    // Procesar datos de audio
    private processAudioData(audioData: ArrayBuffer, fromUserId: string): void {
        // Procesar y reproducir audio
        // Implementar decodificación y reproducción
    }

    // Manejar actividad de voz
    private handleVoiceActivity(isActive: boolean, userId: string): void {
        // Actualizar UI para mostrar quién está hablando
        const event = new CustomEvent('voice-activity', {
            detail: { userId, isActive }
        })
        window.dispatchEvent(event)
    }

    // Iniciar transmisión
    async startTransmission(): Promise<void> {
        if (!this.audioProcessor) {
            throw new Error('Sistema de audio no inicializado')
        }

        // Activar ganancia para transmitir
        this.audioProcessor.gainNode.gain.value = 1.0
        
        // Notificar a todas las conexiones
        this.connections.forEach(connection => {
            if (connection.isConnected && connection.dataChannel.readyState === 'open') {
                connection.dataChannel.send(JSON.stringify({
                    type: 'voice-activity',
                    isActive: true
                }))
            }
        })
    }

    // Detener transmisión
    async stopTransmission(): Promise<void> {
        if (!this.audioProcessor) return

        // Reducir ganancia
        this.audioProcessor.gainNode.gain.value = 0.0
        
        // Notificar a todas las conexiones
        this.connections.forEach(connection => {
            if (connection.isConnected && connection.dataChannel.readyState === 'open') {
                connection.dataChannel.send(JSON.stringify({
                    type: 'voice-activity',
                    isActive: false
                }))
            }
        })
    }

    // Susurro a usuario específico
    async whisperTo(targetUserId: string): Promise<void> {
        const connection = this.connections.get(targetUserId)
        if (!connection || !connection.isConnected) {
            throw new Error('No hay conexión con el usuario')
        }

        // Enviar mensaje de susurro
        connection.dataChannel.send(JSON.stringify({
            type: 'whisper',
            fromUserId: this.userId
        }))
    }

    // Cerrar conexión
    closeConnection(userId: string): void {
        const connection = this.connections.get(userId)
        if (connection) {
            connection.peerConnection.close()
            connection.dataChannel.close()
            this.connections.delete(userId)
        }
    }

    // Cerrar todas las conexiones
    closeAllConnections(): void {
        this.connections.forEach((_, userId) => {
            this.closeConnection(userId)
        })
    }

    // Conectar a servidor de señalización
    connectToSignalingServer(url: string): void {
        this.signalingSocket = new WebSocket(url)

        this.signalingSocket.onopen = () => {
            console.log('Conectado al servidor de señalización')
        }

        this.signalingSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                this.handleSignalingMessage(message)
            } catch (error) {
                console.error('Error procesando mensaje de señalización:', error)
            }
        }

        this.signalingSocket.onerror = (error) => {
            console.error('Error en WebSocket:', error)
        }

        this.signalingSocket.onclose = () => {
            console.log('Desconectado del servidor de señalización')
        }
    }

    // Manejar mensaje de señalización
    private handleSignalingMessage(message: any): void {
        switch (message.type) {
            case 'offer':
                this.handleOffer(message.offer, message.fromUserId, message.radioId)
                break
            case 'answer':
                this.handleAnswer(message.answer, message.fromUserId)
                break
            case 'ice-candidate':
                this.handleIceCandidate(message.candidate, message.fromUserId)
                break
            default:
                console.log('Mensaje de señalización desconocido:', message)
        }
    }

    // Obtener estadísticas de conexión
    async getConnectionStats(userId: string): Promise<RTCStatsReport> {
        const connection = this.connections.get(userId)
        if (!connection) throw new Error('Conexión no encontrada')

        return await connection.peerConnection.getStats()
    }

    // Detectar nivel de voz
    getVoiceLevel(): number {
        if (!this.audioProcessor) return 0

        const analyser = this.audioProcessor.analyser
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)

        // Calcular promedio de niveles
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
        }
        return sum / dataArray.length / 255 // Normalizar a 0-1
    }

    // Limpiar recursos
    cleanup(): void {
        this.closeAllConnections()
        
        if (this.signalingSocket) {
            this.signalingSocket.close()
        }

        if (this.audioProcessor) {
            this.audioProcessor.processor.disconnect()
            this.audioProcessor.source.disconnect()
            this.audioProcessor.context.close()
        }
    }
}
