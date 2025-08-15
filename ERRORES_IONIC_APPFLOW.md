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