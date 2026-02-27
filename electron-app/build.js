const fs = require('fs')
const path = require('path')

// Crear directorio de assets si no existe
const assetsDir = path.join(__dirname, 'assets')
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true })
}

// Copiar archivos necesarios para el build
const sourceDir = path.join(__dirname, '..')
const buildDir = path.join(__dirname, 'build')

// Copiar build de Next.js
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true })
  
  function copyRecursive(src, dest) {
    const exists = fs.existsSync(src)
    const stats = exists && fs.statSync(src)
    const isDirectory = exists && stats.isDirectory()
    
    if (isDirectory) {
      fs.mkdirSync(dest, { recursive: true })
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursive(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        )
      })
    } else {
      fs.copyFileSync(src, dest)
    }
  }
  
  // Copiar archivos del build
  if (fs.existsSync(path.join(sourceDir, '.next'))) {
    copyRecursive(path.join(sourceDir, '.next'), path.join(buildDir, '.next'))
  }
  
  // Copiar archivos públicos
  if (fs.existsSync(path.join(sourceDir, 'public'))) {
    copyRecursive(path.join(sourceDir, 'public'), path.join(buildDir, 'public'))
  }
  
  // Copiar package.json
  if (fs.existsSync(path.join(sourceDir, 'package.json'))) {
    fs.copyFileSync(
      path.join(sourceDir, 'package.json'),
      path.join(buildDir, 'package.json')
    )
  }
  
  console.log('✅ Build copiado exitosamente para Electron')
} else {
  console.log('❌ Error: El directorio build ya existe')
}
