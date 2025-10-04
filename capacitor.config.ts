import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blueprint.fitness',
  appName: 'Blueprint Fitness',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;