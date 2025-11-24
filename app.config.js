module.exports = {
  expo: {
    name: "FoodStorage",
    slug: "FoodStorage",
    version: "0.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "foodstorage",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pmerida.mobile",
      infoPlist: {
        NSCameraUsageDescription:
          "Allow FoodStorage to capture receipts so we can detect the products you bought.",
        NSPhotoLibraryUsageDescription:
          "Allow FoodStorage to read receipt photos so we can detect the products you bought.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.pmerida.mobile",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-secure-store",
      "expo-localization",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow FoodStorage to read receipt photos so we can detect the products you bought.",
          cameraPermission:
            "Allow FoodStorage to capture receipts so we can detect the products you bought.",
        },
      ],
    ],
    extra: {
      translationApiKey: process.env.EXPO_PUBLIC_TRANSLATION_API_KEY,
      ocrApiKey:
        process.env.EXPO_PUBLIC_OCR_API_KEY ||
        process.env.EXPO_PUBLIC_TRANSLATION_API_KEY,
      eas: {
        projectId: "14ee0f97-ef2c-460f-b5d3-7c8f060891b8",
      },
    },
    owner: "pmerida",
  },
};
