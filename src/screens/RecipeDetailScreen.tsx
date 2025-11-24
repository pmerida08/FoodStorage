import { useTranslation } from "@/lib/i18n";
import { getRecipeById, type Recipe } from "@/lib/supabase/recipesService";
import type { RootStackParamList } from "@/navigation/types";
import type { ThemeColors } from "@/providers/ThemeProvider";
import { useThemeMode } from "@/providers/ThemeProvider";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Clock, Sparkles, Users } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Route = RouteProp<RootStackParamList, "RecipeDetail">;

export const RecipeDetailScreen = () => {
  const route = useRoute<Route>();
  const { id } = route.params;
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await getRecipeById(id);
        setRecipe(data);
      } catch (error) {
        console.error("Failed to load recipe", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.textPrimary }}>Recipe not found</Text>
      </View>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Sparkles size={48} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>
                {recipe.cook_time ? `${recipe.cook_time} ` : "30"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={18} color={colors.textSecondary} />
              <Text style={styles.metaLabel}>
                {recipe.servings || 2} {t("recipes.servings")}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{recipe.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recipes.ingredients")}</Text>
          <View style={styles.card}>
            {ingredients.map((ingredient: any, index: number) => (
              <View key={`ing-${index}`} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.item}>
                  {typeof ingredient === "string"
                    ? ingredient
                    : JSON.stringify(ingredient)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recipes.steps")}</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step: any, index: number) => (
              <View key={`step-${index}`} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.item}>
                  {typeof step === "string" ? step : JSON.stringify(step)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: "100%",
      height: 300,
      resizeMode: "cover",
    },
    imagePlaceholder: {
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      marginTop: -24,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor: colors.background,
      paddingTop: 32,
    },
    header: {
      paddingHorizontal: 24,
      marginBottom: 24,
      gap: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
      lineHeight: 34,
    },
    metaRow: {
      flexDirection: "row",
      gap: 24,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    metaLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    section: {
      paddingHorizontal: 24,
      marginBottom: 24,
      gap: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      gap: 12,
    },
    ingredientRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    stepsContainer: {
      gap: 20,
    },
    stepRow: {
      flexDirection: "row",
      gap: 16,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    stepNumberText: {
      color: colors.primaryContrast,
      fontWeight: "700",
      fontSize: 14,
    },
    item: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
  });
