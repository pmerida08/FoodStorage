import { RouteProp, useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '@/navigation/types';

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
  const recipe = recipeDetails[recipeKey] ?? recipeDetails['1'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient: string) => (
          <Text key={ingredient} style={styles.item}>
            - {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Steps</Text>
        {recipe.steps.map((step: string, index: number) => (
          <Text key={step} style={styles.item}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
  },
  description: {
    color: '#475569',
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
    color: '#0f172a',
  },
  item: {
    color: '#1f2937',
    lineHeight: 22,
  },
});

