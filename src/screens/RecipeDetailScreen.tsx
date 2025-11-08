import { useMemo, useEffect, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { translateRecipe } from '@/lib/i18n/contentTranslation';

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
  const { language } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [translatedRecipe, setTranslatedRecipe] = useState(originalRecipe);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const loadTranslation = async () => {
      setIsTranslating(true);
      try {
        const translated = await translateRecipe(originalRecipe, language);
        setTranslatedRecipe(translated);
      } catch (error) {
        console.error('Error translating recipe:', error);
        setTranslatedRecipe(originalRecipe);
      } finally {
        setIsTranslating(false);
      }
    };

    loadTranslation();
  }, [language, recipeKey]);

  if (isTranslating) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('recipes.translating') || 'Translating...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{translatedRecipe.name}</Text>
        <Text style={styles.description}>{translatedRecipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.ingredients')}</Text>
        {translatedRecipe.ingredients?.map((ingredient: string, index: number) => (
          <Text key={`${ingredient}-${index}`} style={styles.item}>
            - {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.steps')}</Text>
        {translatedRecipe.steps?.map((step: string, index: number) => (
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
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
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
