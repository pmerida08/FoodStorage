module.exports = {
  expo: {
    name: 'FoodStorage',
    slug: 'FoodStorage',
    version: '0.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'foodstorage',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pmerida.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.pmerida.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-secure-store'],
    extra: {
      translationApiKey: process.env.EXPO_PUBLIC_TRANSLATION_API_KEY,
      eas: {
        projectId: '14ee0f97-ef2c-460f-b5d3-7c8f060891b8',
      },
    },
    owner: 'pmerida',
  },
};
