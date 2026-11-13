import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.demonslayers.breathoftheabyss',
  appName: 'Demon Slayers: Breath of the Abyss',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#050811',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
