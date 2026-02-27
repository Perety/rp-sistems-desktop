# 🚀 Instrucciones de Configuración RP Platform

## 📋 PASO 1: Configurar Node.js (si no funciona)

### Reiniciar Terminal
Cierra y abre nuevamente PowerShell o CMD como Administrador

### Verificar instalación
```bash
node --version
npm --version
```

### Si no funciona, agregar al PATH manualmente:
1. Busca "Variables de entorno" en Windows
2. Click en "Variables de entorno..."
3. En "Variables del sistema", busca "Path"
4. Click "Editar" → "Nuevo"
5. Agrega: `C:\Program Files\nodejs\`
6. Acepta todo y reinicia terminal

---

## 📋 PASO 2: Instalar Dependencias

```bash
cd c:\Users\peret\Desktop\RP-SISTEMS
npm install
```

### Si hay errores de paquetes:
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

---

## 📋 PASO 3: Configurar Base de Datos Supabase

### 1. Ir a Supabase
- Ve a: https://kstfpirukfifnmpoxbto.supabase.co
- Inicia sesión

### 2. Ejecutar Schema
1. Click en "SQL Editor" en el menú izquierdo
2. Click "New query"
3. Copia TODO el contenido del archivo `schema.sql`
4. Click "Run" para ejecutar

### 3. Verificar Tablas
- Ve a "Table Editor"
- Deberías ver todas las tablas creadas

---

## 📋 PASO 4: Probar con Live Server

### Opción A: HTML Demo (Listo para usar)
1. Abre VS Code
2. Instala extensión "Live Server"
3. Click derecho en `index.html`
4. "Open with Live Server"
5. Abre http://localhost:5500

### Opción B: Next.js (Completo)
```bash
npm run dev
```
Abre http://localhost:3000

---

## 🎮 DEMO HTML Features

### ✅ Login Funcional
- Email: `admin@rpplatform.com`
- Password: `demo123`
- O usa cualquier email/password

### ✅ Dashboard Interactivo
- Estadísticas en tiempo real
- Animaciones fluidas
- Glassmorphism effects
- Responsive design

### ✅ Componentes Incluidos
- Login con validación
- Dashboard con stats
- Activity feed
- Quick actions
- Toast notifications

---

## 🔧 Si algo no funciona:

### Error de Node.js:
```bash
# Reinstalar Node.js (descargar de nodejs.org)
# O usar nvm-windows para gestionar versiones
```

### Error de npm:
```bash
npm install --force
# O
npm install --legacy-peer-deps
```

### Error de Supabase:
1. Verifica que el schema se ejecutó sin errores
2. Revisa las políticas RLS en Authentication > Policies

### Error de Live Server:
1. Asegúrate de tener la extensión instalada
2. Click derecho en index.html > "Open with Live Server"

---

## 📱 Para probar en móvil:

1. Conecta tu móvil y PC a la misma red WiFi
2. Encuentra tu IP local: `ipconfig` (busca IPv4)
3. En Live Server: Settings > Change Live Server port
4. Accede desde móvil: `http://TU_IP:5500`

---

## ✅ Checklist de Configuración:

- [ ] Node.js instalado y funcionando
- [ ] Dependencias instaladas (`npm install`)
- [ ] Schema ejecutado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Live Server funcionando con HTML demo
- [ ] Next.js funcionando (`npm run dev`)

---

## 🎯 Siguiente Paso:

Una vez que todo funcione, continuaremos con:
- Sistema de autenticación real con Supabase
- Panel de gestión de roles
- CAD/MDT Policial y Médico
- Sistema de banca web

**¡El proyecto está listo para probar!** 🚀
