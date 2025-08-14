#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Creando versión portable de AqueoDiario para Windows...\n');

// Crear directorio para la versión portable
if (!fs.existsSync('portable')) {
  fs.mkdirSync('portable', { recursive: true });
}

try {
  // Construir la aplicación
  console.log('📦 Compilando aplicación web...');
  execSync('npm run build', { stdio: 'inherit' });

  // Copiar archivos necesarios
  console.log('\n📋 Creando versión portable...');
  
  // Copiar dist completo
  if (fs.existsSync('dist')) {
    execSync('cp -r dist portable/', { stdio: 'inherit' });
  }

  // Copiar package.json simplificado
  const portablePackage = {
    "name": "arqueo-diario-portable",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "node index.js"
    },
    "dependencies": {}
  };

  fs.writeFileSync('portable/package.json', JSON.stringify(portablePackage, null, 2));

  // Crear script de inicio para Windows con Node.js portable
  const windowsStartScript = `@echo off
title AqueoDiario - Sistema de Arqueos
cls
echo ===============================================
echo   AqueoDiario - Sistema de Arqueos
echo   Gasolinera El Alto  
echo ===============================================
echo.
echo Verificando Node.js...

REM Verificar si Node.js esta disponible
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor instale Node.js desde: https://nodejs.org
    echo O use la version con Node.js incluido
    echo.
    pause
    exit /b 1
)

echo Node.js encontrado correctamente
echo.
echo Iniciando servidor...
echo.
echo IMPORTANTE:
echo - La aplicacion se abrira automaticamente
echo - Funciona completamente SIN INTERNET  
echo - Para CERRAR: presiona Ctrl+C
echo.

REM Esperar 2 segundos antes de abrir navegador
timeout /t 2 /nobreak >nul
start "" http://localhost:5000

REM Ejecutar la aplicación
node index.js

echo.
echo La aplicacion se ha cerrado.
pause`;

  fs.writeFileSync('portable/IniciarAqueoDiario.bat', windowsStartScript);

  // Crear versión para sistemas Unix
  const unixStartScript = `#!/bin/bash
clear
echo "==============================================="
echo "  AqueoDiario - Sistema de Arqueos"
echo "  Gasolinera El Alto"
echo "==============================================="
echo ""
echo "Verificando Node.js..."

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo ""
    echo "ERROR: Node.js no está instalado"
    echo ""
    echo "Por favor instale Node.js desde: https://nodejs.org"
    echo ""
    read -p "Presiona Enter para salir..."
    exit 1
fi

echo "Node.js encontrado correctamente"
echo ""
echo "Iniciando servidor..."
echo ""
echo "IMPORTANTE:"
echo "- La aplicación se abrirá automáticamente"  
echo "- Funciona completamente SIN INTERNET"
echo "- Para CERRAR: presiona Ctrl+C"
echo ""

# Detectar sistema operativo y abrir navegador
sleep 2
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5000 2>/dev/null &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5000 2>/dev/null &
fi

# Ejecutar la aplicación
node index.js`;

  fs.writeFileSync('portable/iniciar-arqueo-diario.sh', unixStartScript);
  
  // Hacer ejecutable
  try {
    execSync('chmod +x portable/iniciar-arqueo-diario.sh');
  } catch (e) {
    // Ignorar error
  }

  // Crear README específico para la versión portable
  const readmePortable = `# AqueoDiario - Versión Portable

## 📱 Sistema de Arqueos para Gasolinera

### ✨ Características:
- ✅ Funciona completamente offline
- ✅ Flujo paso a paso guiado  
- ✅ Gestión editable de trabajadores
- ✅ Informes detallados con billetes y monedas
- ✅ Validación automática de diferencias
- ✅ Datos guardados localmente

### 📋 Requisitos:
- **Node.js 18 o superior** (descargar de https://nodejs.org)
- Funciona en Windows, Linux y Mac

### 🚀 Uso:

#### Windows:
1. Instalar Node.js si no lo tienes
2. Doble clic en \`IniciarAqueoDiario.bat\`
3. Se abrirá automáticamente en tu navegador

#### Linux/Mac:
1. Instalar Node.js si no lo tienes  
2. Ejecutar: \`./iniciar-arqueo-diario.sh\`
3. Se abrirá automáticamente en tu navegador

### 💡 Ventajas de esta versión:
- ✅ Más compatible con antivirus
- ✅ Menor tamaño de descarga
- ✅ Funciona con Node.js del sistema
- ✅ Más fácil de actualizar

### 🔧 Solución de problemas:

**"Node.js no está instalado":**
1. Descargar de https://nodejs.org
2. Instalar con configuración por defecto
3. Reiniciar el sistema
4. Intentar de nuevo

**"No se abre el navegador":**
- Abrir manualmente: http://localhost:5000

### 📞 URL de la aplicación:
Una vez iniciada, accede a: **http://localhost:5000**

¡Tu sistema de arqueos portable está listo!`;

  fs.writeFileSync('portable/README.md', readmePortable);

  console.log('\n✅ ¡Versión portable creada exitosamente!');
  console.log('\n📁 Archivos en la carpeta "portable":');
  
  const files = fs.readdirSync('portable');
  files.forEach(file => {
    if (fs.statSync(path.join('portable', file)).isFile()) {
      const filePath = path.join('portable', file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   📄 ${file} (${sizeKB} KB)`);
    } else {
      console.log(`   📁 ${file}/`);
    }
  });

  console.log('\n🎉 Versión portable de AqueoDiario lista!');
  console.log('   📦 Requiere Node.js instalado en el sistema');
  console.log('   🚀 Más compatible con Windows y antivirus');
  console.log('   💾 Tamaño mucho menor que los ejecutables');
  console.log('   🔧 Más fácil de mantener y actualizar');

} catch (error) {
  console.error('❌ Error creando versión portable:', error.message);
  process.exit(1);
}