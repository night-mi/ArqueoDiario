#!/bin/bash

echo "🔧 Construyendo aplicación para Android..."

# Construir la aplicación web
echo "📦 Compilando aplicación web..."
npm run build

# Copiar archivos a Android
echo "📋 Sincronizando archivos con Android..."
npx cap copy android
npx cap sync android

# Navegar al directorio android y compilar APK
echo "🚀 Generando APK..."
cd android

# Compilar APK debug
./gradlew assembleDebug

echo "✅ APK generado exitosamente!"
echo "📱 El archivo APK se encuentra en: android/app/build/outputs/apk/debug/app-debug.apk"

# Volver al directorio raíz
cd ..

echo "🎉 Proceso completado. Tu aplicación de arqueos está lista para instalar en Android!"