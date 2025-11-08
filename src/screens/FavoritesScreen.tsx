import { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Clock, Users } from 'lucide-react-native';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { translateText } from '@/lib/i18n/contentTranslation';

const favorites = [
  { id: '1', name: 'Spaghetti Carbonara', time: '20 min', servings: 2 },
  { id: '2', name: 'Greek Salad', time: '10 min', servings: 4 },
  { id: '3', name: 'Chocolate Brownies', time: '35 min', servings: 8 },
] as const;

type TranslatedFavorite = typeof favorites[number] & { translatedName: string };

export const FavoritesScreen = () => {
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [translatedFavorites, setTranslatedFavorites] = useState<TranslatedFavorite[]>(
    favorites.map((f) => ({ ...f, translatedName: f.name })),
  );

  useEffect(() => {
    const translateFavoriteNames = async () => {
      const translated = await Promise.all(
        favorites.map(async (favorite) => ({
          ...favorite,
          translatedName: await translateText(favorite.name, language),
        })),
      );
      setTranslatedFavorites(translated);
    };

    translateFavoriteNames();
  }, [language]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={translatedFavorites}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('favorites.title')}</Text>
            <Text style={styles.subtitle}>{favorites.length} {t('favorites.savedRecipes')}</Text>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.translatedName}</Text>
              <Heart size={20} color={colors.danger} />
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.textMuted} />
                <Text style={styles.metaLabel}>{item.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={16} color={colors.textMuted} />
                <Text style={styles.metaLabel}>{item.servings} {t('favorites.servings')}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Heart size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('favorites.noFavoritesTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('favorites.noFavoritesSubtitle')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    listHeader: { paddingBottom: 24 },
    separator: { height: 16 },
    header: {
      backgroundColor: colors.danger,
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 36,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.dangerText,
    },
    subtitle: {
      marginTop: 8,
      color: colors.dangerText,
    },
    card: {
      marginHorizontal: 24,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      gap: 16,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      paddingRight: 16,
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
    emptyCard: {
      marginTop: 48,
      marginHorizontal: 24,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      color: colors.textSecondary,
    },
  });
