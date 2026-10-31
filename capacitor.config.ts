import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fx.davinci',
  appName: 'FX Da Vinci',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#09090b'
  }
};

export default config;
