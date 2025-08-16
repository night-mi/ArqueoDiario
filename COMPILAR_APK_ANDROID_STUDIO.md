# 🏗️ Compilar ArqueoDiario con Android Studio

## ✅ Proyecto Configurado

Tu proyecto ArqueoDiario está completamente configurado para Android Studio:

- **✅ SDK Target**: Android 35 (más reciente)
- **✅ Min SDK**: Android 23 (compatible con 95% de dispositivos)
- **✅ Java**: Compatible con versiones 11 y 17
- **✅ Gradle**: 8.11.1 (última versión estable)
- **✅ Dependencies**: AndroidX actualizado

## 🚀 Pasos para Compilar

### 1. Abrir en Android Studio
```bash
# Opción A: Desde línea de comandos
studio android/

# Opción B: Desde Android Studio
File → Open → Seleccionar carpeta 'android/'
```

### 2. Esperar Sincronización
- Android Studio detectará automáticamente el proyecto Gradle
- Esperará a que descargue dependencias (primera vez puede tardar 5-10 min)
- Verifica que no hay errores en la pestaña "Build"

### 3. Compilar APK
```bash
# En terminal de Android Studio o externo:
cd android
./gradlew assembleDebug
```

**O usando la interfaz:**
- Build → Build Bundle(s) / APK(s) → Build APK(s)

### 4. Encontrar APK
El APK se genera en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔧 Solución de Problemas Comunes

### Error: "SDK location not found"
```bash
# Configurar manualmente en android/local.properties:
sdk.dir=/path/to/Android/Sdk
```

### Error: "Java version incompatible"
```bash
# Usar Java 17 (recomendado)
export JAVA_HOME=/path/to/java-17
```

### Error: "Build tools version"
```bash
# En Android Studio → Tools → SDK Manager
# Instalar Build Tools 35.0.0
```

### Error: "Platform not found"
```bash
# En SDK Manager instalar:
# - Android 14 (API 35) ← Target
# - Android 6.0 (API 23) ← Minimum
```

## 📱 Resultado Final

Al completar la compilación tendrás:

**📱 ArqueoDiario.apk** (~15-20 MB)
- Sistema completo de arqueos de 5 pasos
- Funcionamiento 100% offline
- Generación de PDFs profesionales
- Compatibilidad Android 6.0+

## 🎯 Configuración Optimizada

El proyecto incluye optimizaciones específicas:
- **Proguard**: Deshabilitado para debugging
- **R8**: Optimización básica habilitada
- **Vector Drawables**: Soporte completo
- **Packaging**: Conflictos resueltos automáticamente

