import type { AppTabsParamList } from '@/navigation/types';
import { useThemeMode } from '@/providers/ThemeProvider';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RecipesScreen } from '@/screens/RecipesScreen';
import { StorageScreen } from '@/screens/StorageScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { ChefHat, Heart, Home, Package, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabs = () => {
  const { colors: navColors } = useTheme();
  const { colors } = useThemeMode();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = {
          Home,
          Storage: Package,
          Recipes: ChefHat,
          Favorites: Heart,
          Profile: User,
        } as const;

        const Icon = icons[route.name as keyof typeof icons];

        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: `${navColors.text}88`,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            borderRadius: 24,
            backgroundColor: colors.surface,
            height: 64,
            paddingBottom: 12,
            paddingTop: 8,
            shadowColor: colors.shadow,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Icon color={color} size={size ?? 22} />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Storage" component={StorageScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
