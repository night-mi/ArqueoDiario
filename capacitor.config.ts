import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gasolinera.arqueos',
  appName: 'AqueoDiario',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
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
