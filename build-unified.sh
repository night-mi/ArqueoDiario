#!/bin/bash
set -e

echo "🚀 ArqueoDiario - Build Unificado"
echo "================================="

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./build-unified.sh [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  dev          Ejecutar servidor de desarrollo"
    echo "  build        Build para producción web"
    echo "  web          Ejecutar aplicación web"
    echo "  android      Preparar para APK Android"
    echo "  apk-local    Compilar APK localmente (requiere Android SDK)"
    echo "  apk-cloud    Preparar para compilación en la nube"
    echo "  help         Mostrar esta ayuda"
    echo ""
}

# Función para desarrollo
dev_mode() {
    echo "🔧 Iniciando servidor de desarrollo..."
    NODE_ENV=development npm run dev
}

# Función para build de producción
build_web() {
    echo "📦 Generando build de producción..."
    npm run build
    echo "✅ Build completado en ./dist/"
}

# Función para servidor web
web_server() {
    echo "🌐 Iniciando servidor web de producción..."
    if [ ! -d "dist" ]; then
        echo "❌ No se encontró build de producción. Ejecutando build..."
        build_web
    fi
    NODE_ENV=production npm start
}

# Función para preparar Android
prepare_android() {
    echo "📱 Preparando proyecto Android..."
    
    # Verificar si existe build web
    if [ ! -d "dist/public" ]; then
        echo "📦 Generando build web primero..."
        build_web
    fi
    
    # Sincronizar Capacitor
    echo "🔄 Sincronizando Capacitor..."
    npx cap sync android
    
    echo "✅ Proyecto Android listo en ./android/"
    echo ""
    echo "Siguientes pasos para APK:"
    echo "1. Local: ./build-unified.sh apk-local"
    echo "2. Cloud: ./build-unified.sh apk-cloud"
}

# Función para compilación local de APK
compile_apk_local() {
    echo "🏗️ Compilando APK localmente..."
    
    # Verificar Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo "❌ ANDROID_HOME no configurado"
        echo "📋 Pasos para configurar:"
        echo "1. Instalar Android Studio"
        echo "2. export ANDROID_HOME=/path/to/Android/Sdk"
        echo "3. export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        exit 1
    fi
    
    prepare_android
    
    echo "🔨 Compilando APK..."
    cd android
    ./gradlew assembleDebug
    cd ..
    
    echo "✅ APK generado:"
    find android -name "*.apk" -type f
}

# Función para preparación cloud
prepare_cloud_build() {
    echo "☁️ Preparando para compilación en la nube..."
    
    prepare_android
    
    echo ""
    echo "📋 Opciones de compilación en la nube:"
    echo ""
    echo "🥇 IONIC APPFLOW (Recomendado):"
    echo "   1. Subir código a GitHub"
    echo "   2. Ir a ionic.io/appflow"
    echo "   3. Conectar repositorio"
    echo "   4. Build automático"
    echo ""
    echo "🥈 CODEMAGIC:"
    echo "   1. Ir a codemagic.io"
    echo "   2. Usar plantilla 'Capacitor Android'"
    echo "   3. Build visual"
    echo ""
    echo "🥉 GITHUB ACTIONS:"
    echo "   1. Push a GitHub"
    echo "   2. Actions se ejecuta automáticamente"
    echo "   3. Descargar APK de artifacts"
    echo ""
    echo "✅ Proyecto listo para cualquier opción"
}

# Función para verificar dependencias
check_dependencies() {
    echo "🔍 Verificando dependencias..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no encontrado"
        exit 1
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm no encontrado"
        exit 1
    fi
    
    # Capacitor CLI
    if ! command -v cap &> /dev/null; then
        echo "⚠️ Capacitor CLI no encontrado globalmente, usando npx"
    fi
    
    echo "✅ Dependencias verificadas"
}

# Función principal
main() {
    case "$1" in
        "dev")
            check_dependencies
            dev_mode
            ;;
        "build")
            check_dependencies
            build_web
            ;;
        "web")
            check_dependencies
            web_server
            ;;
        "android")
            check_dependencies
            prepare_android
            ;;
        "apk-local")
            check_dependencies
            compile_apk_local
            ;;
        "apk-cloud")
            check_dependencies
            prepare_cloud_build
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo "❌ Opción no válida: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"