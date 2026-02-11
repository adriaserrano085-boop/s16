import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.rclh.s16',
    appName: 'RCLH - S16',
    webDir: 'dist',
    server: {
        // Uncomment the line below for live reload during development
        // url: 'http://YOUR_LOCAL_IP:5173',
        cleartext: true,
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined,
        },
    },
    ios: {
        contentInset: 'automatic',
    },
};

export default config;
