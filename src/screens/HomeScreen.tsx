import type { AppTabsParamList } from '@/navigation/types';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, Package, Refrigerator, Snowflake, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getStorageItemsByLocation, getStorageStatistics } from '@/lib/supabase/storageService';
import { useTranslation } from '@/lib/i18n';

type Navigation = BottomTabNavigationProp<AppTabsParamList, 'Home'>;

export const HomeScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useThemeMode();
  const { user } = useAuth();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: freezerItems = [] } = useQuery({
    queryKey: ['storage-items', user?.id, 'freezer'],
    queryFn: () => getStorageItemsByLocation(user!.id, 'freezer'),
    enabled: Boolean(user?.id),
  });

  const { data: fridgeItems = [] } = useQuery({
    queryKey: ['storage-items', user?.id, 'fridge'],
    queryFn: () => getStorageItemsByLocation(user!.id, 'fridge'),
    enabled: Boolean(user?.id),
  });

  const { data: larderItems = [] } = useQuery({
    queryKey: ['storage-items', user?.id, 'larder'],
    queryFn: () => getStorageItemsByLocation(user!.id, 'larder'),
    enabled: Boolean(user?.id),
  });

  const { data: statistics } = useQuery({
    queryKey: ['storage-statistics', user?.id],
    queryFn: () => getStorageStatistics(user!.id),
    enabled: Boolean(user?.id),
  });

  const getExpiringSoonCount = (items: any[]) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return items.filter((item) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate > now && expiryDate <= sevenDaysFromNow;
    }).length;
  };

  const storageData = useMemo(
    () => [
      {
        id: 'freezer',
        name: t('home.freezer'),
        items: freezerItems.length,
        expiringSoon: getExpiringSoonCount(freezerItems),
        icon: Snowflake,
        color: '#38bdf8',
      },
      {
        id: 'fridge',
        name: t('home.fridge'),
        items: fridgeItems.length,
        expiringSoon: getExpiringSoonCount(fridgeItems),
        icon: Refrigerator,
        color: '#34d399',
      },
      {
        id: 'larder',
        name: t('home.larder'),
        items: larderItems.length,
        expiringSoon: getExpiringSoonCount(larderItems),
        icon: Package,
        color: '#facc15',
      },
    ],
    [freezerItems, fridgeItems, larderItems, t],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <LinearGradient colors={colors.heroGradient} style={styles.hero}>
          <Text style={styles.greeting}>{t('home.welcome')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.yourStorage')}</Text>
            {statistics && statistics.expiringSoon > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {statistics.expiringSoon} {t('home.expiringSoon')}
                </Text>
              </View>
            )}
          </View>

          {storageData.map((storage) => (
            <TouchableOpacity key={storage.id} style={styles.card} onPress={() => navigation.navigate('Storage')}>
              <View style={styles.cardContent}>
                <View style={[styles.iconWrapper, { backgroundColor: `${storage.color}22` }]}>
                  <storage.icon size={24} color={storage.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{storage.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {storage.items} {t('home.items')}
                  </Text>
                </View>
                {storage.expiringSoon > 0 && (
                  <View style={styles.expiringBadge}>
                    <Text style={styles.expiringText}>
                      {storage.expiringSoon} {t('home.expiring')}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.highlightCard}>
            <View style={styles.highlightIcon}>
              <TrendingUp size={28} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.highlightTitle}>{t('home.smartRecipes')}</Text>
              <Text style={styles.highlightSubtitle}>{t('home.smartRecipesDesc')}</Text>
              <TouchableOpacity
                style={styles.highlightButton}
                onPress={() => navigation.navigate('Recipes')}
              >
                <ChefHat size={18} color={colors.highlightButtonText} />
                <Text style={styles.highlightButtonText}>{t('home.getRecipeIdeas')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.manageCards} onPress={() => navigation.navigate('Cards')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.manageCardsTitle}>{t('home.manageCards')}</Text>
              <Text style={styles.manageCardsSubtitle}>{t('home.openCards')}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.statValue}>{statistics?.totalItems || 0}</Text>
              <Text style={styles.statLabel}>{t('home.totalItems')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
              <Text style={styles.statValue}>{statistics?.expiringSoon || 0}</Text>
              <Text style={styles.statLabel}>{t('home.expiringSoon')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    hero: {
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 48,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.headerSubtitle,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.headerSubtitle,
    },
    body: {
      padding: 24,
      gap: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    badge: {
      backgroundColor: colors.warningSoft,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    badgeText: {
      color: colors.warningText,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconWrapper: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      marginTop: 4,
      color: colors.textSecondary,
    },
    expiringBadge: {
      backgroundColor: colors.warningSoft,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    expiringText: {
      color: colors.warningText,
      fontWeight: '600',
    },
    highlightCard: {
      borderRadius: 20,
      padding: 20,
      backgroundColor: colors.highlightBackground,
      flexDirection: 'row',
      gap: 16,
    },
    highlightIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.secondarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightTitle: {
      color: colors.highlightText,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    highlightSubtitle: {
      color: colors.highlightMuted,
      marginBottom: 12,
    },
    highlightButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.highlightButton,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    highlightButtonText: {
      color: colors.highlightButtonText,
      fontWeight: '700',
    },
    manageCards: {
      marginTop: 16,
      marginHorizontal: 24,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    manageCardsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    manageCardsSubtitle: {
      marginTop: 4,
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    statCard: {
      flex: 1,
      borderRadius: 18,
      padding: 20,
      marginBottom: 30,
    },
    statValue: {
      color: colors.textInverse,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
    },
    statLabel: {
      color: colors.textInverse,
    },
  });
