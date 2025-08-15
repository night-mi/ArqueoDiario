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

## Error: Versiones Incompatibles

### **Problema:**
- Gradle version mismatch
- Android SDK version conflicts
- Java compatibility issues

### **Solución:**
Versiones probadas y compatibles:

```yaml
Java: 17 (LTS)
Android SDK: 34 (Stable)
Gradle: 8.6.1 (Compatible)
Capacitor: 6.1.2 (Latest)
Node.js: 20 (LTS)
```

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
`build-apk-simple.yml`

**Características:**
- ✅ Licencias pre-aceptadas
- ✅ Limpieza automática de plataforma
- ✅ Versiones compatibles
- ✅ Sin procesos interactivos
- ✅ Timeout adecuado (45 min)

**Resultado esperado:**
- APK de ~15-20 MB
- Compatible Android 7.0+
- Descarga desde GitHub Artifacts
- Instalación directa en dispositivo