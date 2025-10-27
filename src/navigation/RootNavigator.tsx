import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import type { RootStackParamList } from '@/navigation/types';
import { AppTabs } from '@/navigation/AppTabs';
import { AuthScreen } from '@/screens/AuthScreen';
import { AddItemScreen } from '@/screens/AddItemScreen';
import { RecipeDetailScreen } from '@/screens/RecipeDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
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

const LoadingState = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

export const RootNavigator = () => {
  const { user, loading } = useAuth();

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
              options={{ presentation: 'modal', headerShown: true, title: 'Add Item' }}
            />
            <Stack.Screen
              name="RecipeDetail"
              component={RecipeDetailScreen}
              options={{ headerShown: true, title: 'Recipe' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

