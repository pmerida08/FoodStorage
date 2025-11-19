import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import type { RootStackParamList } from '@/navigation/types';
import { AppTabs } from '@/navigation/AppTabs';
import { AuthScreen } from '@/screens/AuthScreen';
import { AddItemScreen } from '@/screens/AddItemScreen';
import { RecipeDetailScreen } from '@/screens/RecipeDetailScreen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useTranslation } from '@/lib/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563eb',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  },
};

const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#60a5fa',
    background: '#0f172a',
    card: '#1f2937',
    text: '#f1f5f9',
    border: '#334155',
  },
};

const LoadingState = () => {
  const { colors } = useThemeMode();
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export const RootNavigator = () => {
  const { user, loading } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useTranslation();

  const navigationTheme = mode === 'dark' ? darkNavigationTheme : lightNavigationTheme;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen
              name="AddItem"
              component={AddItemScreen}
              options={{ presentation: 'modal', headerShown: true, title: t('addItem.addItem') }}
            />
            <Stack.Screen
              name="RecipeDetail"
              component={RecipeDetailScreen}
              options={{ headerShown: true, title: t('recipes.title') }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
