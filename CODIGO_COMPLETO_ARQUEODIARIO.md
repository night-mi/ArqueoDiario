# 📱 ArqueoDiario - Código Completo

Sistema completo de gestión de arqueos de caja para gasolineras con interfaz web y móvil.

## 🚀 Estructura del Proyecto

```
ArqueoDiario/
├── client/                 # Frontend React
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── server/                 # Backend Express
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   └── vite.ts
├── shared/                 # Tipos compartidos
│   └── schema.ts
├── android/                # Proyecto Android (generado)
├── package.json            # Dependencias
├── vite.config.ts         # Configuración Vite
├── tailwind.config.ts     # Configuración Tailwind
├── tsconfig.json          # Configuración TypeScript
├── capacitor.config.ts    # Configuración Capacitor
├── ionic.config.json      # Configuración Ionic
└── appflow.config.json    # Configuración Appflow
```

## 📁 Archivos de Configuración

### package.json
```json
{
  "name": "arqueo-diario",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@capacitor/android": "^6.1.2",
    "@capacitor/cli": "^6.1.2",
    "@capacitor/core": "^6.1.2",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-button": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@tanstack/react-query": "^5.60.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "express": "^4.21.2",
    "framer-motion": "^11.13.1",
    "jspdf": "^3.0.1",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.453.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "wouter": "^3.3.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/express": "4.17.21",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### tsconfig.json
```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gasolinera.arqueos',
  appName: 'AqueoDiario',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#3498db',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3498db'
    }
  }
};

export default config;
```

### ionic.config.json
```json
{
  "name": "AqueoDiario",
  "integrations": {
    "capacitor": {}
  },
  "type": "custom"
}
```

### appflow.config.json
```json
{
  "0f6b3473": {
    "name": "AqueoDiario",
    "integrations": {
      "capacitor": {
        "android": {
          "minSdkVersion": 23,
          "compileSdkVersion": 35,
          "targetSdkVersion": 34
        }
      }
    },
    "environments": {
      "production": {
        "CAPACITOR_ANDROID_COMPILESDK": "35",
        "CAPACITOR_ANDROID_TARGETSDK": "34",
        "CAPACITOR_ANDROID_MINSDK": "23"
      }
    }
  }
}
```

### variables.gradle
```gradle
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.10.1'
    androidxFragmentVersion = '1.6.1'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.7.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 🌐 Frontend - Cliente React

### client/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>ArqueoDiario - Gestión de Arqueos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### client/src/main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### client/src/App.tsx
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { ReconciliationProvider } from "@/context/reconciliation-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ReconciliationProvider>
          <Toaster />
          <Router />
        </ReconciliationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(210 25% 7.8431%);
  --card: hsl(180 6.6667% 97.0588%);
  --card-foreground: hsl(210 25% 7.8431%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(210 25% 7.8431%);
  --primary: hsl(206.1 88.2% 53.1%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 25% 7.8431%);
  --secondary-foreground: hsl(0 0% 100%);
  --muted: hsl(240 1.9608% 90%);
  --muted-foreground: hsl(210 25% 7.8431%);
  --accent: hsl(122.4 39.4% 49.0%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(356.3033 90.5579% 54.3137%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(201.4286 30.4348% 90.9804%);
  --input: hsl(200 23.0769% 97.4510%);
  --ring: hsl(202.8169 89.1213% 53.1373%);
  --radius: 1.3rem;
  --font-sans: Inter, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Menlo, monospace;
}

.dark {
  --background: hsl(0 0% 0%);
  --foreground: hsl(200 6.6667% 91.1765%);
  --card: hsl(228 9.8039% 10%);
  --card-foreground: hsl(0 0% 85.0980%);
  --popover: hsl(0 0% 0%);
  --popover-foreground: hsl(200 6.6667% 91.1765%);
  --primary: hsl(206.1 88.2% 53.1%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(195.0000 15.3846% 94.9020%);
  --secondary-foreground: hsl(210 25% 7.8431%);
  --muted: hsl(0 0% 9.4118%);
  --muted-foreground: hsl(210 3.3898% 46.2745%);
  --accent: hsl(122.4 39.4% 49.0%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(356.3033 90.5579% 54.3137%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(210 5.2632% 14.9020%);
  --input: hsl(207.6923 27.6596% 18.4314%);
  --ring: hsl(202.8169 89.1213% 53.1373%);
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
    font-size: 12px;
  }
  
  .no-print {
    display: none !important;
  }
  
  .print-break {
    page-break-after: always;
  }
}
```

## 📚 Librerías Auxiliares

### client/src/lib/queryClient.ts
```typescript
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey as string);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      },
    },
  },
});

// Helper function for mutations
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    throw new Error(`API request failed: ${res.statusText}`);
  }
  
  return res.json();
}

export { queryClient };
```

### client/src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}
```

### client/src/lib/denominations.ts
```typescript
export interface Denomination {
  value: number;
  type: 'bill' | 'coin';
  label: string;
}

export const DENOMINATIONS: Denomination[] = [
  // Billetes
  { value: 500, type: 'bill', label: '500€' },
  { value: 200, type: 'bill', label: '200€' },
  { value: 100, type: 'bill', label: '100€' },
  { value: 50, type: 'bill', label: '50€' },
  { value: 20, type: 'bill', label: '20€' },
  { value: 10, type: 'bill', label: '10€' },
  { value: 5, type: 'bill', label: '5€' },
  
  // Monedas
  { value: 2, type: 'coin', label: '2€' },
  { value: 1, type: 'coin', label: '1€' },
  { value: 0.50, type: 'coin', label: '0,50€' },
  { value: 0.20, type: 'coin', label: '0,20€' },
  { value: 0.10, type: 'coin', label: '0,10€' },
  { value: 0.05, type: 'coin', label: '0,05€' },
  { value: 0.02, type: 'coin', label: '0,02€' },
  { value: 0.01, type: 'coin', label: '0,01€' },
];

export function calculateTotal(breakdown: Record<number, number>): number {
  return Object.entries(breakdown).reduce((total, [value, count]) => {
    return total + (parseFloat(value) * count);
  }, 0);
}

export function getBillDenominations(): Denomination[] {
  return DENOMINATIONS.filter(d => d.type === 'bill');
}

export function getCoinDenominations(): Denomination[] {
  return DENOMINATIONS.filter(d => d.type === 'coin');
}
```

## 📄 Continúo con más archivos...