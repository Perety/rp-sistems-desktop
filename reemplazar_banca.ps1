# Script para reemplazar el archivo de banca
$origen = "src\app\(dashboard)\banca\page.tsx"
$destino = "src\app\(dashboard)\banca\page-original.tsx"
$nuevo = "src\app\(dashboard)\banca\page.tsx"

# Copiar archivo original
Copy-Item $origen $destino -Force

# Reemplazar con el nuevo archivo integrado
Copy-Item $nuevo $origen -Force

Write-Host "✅ Archivo de banca reemplazado con el sistema integrado"
Write-Host "📍 Original guardado como: page-original.tsx"
Write-Host "📍 Nuevo sistema en: page.tsx"
Write-Host ""
Write-Host "🚀 Ahora ejecuta 'npm run dev' para probar el sistema completo"
