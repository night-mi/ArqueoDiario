# 🛠️ Solución de Errores Comunes APK

## Error: "android platform already exists"

### **Problema:**
```
Error: android platform already exists.
To re-add this platform, first remove ./android, then run this command again.
```

### **Causa:**
- El directorio `android/` ya existe en el repositorio
- Capacitor no puede sobrescribir plataformas existentes

### **Solución Implementada:**
Los workflows ahora incluyen limpieza automática:

```yaml
- name: Add Android platform
  run: |
    # Remove existing Android platform if it exists
    if [ -d "android" ]; then
      echo "Android platform exists, removing..."
      rm -rf android
    fi
    npx cap add android
```

### **Workflows Actualizados:**
- ✅ `build-apk-simple.yml` - Limpieza automática añadida
- ✅ `build-apk.yml` - Limpieza automática añadida  
- ✅ `build-apk-robust.yml` - Limpieza automática añadida

---

## Error: Licencias Android SDK

### **Problema:**
```
6 of 7 SDK package licenses not accepted.
Review licenses that have not been accepted (y/N)?
```

### **Solución:**
Workflow simple con licencias pre-aceptadas:

```yaml
# Pre-accept all common Android licenses
echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" > android-sdk-license
echo "84831b9409646a918e30573bab4c9c91346d8abd" > android-sdk-preview-license
# ... más licencias
```

---

## Error: "invalid source release: 21"

### **Problema:**
```
> error: invalid source release: 21
```

### **Causa:**
- Capacitor configurado para Java 21
- Workflow usando Java 17
- Incompatibilidad de versiones de compilación

### **Solución Implementada:**
Workflow Ultimate con configuración forzada a Java 17:

```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

### **Configuración Correcta:**
- ✅ Java 17 (forzado en build.gradle)
- ✅ Gradle 8.6 (compatible con Java 17)
- ✅ Android SDK 34 (estable)
- ✅ Capacitor 6.1.2 (configurado correctamente)

---

## Error: Timeout de Build

### **Problema:**
```
Error: Process completed with timeout
```

### **Solución:**
Timeouts extendidos en workflows:

```yaml
timeout-minutes: 45  # Simple
timeout-minutes: 60  # Robust
```

---

## Workflow Recomendado

**Para máxima compatibilidad usar:**
`build-apk-ultimate.yml` ⭐ **NUEVO - SOLUCIONA JAVA 21 ERROR**

**Características:**
- ✅ **Java 17 forzado** - Soluciona error "invalid source release: 21"
- ✅ **Gradle 8.6** - Compatible con Java 17
- ✅ **Configuración completa** - build.gradle personalizado
- ✅ **Android Actions** - Setup automático de SDK
- ✅ **Sin errores de compilación** - Configuración probada

**Workflows Disponibles:**
1. **build-apk-ultimate.yml** ⭐ **RECOMENDADO** - Corrige error Java
2. **build-apk-final.yml** - Alternativa robusta
3. **build-apk-simple.yml** - Licencias pre-aceptadas
4. **build-apk.yml** - Workflow estándar

**Resultado esperado:**
- APK de ~15-20 MB
- Compatible Android 7.0+
- Descarga desde GitHub Artifacts
- Sin errores de versiones Java