const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

let mainWindow
let serverProcess

function startServer() {
  // Iniciar servidor integrado
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'pipe'
  })
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`Servidor: ${data}`)
  })
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Error servidor: ${data}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    titleBarStyle: 'hiddenInset'
  })

  // Esperar a que el servidor inicie
  setTimeout(() => {
    // Cargar la aplicación web local
    mainWindow.loadURL('http://localhost:3001')
  }, 2000)

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Radio',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-radio')
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload()
          }
        },
        {
          label: 'Herramientas de Desarrollador',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: 'Radio',
      submenu: [
        {
          label: 'Conectar a Radio',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.send('connect-radio')
          }
        },
        {
          label: 'Desconectar',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('disconnect-radio')
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de RP-SISTEMS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de RP-SISTEMS',
              message: 'RP-SISTEMS v1.0.0\nSistema de Radio y Comunicación\n\nDesarrollado con ❤️ por el equipo',
              buttons: ['OK']
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  startServer()
  createWindow()
  createMenu()
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Manejar actualizaciones
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
  })
})
