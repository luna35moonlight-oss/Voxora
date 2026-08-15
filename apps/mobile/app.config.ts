import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Voxora',
    slug: 'voxora',
    version: '0.1.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'voxora',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B0614',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'za.co.voxora.app',
      infoPlist: {
        CFBundleDisplayName: 'Voxora',
        MinimumOSVersion: '16.4',
      },
    },
    android: {
      package: 'za.co.voxora.app',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#0B0614',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      softwareKeyboardLayoutMode: 'resize',
      // Required for local Metro / adb-reverse Rive validation hosts (http://127.0.0.1).
      usesCleartextTraffic: true,
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          android: { minSdkVersion: 29, usesCleartextTraffic: true },
          ios: { deploymentTarget: '16.4' },
        },
      ],
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000',
      minAndroidApi: 29,
      minIosVersion: '16.4',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  } as ExpoConfig;
};
