# 📱 Cómo Compilar ArqueoDiario con Android Studio

## 📋 Antes de Empezar

Tu proyecto ArqueoDiario ya está configurado correctamente. Solo necesitas seguir estos pasos.

---

## 🛠️ Paso 1: Instalar Android Studio

### Descargar Android Studio
1. Ve a [developer.android.com/studio](https://developer.android.com/studio)
2. Descarga la versión para tu sistema operativo
3. Instala siguiendo el asistente

### Primera Configuración
Al abrir Android Studio por primera vez:
1. Selecciona "Standard" installation
2. Acepta las licencias
3. Espera a que descargue los componentes (puede tardar 15-30 minutos)

---

## 🔧 Paso 2: Abrir el Proyecto

### Abrir ArqueoDiario
1. Abre Android Studio
2. En la pantalla de bienvenida, selecciona **"Open an Existing Project"**
3. Navega hasta tu carpeta de ArqueoDiario
4. **IMPORTANTE**: Selecciona la carpeta **`android`** (NO la raíz del proyecto)
5. Haz clic en "OK"

### Lo que Pasará Automáticamente
- Android Studio detectará que es un proyecto Gradle
- Comenzará a sincronizar (esto puede tardar 5-10 minutos)
- Descargará dependencias automáticamente
- En la parte inferior verás una barra de progreso

---

## ⏳ Paso 3: Esperar la Sincronización

### Qué Observar
- **Barra inferior**: "Gradle sync in progress..."
- **Panel "Build"**: Mensajes de descarga de dependencias
- **Sin errores rojos**: Si aparecen, revisa el Paso 4

### Tiempo Esperado
- **Primera vez**: 10-15 minutos
- **Siguientes**: 2-3 minutos

---

## 🚀 Paso 4: Compilar el APK

### Método 1: Usando el Menú (Fácil)
1. En la barra de menú, haz clic en **"Build"**
2. Selecciona **"Build Bundle(s) / APK(s)"**
3. Selecciona **"Build APK(s)"**
4. Espera a que termine (5-10 minutos)

### Método 2: Usando Terminal (Avanzado)
1. En Android Studio, abre el terminal (View → Tool Windows → Terminal)
2. Ejecuta:
```bash
./gradlew assembleDebug
```

---

## 📁 Paso 5: Encontrar tu APK

### Ubicación del APK
Después de compilar, tu APK estará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Desde Android Studio
1. Cuando termine la compilación, aparecerá una notificación
2. Haz clic en **"Reveal in Finder"** (Mac) o **"Show in Explorer"** (Windows)
3. O navega manualmente a la carpeta mencionada arriba

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "SDK location not found"
**Solución:**
1. Ve a File → Project Structure
2. En "SDK Location", configura la ruta del Android SDK
3. Normalmente es: `/Users/TuNombre/Library/Android/sdk` (Mac) o `C:\Users\TuNombre\AppData\Local\Android\Sdk` (Windows)

### Error: "Failed to find target"
**Solución:**
1. Ve a Tools → SDK Manager
2. En la pestaña "SDK Platforms", instala "Android 14 (API 35)"
3. En "SDK Tools", asegúrate de tener "Android SDK Build-Tools 35.0.0"

### Error de Java/Gradle
**Solución:**
1. Ve a File → Settings → Build → Build Tools → Gradle
2. En "Gradle JDK", selecciona Java 17 o 11

### Sincronización Lenta
**Es normal la primera vez**. Si tarda más de 30 minutos:
1. Ve a File → Invalidate Caches and Restart
2. Selecciona "Invalidate and Restart"

---

## 🎯 Verificar que Todo Funciona

### Antes de Compilar
Asegúrate de que:
- No hay errores rojos en el panel "Build"
- La sincronización de Gradle terminó exitosamente
- Puedes ver la estructura del proyecto en el panel izquierdo

### Después de Compilar
Tu APK debe:
- Tener un tamaño aproximado de 15-20 MB
- Instalarse correctamente en dispositivos Android 6.0+
- Mostrar "ArqueoDiario" como nombre de la app

---

## 📱 Instalar el APK

### En tu Teléfono Android
1. Transfiere el archivo `app-debug.apk` a tu teléfono
2. Ve a Configuración → Seguridad → Instalar apps de fuentes desconocidas
3. Activa la opción para tu explorador de archivos
4. Busca el archivo APK y tócalo para instalar

### En Emulador
1. En Android Studio, ve a Tools → AVD Manager
2. Crea un emulador si no tienes uno
3. Arrastra el APK sobre el emulador abierto

---

## ✅ Resumen Rápido

1. **Instalar** Android Studio
2. **Abrir** la carpeta `android` del proyecto
3. **Esperar** la sincronización de Gradle
4. **Build → Build APK(s)**
5. **Encontrar** APK en `android/app/build/outputs/apk/debug/`
6. **Instalar** en tu dispositivo

---

## 🆘 Si Tienes Problemas

1. **Revisa** que abriste la carpeta `android` (no la raíz)
2. **Asegúrate** de tener conexión a internet para descargas
3. **Verifica** que tienes al menos 8GB de RAM libre
4. **Consulta** los errores específicos en el panel "Build"

El proyecto ArqueoDiario está configurado para funcionar sin problemas. Si sigues estos pasos, tendrás tu APK listo en 20-30 minutos.