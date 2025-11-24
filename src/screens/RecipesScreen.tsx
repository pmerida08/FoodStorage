import { useTranslation } from '@/lib/i18n';
import { getUserRecipes } from '@/lib/supabase/recipesService';
import { getStorageItems } from '@/lib/supabase/storageService';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { generateSmartRecipes } from '@/services/n8n';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock, Search, Sparkles, Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SmartRecipe } from '@/services/n8n';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const RecipesScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const { colors } = useThemeMode();
  const { t, locale } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SmartRecipe[]>([]);

  const fetchRecipes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const userRecipes = await getUserRecipes(user.id);
      const mappedRecipes: SmartRecipe[] = userRecipes.map((r) => ({
        id: r.id,
        name: r.name,
        matchScore: 100,
        time: r.cook_time ? `${r.cook_time}` : '30',
        servings: r.servings || 2,
        missing: 0,
        image_url: r.image_url || undefined,
      }));
      setRecipes(mappedRecipes);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const filtered = useMemo(
    () => recipes.filter((recipe) => recipe.name.toLowerCase().includes(query.toLowerCase())),
    [query, recipes],
  );

  const handleGenerate = async () => {
    if (!user?.id) return;
    
    setGenerating(true);
    try {
      const storageItems = await getStorageItems(user.id);
      const ingredients = storageItems.map(item => item.name);
      
      const newRecipes = await generateSmartRecipes(ingredients, user.id, locale);
      
      if (newRecipes.length > 0) {
        setRecipes(prev => [...newRecipes, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('recipes.title')}</Text>
              <View style={styles.searchWrapper}>
                <Search size={18} color={colors.inputPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('recipes.searchPlaceholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.search}
                />
              </View>
              <TouchableOpacity
                style={[styles.generateButton, generating && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={generating}
              >
                <Sparkles size={18} color={colors.highlightButtonText} />
                <Text style={styles.generateLabel}>
                  {generating ? t('recipes.generating') : t('recipes.generateSmart')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>{t('recipes.suggestedRecipes')}</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>
                  {filtered.length} {t('recipes.matches')}
                </Text>
              </View>
            </View>
          </>
        }
        ListHeaderComponentStyle={styles.listHeader}
        ItemSeparatorComponent={() => <View style={styles.spacer} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Sparkles size={32} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.match}>
                  <Text style={styles.matchValue}>{item.matchScore}%</Text>
                  <Text style={styles.matchLabel}>{t('recipes.match')}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={styles.metaLabel}>{item.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Users size={16} color={colors.textMuted} />
                  <Text style={styles.metaLabel}>
                    {item.servings} {t('recipes.servings')}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.missingBadge,
                  item.missing === 0
                    ? { backgroundColor: colors.successSoft, borderColor: colors.success }
                    : { backgroundColor: colors.warningSoft, borderColor: colors.warning },
                ]}
              >
                <Text
                  style={[
                    styles.missingLabel,
                    item.missing === 0 ? { color: colors.success } : { color: colors.warning },
                  ]}
                >
                  {item.missing === 0
                    ? t('recipes.allIngredientsAvailable')
                    : `${item.missing} ${t('recipes.ingredientsNeeded')}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      backgroundColor: colors.highlightBackground,
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 36,
      gap: 16,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.highlightText,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    search: {
      flex: 1,
      color: colors.inputText,
      fontSize: 16,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.highlightButton,
      borderRadius: 14,
      paddingVertical: 16,
    },
    generateLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.highlightButtonText,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    resultsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    resultsBadge: {
      backgroundColor: colors.secondarySoft,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    resultsBadgeText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    listHeader: { paddingBottom: 24 },
    card: {
      marginHorizontal: 24,
      backgroundColor: colors.surface,
      borderRadius: 18,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: 180,
      resizeMode: 'cover',
    },
    cardImagePlaceholder: {
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      padding: 20,
      gap: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingRight: 16,
    },
    match: {
      alignItems: 'flex-end',
    },
    matchValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.secondary,
    },
    matchLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    metaLabel: {
      color: colors.textSecondary,
    },
    missingBadge: {
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignSelf: 'flex-start',
      borderWidth: 1,
    },
    missingLabel: {
      fontWeight: '600',
    },
    spacer: { height: 16 },
  });
