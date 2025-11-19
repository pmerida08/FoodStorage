import { useMemo } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from '@/lib/i18n';

type Route = RouteProp<RootStackParamList, 'RecipeDetail'>;

const recipeDetails = {
  '1': {
    name: 'Creamy Chicken Pasta',
    description: 'A comforting pasta dish with tender chicken and rich cream sauce.',
    ingredients: ['Chicken breast', 'Pasta', 'Heavy cream', 'Parmesan', 'Garlic'],
    steps: [
      'Cook pasta until al dente.',
      'Sear chicken until golden and cooked through.',
      'Prepare cream sauce with garlic and parmesan.',
      'Combine pasta and chicken with sauce; serve warm.',
    ],
  },
  '2': {
    name: 'Beef Tacos',
    description: 'Quick tacos packed with seasoned beef and fresh toppings.',
    ingredients: ['Ground beef', 'Taco shells', 'Cheddar', 'Lettuce', 'Tomato'],
    steps: [
      'Brown the beef with your favourite taco seasoning.',
      'Warm taco shells in oven.',
      'Fill shells with beef and toppings.',
      'Serve immediately with salsa.',
    ],
  },
  '3': {
    name: 'Cheese Omelette',
    description: 'A fluffy omelette ready in minutes.',
    ingredients: ['Eggs', 'Cheddar', 'Butter', 'Chives'],
    steps: [
      'Whisk eggs with salt and pepper.',
      'Melt butter in a non-stick pan.',
      'Cook eggs until just set, add cheese, fold, and garnish.',
    ],
  },
} as const;

export const RecipeDetailScreen = () => {
  const route = useRoute<Route>();
  const recipeKey = (route.params.id ?? '1') as keyof typeof recipeDetails;
  const originalRecipe = recipeDetails[recipeKey] ?? recipeDetails['1'];
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const recipe = originalRecipe;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.ingredients')}</Text>
        {recipe.ingredients?.map((ingredient: string, index: number) => (
          <Text key={`${ingredient}-${index}`} style={styles.item}>
            - {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.steps')}</Text>
        {recipe.steps?.map((step: string, index: number) => (
          <Text key={`${step.substring(0, 20)}-${index}`} style={styles.item}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 12,
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    description: {
      color: colors.textSecondary,
      lineHeight: 20,
    },
    section: {
      paddingHorizontal: 24,
      paddingTop: 24,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    item: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
