# install.ps1
# Script de automatización de arquitectura SDD para Windows (PowerShell)

$repoUrl = "https://raw.githubusercontent.com/TU_USUARIO/game-sdd-plugin/main"
$rulesDir = "./.ai-rules"

Write-Host "🚀 Iniciando instalación de Stack-Architecture & SDD Enforcer..." -ForegroundColor Cyan

# 1. Crear la carpeta oculta de reglas si no existe
if (!(Test-Path $rulesDir)) {
    New-Item -ItemType Directory -Force -Path $rulesDir | Out-Null
    Write-Host "📁 Carpeta $rulesDir creada exitosamente." -ForegroundColor Green
}

# 2. Definir los archivos a descargar
$files = @{
    "templates/.claudeprompt"       = "./.claudeprompt"
    "templates/architecture-sdv.md"   = "$rulesDir/architecture-sdv.md"
    "templates/hierarchy-standard.md" = "$rulesDir/hierarchy-standard.md"
    "templates/definition-of-done.md" = "$rulesDir/definition-of-done.md"
    "templates/performance-standards.md" = "$rulesDir/performance-standards.md"
    "templates/ui-architecture.md"   = "$rulesDir/ui-architecture.md"
}

# 3. Descargar cada archivo desde el repositorio de GitHub
foreach ($source in $files.Keys) {
    $destination = $files[$source]
    $url = "$repoUrl/$source"
    
    Write-Host "📥 Descargando $source..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing
    } catch {
        Write-Host "❌ Error al descargar $source: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ ¡Instalación completada con éxito!" -ForegroundColor Green
Write-Host "💡 Ahora podés crear tu archivo 'feature.md' en la raíz y ejecutar /game-sdd" -ForegroundColor Cyan