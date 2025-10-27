import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Package, ChefHat, Heart } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { HomeScreen } from '@/screens/HomeScreen';
import { StorageScreen } from '@/screens/StorageScreen';
import { RecipesScreen } from '@/screens/RecipesScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import type { AppTabsParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = {
          Home,
          Storage: Package,
          Recipes: ChefHat,
          Favorites: Heart,
        } as const;

        const Icon = icons[route.name as keyof typeof icons];

        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: `${colors.text}88`,
          tabBarStyle: {
            height: 64,
            paddingBottom: 12,
            paddingTop: 8,
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
    </Tab.Navigator>
  );
};
