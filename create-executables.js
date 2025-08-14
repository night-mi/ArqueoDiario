#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Creando ejecutables autocontenidos para AqueoDiario...\n');

// Crear directorio para ejecutables
if (!fs.existsSync('executables')) {
  fs.mkdirSync('executables');
}

try {
  // Construir la aplicación primero
  console.log('📦 Compilando aplicación web...');
  execSync('npm run build', { stdio: 'inherit' });

  // Crear ejecutables con pkg
  console.log('\n🔧 Generando ejecutables para diferentes sistemas operativos...');
  
  const command = 'npx pkg dist/index.js --target node18-win-x64,node18-linux-x64,node18-macos-x64 --out-path executables';
  execSync(command, { stdio: 'inherit' });

  // Crear scripts de inicio
  console.log('\n📝 Creando scripts de inicio...');
  
  // Script para Windows
  const windowsScript = `@echo off
echo Iniciando AqueoDiario - Sistema de Arqueos...
echo.
echo La aplicacion se abrira en tu navegador en http://localhost:5000
echo.
echo Para cerrar la aplicacion, presiona Ctrl+C
echo.
start http://localhost:5000
index-win.exe
pause`;

  fs.writeFileSync('executables/IniciarAqueoDiario.bat', windowsScript);

  // Script para Linux/Mac
  const unixScript = `#!/bin/bash
echo "🚀 Iniciando AqueoDiario - Sistema de Arqueos..."
echo ""
echo "La aplicación se abrirá en tu navegador en http://localhost:5000"
echo ""
echo "Para cerrar la aplicación, presiona Ctrl+C"
echo ""

# Detectar sistema operativo y abrir navegador
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5000 2>/dev/null &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5000 2>/dev/null &
fi

# Ejecutar la aplicación
if [[ "$OSTYPE" == "darwin"* ]]; then
    ./index-macos
else
    ./index-linux
fi`;

  fs.writeFileSync('executables/iniciar-arqueo-diario.sh', unixScript);
  
  // Hacer ejecutable el script de Unix
  try {
    execSync('chmod +x executables/iniciar-arqueo-diario.sh');
  } catch (e) {
    // Ignorar error en Windows
  }

  // Crear archivo README
  const readmeContent = `# AqueoDiario - Sistema de Arqueos Ejecutable

## 📱 Aplicación de Arqueos para Gasolinera

### ✨ Características:
- ✅ Funciona completamente offline
- ✅ Flujo paso a paso guiado
- ✅ Formularios detallados para arqueo de euros
- ✅ Validación automática de diferencias
- ✅ Informes completos por turnos
- ✅ Gestión editable de trabajadores
- ✅ Desglose detallado de billetes y monedas

### 🚀 Uso:

#### Windows:
1. Doble clic en \`IniciarAqueoDiario.bat\`
2. Se abrirá automáticamente tu navegador
3. ¡Listo para usar!

#### Linux:
1. Abrir terminal en esta carpeta
2. Ejecutar: \`./iniciar-arqueo-diario.sh\`
3. O hacer doble clic en el archivo

#### Mac:
1. Abrir terminal en esta carpeta
2. Ejecutar: \`./iniciar-arqueo-diario.sh\`
3. O hacer doble clic en el archivo

### 📋 Archivos incluidos:
- \`index-win.exe\` - Ejecutable para Windows
- \`index-linux\` - Ejecutable para Linux
- \`index-macos\` - Ejecutable para Mac
- \`IniciarAqueoDiario.bat\` - Script de inicio para Windows
- \`iniciar-arqueo-diario.sh\` - Script de inicio para Linux/Mac

### 💡 Notas importantes:
- La aplicación funciona 100% offline
- Se abre en tu navegador en http://localhost:5000
- Los datos se guardan localmente
- Para cerrar, presiona Ctrl+C en la ventana de comandos

### 🔧 Compatibilidad:
- Windows 7/8/10/11 (64-bit)
- Linux (64-bit)
- macOS (64-bit)

¡Tu sistema de arqueos está listo para usar en cualquier computadora sin instalación!
`;

  fs.writeFileSync('executables/README.md', readmeContent);

  console.log('\n✅ ¡Ejecutables creados exitosamente!');
  console.log('\n📁 Archivos generados en la carpeta "executables":');
  
  const files = fs.readdirSync('executables');
  files.forEach(file => {
    const filePath = path.join('executables', file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   📄 ${file} (${sizeKB} KB)`);
  });

  console.log('\n🎉 Tu sistema AqueoDiario está listo como ejecutable!');
  console.log('   📦 Copia la carpeta "executables" a cualquier computadora');
  console.log('   🚀 Ejecuta el archivo de inicio correspondiente a tu sistema');
  console.log('   🌐 Se abrirá automáticamente en el navegador');

} catch (error) {
  console.error('❌ Error creando ejecutables:', error.message);
  process.exit(1);
}