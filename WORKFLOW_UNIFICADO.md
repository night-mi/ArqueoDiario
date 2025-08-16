# 🚀 Workflow Unificado - ArqueoDiario

Sistema de build completo para desarrollo web y compilación de APK con múltiples opciones de deployment.

## 📋 Comandos Disponibles

### 🔧 Desarrollo
```bash
./build-unified.sh dev
# Inicia servidor de desarrollo en puerto 5000
```

### 🌐 Producción Web
```bash
./build-unified.sh build    # Solo generar build
./build-unified.sh web      # Ejecutar servidor web
```

### 📱 Android APK
```bash
./build-unified.sh android      # Preparar proyecto Android
./build-unified.sh apk-local    # Compilar APK localmente
./build-unified.sh apk-cloud    # Preparar para compilación en nube
```

### ❓ Ayuda
```bash
./build-unified.sh help     # Mostrar todas las opciones
```

---

## 🎯 Flujos de Trabajo Completos

### 1️⃣ Para Desarrollo Local
```bash
# Opción A: Script unificado
./build-unified.sh dev

# Opción B: NPM directo
npm run dev
```

### 2️⃣ Para Deploy Web
```bash
# Generar build optimizado
./build-unified.sh build

# Ejecutar en producción
./build-unified.sh web
```

### 3️⃣ Para APK - Compilación Local
```bash
# Preparar Android (automático)
./build-unified.sh apk-local

# Requisitos previos:
# - Android Studio instalado
# - ANDROID_HOME configurado
# - Java 17 configurado
```

### 4️⃣ Para APK - Compilación en Nube
```bash
# Preparar proyecto
./build-unified.sh apk-cloud

# El script te guiará a las opciones:
# - Ionic Appflow (recomendado)
# - CodeMagic
# - GitHub Actions
```

---

## 🛠️ Funciones del Script Unificado

### ✅ Verificación Automática
- Chequea dependencias (Node.js, npm, Capacitor)
- Valida configuración de Android SDK
- Verifica builds existentes

### 🔄 Build Inteligente
- Genera build web si no existe
- Sincroniza automáticamente con Capacitor
- Optimiza assets para móvil

### 📱 Compatibilidad Total
- **Capacitor 6.1.2** - Última versión estable
- **Android SDK 35** - Target más reciente
- **Java 17** - Versión LTS recomendada
- **Gradle 8.11.1** - Automáticamente descargado

### 🌐 Múltiples Opciones de Deploy

#### **🥇 Ionic Appflow (Recomendado)**
```bash
./build-unified.sh apk-cloud
# Sigue las instrucciones para Ionic Appflow
```
- Builds profesionales en 5-10 minutos
- Firma automática de APK
- Integración directa con GitHub

#### **🥈 CodeMagic**
```bash
./build-unified.sh apk-cloud
# Selecciona opción CodeMagic
```
- Interfaz visual intuitiva
- Plantillas predefinidas para Capacitor
- 500 minutos gratis mensuales

#### **🥉 GitHub Actions**
- Workflow automático ya configurado
- Build en runners de GitHub
- APK disponible en artifacts

#### **⚙️ Local con Android Studio**
```bash
./build-unified.sh apk-local
```
- Control total del proceso
- Debugging avanzado
- Firma personalizada

---

## 📂 Estructura de Archivos

```
arqueo-diario/
├── build-unified.sh       # ← Script principal unificado
├── android/              # Proyecto Android (Capacitor)
├── dist/                 # Build web de producción  
│   └── public/          # Assets web para Capacitor
├── client/              # Frontend React + TypeScript
├── server/              # Backend Express + TypeScript
├── capacitor.config.ts  # Configuración móvil
└── package.json        # Dependencias y scripts
```

---

## 🔧 Variables de Entorno

### Para Compilación Local
```bash
export ANDROID_HOME=/path/to/Android/Sdk
export JAVA_HOME=/path/to/java-17
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Para Desarrollo
```bash
NODE_ENV=development
PORT=5000
```

### Para Producción
```bash
NODE_ENV=production
PORT=80
```

---

## 🚨 Solución de Problemas

### Error: "SDK location not found"
```bash
# Instalar Android Studio
# Configurar ANDROID_HOME
./build-unified.sh apk-local
```

### Error: "Gradle build failed"
```bash
# Limpiar cache
cd android
./gradlew clean
cd ..
./build-unified.sh android
```

### Error: "No se encontró build web"
```bash
# El script lo resuelve automáticamente
./build-unified.sh android  # Genera build si falta
```

---

## 📱 APK Final

Al completar cualquier flujo de compilación obtienes:

**📱 ArqueoDiario.apk**
- ✅ Sistema de arqueos de 5 pasos
- ✅ Funcionamiento 100% offline
- ✅ Generación de PDFs profesionales
- ✅ Gestión editable de trabajadores
- ✅ Diseño responsive optimizado
- ✅ Compatible con Android 7.0+ (API 24+)

---

## 🎯 Recomendaciones

### Para Desarrollo Rápido
```bash
./build-unified.sh dev
```

### Para APK Inmediato
```bash
./build-unified.sh apk-cloud
# Usar Ionic Appflow
```

### Para Control Total
```bash
./build-unified.sh apk-local
# Con Android Studio configurado
```

---

*El workflow unificado es compatible con todas las versiones de Android, métodos de compilación y opciones de deployment documentadas hasta el momento.*