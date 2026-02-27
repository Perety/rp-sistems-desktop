# 🖥️ RP-SISTEMS Desktop App

Aplicación de escritorio para el sistema de radio y comunicación RP-SISTEMS.

## 🚀 Características de la App de Escritorio

### 📻 Sistema de Radio Nativo
- **Atajos de teclado** para control rápido
- **Notificaciones del sistema** para eventos importantes
- **Menú contextual** con acciones rápidas
- **Integración con el sistema** de notificaciones nativas
- **Ventana sin bordes** con diseño moderno

### 💬 Comunicación Mejorada
- **Susurros con notificaciones** nativas
- **Indicadores en la barra de tareas**
- **Sonidos del sistema** para eventos
- **Auto-arranque** con Windows/Mac/Linux
- **Minimización a bandeja** del sistema

### 🎨 Interfaz Optimizada
- **Rendimiento nativo** con Electron
- **Acceso directo** sin navegador
- **Integración perfecta** con el sistema operativo
- **Tema automático** según configuración del sistema
- **Soporte offline** con caché local

## 📦 Instalación

### Descarga Directa
1. **Descargar el instalador** para tu sistema operativo
2. **Ejecutar el instalador** y seguir las instrucciones
3. **Iniciar RP-SISTEMS** desde el menú de aplicaciones

### Manual (Desarrolladores)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/rp-sistems.git
cd rp-sistems/electron-app

# Instalar dependencias
npm install

# Construir la aplicación
npm run build

# Ejecutar en modo desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno
```env
# Configuración del servidor
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Configuración de la app
ELECTRON_IS_DEV=true
NODE_ENV=development
```

### Build para Producción
```bash
# Construir para Windows
npm run build:win

# Construir para macOS
npm run build:mac

# Construir para Linux
npm run build:linux

# Construir para todas las plataformas
npm run build
```

## 🎮 Uso de la Aplicación

### Primer Inicio
1. **Iniciar sesión** con tu cuenta
2. **Configurar canales** de radio
3. **Unirse a radios** disponibles
4. **Comunicarte** con otros usuarios

### Atajos de Teclado
- **Ctrl+N**: Nueva radio
- **Ctrl+R**: Recargar aplicación
- **F12**: Herramientas de desarrollador
- **Ctrl+Shift+R**: Conectar a radio
- **Ctrl+Shift+D**: Desconectar de radio
- **Ctrl+Q**: Salir de la aplicación

### Menú de Aplicación
- **Archivo**: Nueva radio, salir
- **Ver**: Recargar, herramientas de desarrollador
- **Radio**: Conectar, desconectar
- **Ayuda**: Acerca de RP-SISTEMS

## 📁 Estructura de Archivos

```
electron-app/
├── main.js              # Proceso principal de Electron
├── preload.js            # Script de precarga
├── package.json          # Configuración de la app
├── build.js              # Script de construcción
├── assets/               # Recursos de la app
│   ├── icon.png          # Icono de la aplicación
│   └── tray.png         # Icono de bandeja
├── dist/                 # Archivos de distribución
│   ├── win/             # Instaladores Windows
│   ├── mac/             # Paquetes macOS
│   └── linux/           # Paquetes Linux
└── README.md             # Esta documentación
```

## 🚀 Distribución

### Windows
- **Instalador NSIS** con asistente gráfico
- **Acceso directo** en menú inicio
- **Integración** con registro de Windows
- **Actualizaciones automáticas** incluidas

### macOS
- **Paquete DMG** con instalación drag-and-drop
- **Firma de código** para seguridad
- **Notificaciones** nativas de macOS
- **Integración** con dock y menú

### Linux
- **AppImage** portable
- **Paquete DEB** para Debian/Ubuntu
- **Instalador RPM** para RedHat/Fedora
- **Integración** con escritorios GTK/Qt

## 🛡️ Seguridad

### Aislamiento de Procesos
- **Context isolation** activado
- **Node integration** desactivado en renderer
- **Sandbox** para seguridad adicional
- **Preload script** seguro para comunicación

### Protección de Datos
- **Comunicación segura** entre procesos
- **Validación de entrada** en todos los canales
- **Cifrado local** de datos sensibles
- **Actualizaciones verificadas** con firma digital

## 🔧 Desarrollo

### Modo Desarrollo
```bash
# Iniciar con recarga automática
npm run dev

# Abrir herramientas de desarrollador
# Presionar F12 o usar el menú Ver
```

### Depuración
- **Console logs** del proceso principal
- **DevTools** para depurar renderer
- **Breakpoints** en código JavaScript
- **Network inspection** para llamadas API

### Testing
```bash
# Ejecutar pruebas unitarias
npm test

# Pruebas de integración
npm run test:integration

# Pruebas end-to-end
npm run test:e2e
```

## 📱 Características Especiales

### Integración con Sistema
- **Notificaciones nativas** del SO
- **Indicador en bandeja** del sistema
- **Auto-inicio** con el sistema
- **Asociación de archivos** (opcional)
- **Integración con explorador** de archivos

### Rendimiento
- **Optimización de memoria** con Electron
- **Caché inteligente** para respuestas rápidas
- **Lazy loading** de componentes pesados
- **Compresión de recursos** estáticos

### Accesibilidad
- **Lector de pantalla** compatible
- **Navegación por teclado** completa
- **Contraste alto** soportado
- **Zoom de interfaz** ajustable
- **Reducción de movimiento** respetada

## 🚀 Actualizaciones

### Sistema de Actualizaciones
- **Verificación automática** al iniciar
- **Descarga silenciosa** en segundo plano
- **Instalación con un clic**
- **Rollback automático** si falla
- **Notificaciones** de actualizaciones disponibles

### Configuración de Actualizaciones
```javascript
// En main.js
const { autoUpdater } = require('electron-updater')

autoUpdater.checkForUpdatesAndNotify()
autoUpdater.on('update-available', () => {
  // Notificar al usuario
})
```

## 📞 Soporte Técnico

### Problemas Comunes
- **App no inicia**: Verificar instalación de Node.js
- **Sin sonido**: Revisar permisos de micrófono
- **Conexión lenta**: Configurar firewall
- **Crashes frecuentes**: Actualizar drivers gráficos

### Reporte de Errores
- **Logs automáticos** guardados localmente
- **Reporte anónimo** de errores
- **Diagnóstico** del sistema
- **Recolección de métricas** de uso

---

## 🎮 **¡LISTO PARA USAR!**

**La aplicación de escritorio RP-SISTEMS está completa y lista para:**

- ✅ **Descargar e instalar** en cualquier sistema operativo
- ✅ **Usar sin navegador** directamente en escritorio
- ✅ **Comunicación en tiempo real** con otros usuarios
- ✅ **Sistema de radio completo** con PTT
- ✅ **Susurros privados** con notificaciones
- ✅ **Actualizaciones automáticas** y seguridad
- ✅ **Rendimiento nativo** optimizado

**Una experiencia profesional de escritorio para comunicación por radio, totalmente gratuita y con todas las características necesarias.**
