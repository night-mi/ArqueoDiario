# 🔧 Solución de Errores Ionic Appflow

## Error: "Build failed - No package.json found"
**Causa:** Ionic no encuentra la configuración del proyecto
**Solución:**
1. Verificar que package.json esté en la raíz del repositorio
2. Re-sync el repositorio en Settings → Git

## Error: "Build failed - npm install failed"
**Causa:** Dependencias no se instalaron correctamente
**Solución:**
1. En Build settings, cambiar a: `npm ci --legacy-peer-deps`
2. O usar: `npm install --force`

## Error: "No Capacitor configuration found"
**Causa:** No detecta capacitor.config.ts
**Solución:**
1. Verificar que capacitor.config.ts esté en la raíz
2. Cambiar webDir en config a: `"dist"`

## Error: "Build command failed"
**Causa:** Script de build no funciona
**Solución:**
1. Usar build command: `npm run build:mobile` o `npm run build`
2. Verificar que el script genere archivos en `dist/`

## Error: "Android platform not found"
**Causa:** Capacitor no ha añadido Android
**Solución:**
1. En Build settings, añadir pre-build script:
   ```bash
   npx cap add android
   npx cap sync android
   ```

## Error: "appflow.config.json missing entry for appId" ⭐ ERROR ACTUAL
**Causa:** Ionic Appflow busca un appId específico en la configuración
**Solución:**
1. Usar el formato correcto con el appId exacto de Appflow:
   ```json
   {
     "0f6b3473": {
       "integrations": {
         "capacitor": {
           "android": {
             "compileSdkVersion": 35,
             "targetSdkVersion": 34
           }
         }
       }
     }
   }
   ```

## Error: "compileSdk 34 vs required 35" ⭐ ERROR ANTERIOR
**Causa:** Dependencias Android requieren compileSdk 35 pero Appflow usa 34
**Solución:**
1. Crear `appflow.config.json` con compileSdk 35:
   ```json
   {
     "apps": [{
       "appId": "com.gasolinera.arqueos",
       "integrations": {
         "capacitor": {
           "android": {
             "compileSdkVersion": 35,
             "targetSdkVersion": 34
           }
         }
       }
     }]
   }
   ```
2. Crear `variables.gradle` con versiones compatibles
3. Subir a GitHub y retry build

## Error: "Workspace not configured"
**Causa:** Ionic no reconoce la estructura del proyecto
**Solución:**
1. Crear archivo `ionic.config.json`:
   ```json
   {
     "name": "AqueoDiario",
     "integrations": {
       "capacitor": {}
     },
     "type": "custom"
   }
   ```