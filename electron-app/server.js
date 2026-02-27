const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos de la app
app.use(express.static(path.join(__dirname, '../')));

// Almacenamiento en memoria para usuarios y mensajes
let users = [];
let messages = [];
let radioChannels = [];

// Canales de radio por defecto
const defaultChannels = [
  { id: 'general', name: 'General', type: 'public', users: [] },
  { id: 'privado', name: 'Privado', type: 'private', users: [] },
  { id: 'emergencia', name: 'Emergencia', type: 'emergency', users: [] },
  { id: 'policia', name: 'Policía', type: 'private', users: [] },
  { id: 'medicos', name: 'Médicos', type: 'private', users: [] }
];

radioChannels = [...defaultChannels];

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  // Unir usuario a canales por defecto
  socket.emit('channels', radioChannels);
  socket.emit('messages', messages);
  
  // Manejar unión a canal de radio
  socket.on('join-channel', (channelId) => {
    const channel = radioChannels.find(ch => ch.id === channelId);
    if (channel) {
      // Salir de canales anteriores
      radioChannels.forEach(ch => {
        ch.users = ch.users.filter(id => id !== socket.id);
      });
      
      // Unir al nuevo canal
      channel.users.push(socket.id);
      socket.join(channelId);
      
      // Notificar a todos
      io.emit('channel-updated', radioChannels);
      io.to(channelId).emit('user-joined', { userId: socket.id, channel });
    }
  });
  
  // Manejar mensajes de radio
  socket.on('radio-message', (data) => {
    const userChannel = radioChannels.find(ch => ch.users.includes(socket.id));
    if (userChannel) {
      io.to(userChannel.id).emit('radio-broadcast', {
        userId: socket.id,
        message: data.message,
        timestamp: new Date(),
        channel: userChannel
      });
    }
  });
  
  // Manejar susurros privados
  socket.on('whisper', (data) => {
    io.to(data.targetUserId).emit('whisper-received', {
      fromUserId: socket.id,
      message: data.message,
      timestamp: new Date()
    });
  });
  
  // Desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    // Remover usuario de todos los canales
    radioChannels.forEach(ch => {
      ch.users = ch.users.filter(id => id !== socket.id);
    });
    io.emit('channel-updated', radioChannels);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor RP-SISTEMS corriendo en puerto ${PORT}`);
  console.log(`Accede a http://localhost:${PORT} para usar la aplicación`);
});
