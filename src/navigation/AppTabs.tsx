import type { AppTabsParamList } from '@/navigation/types';
import { useThemeMode } from '@/providers/ThemeProvider';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RecipesScreen } from '@/screens/RecipesScreen';
import { StorageScreen } from '@/screens/StorageScreen';
import { CardsScreen } from '@/screens/CardsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { ChefHat, FileText, Heart, Home, Package, User } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTranslation } from '@/lib/i18n';

const Tab = createBottomTabNavigator<AppTabsParamList>();

type AnimatedTabLabelProps = {
  focused: boolean;
  label: string;
  color: string;
};

const AnimatedTabLabel = ({ focused, label, color }: AnimatedTabLabelProps) => {
  const opacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(focused ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.5,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacity, scale]);

  return (
    <Animated.Text
      style={{
        fontSize: 12,
        color,
        opacity,
        transform: [{ scale }],
      }}
    >
      {label}
    </Animated.Text>
  );
};

export const AppTabs = () => {
  const { colors: navColors } = useTheme();
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const tabLabels = {
    Home: t('navigation.home'),
    Storage: t('navigation.storage'),
    Recipes: t('navigation.recipes'),
    Cards: t('navigation.cards'),
    Favorites: t('navigation.favorites'),
    Profile: t('navigation.profile'),
  } as const;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = {
          Home,
          Storage: Package,
          Recipes: ChefHat,
          Cards: FileText,
          Favorites: Heart,
          Profile: User,
        } as const;

        const Icon = icons[route.name as keyof typeof icons];
        const label = tabLabels[route.name as keyof typeof tabLabels];

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
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Icon color={color} size={size ?? 22} />
          ),
          tabBarLabel: ({ focused, color }: { focused: boolean; color: string }) => (
            <AnimatedTabLabel focused={focused} label={label} color={color} />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Storage" component={StorageScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Cards" component={CardsScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
