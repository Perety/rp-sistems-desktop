const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de radio
  newRadio: () => ipcRenderer.send('new-radio'),
  connectRadio: () => ipcRenderer.send('connect-radio'),
  disconnectRadio: () => ipcRenderer.send('disconnect-radio'),
  
  // Sistema de archivos
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // Sistema de notificaciones
  showNotification: (title, body) => {
    new Notification(title, { body })
  },
  
  // Información de la aplicación
  getVersion: () => process.env.npm_package_version,
  
  // Control de ventana
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
})

// Escuchar eventos del main process
window.addEventListener('DOMContentLoaded', () => {
  // Notificar cuando la app está lista
  console.log('RP-SISTEMS Desktop App loaded')
})
