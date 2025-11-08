import type { RootStackParamList } from '@/navigation/types';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, Package2, Plus, Search, Snowflake, Refrigerator, Package } from 'lucide-react-native';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getStorageItems, getItemStatus } from '@/lib/supabase/storageService';
import { useLanguage } from '@/providers/LanguageProvider';
import { translateText } from '@/lib/i18n/contentTranslation';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type TranslatedItem = ReturnType<typeof getStorageItems> extends Promise<infer T>
  ? T[number] & { translatedName: string }
  : never;

type LocationFilter = 'all' | 'freezer' | 'fridge' | 'larder';

export const StorageScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const locationConfig = useMemo(
    () => ({
      freezer: {
        name: t('home.freezer'),
        icon: Snowflake,
        color: '#38bdf8',
        backgroundColor: '#38bdf822',
      },
      fridge: {
        name: t('home.fridge'),
        icon: Refrigerator,
        color: '#34d399',
        backgroundColor: '#34d39922',
      },
      larder: {
        name: t('home.larder'),
        icon: Package,
        color: '#facc15',
        backgroundColor: '#facc1522',
      },
    }),
    [t],
  );

  const {
    data: items = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['storage-items', user?.id],
    queryFn: () => getStorageItems(user!.id),
    enabled: Boolean(user?.id),
  });

  const [translatedItems, setTranslatedItems] = useState<TranslatedItem[]>([]);

  useEffect(() => {
    const translateItems = async () => {
      const translated = await Promise.all(
        items.map(async (item) => ({
          ...item,
          translatedName: await translateText(item.name, language),
        })),
      );
      setTranslatedItems(translated);
    };

    if (items.length > 0) {
      translateItems();
    }
  }, [items, language]);

  const statusConfig = useMemo(
    () => ({
      fresh: { label: t('storage.fresh'), backgroundColor: colors.successSoft, color: colors.success },
      expiring: { label: t('storage.expiringSoon'), backgroundColor: colors.warningSoft, color: colors.warning },
      expired: { label: t('storage.expired'), backgroundColor: colors.dangerSoft, color: colors.danger },
    }),
    [colors.danger, colors.dangerSoft, colors.success, colors.successSoft, colors.warning, colors.warningSoft, t],
  );

  const filtered = useMemo(() => {
    let result = translatedItems;

    // Filter by location
    if (locationFilter !== 'all') {
      result = result.filter(
        (item) => item.storage_locations?.type === locationFilter,
      );
    }

    // Filter by search query
    if (query) {
      result = result.filter((item) =>
        item.translatedName.toLowerCase().includes(query.toLowerCase()),
      );
    }

    return result;
  }, [translatedItems, query, locationFilter]);

  if (isLoading && !items.length) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
            {t('storage.title')}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('storage.title')}</Text>
              <View style={styles.searchWrapper}>
                <Search size={18} color={colors.inputPlaceholder} style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('storage.searchPlaceholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.search}
                />
              </View>
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  locationFilter === 'all' && styles.filterButtonActive,
                  { borderColor: locationFilter === 'all' ? colors.primary : colors.border },
                ]}
                onPress={() => setLocationFilter('all')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    { color: locationFilter === 'all' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {t('common.all') || 'All'}
                </Text>
              </TouchableOpacity>

              {(Object.keys(locationConfig) as Array<keyof typeof locationConfig>).map((locType) => {
                const config = locationConfig[locType];
                const Icon = config.icon;
                const isActive = locationFilter === locType;

                return (
                  <TouchableOpacity
                    key={locType}
                    style={[
                      styles.filterButton,
                      isActive && styles.filterButtonActive,
                      { borderColor: isActive ? config.color : colors.border },
                    ]}
                    onPress={() => setLocationFilter(locType)}
                  >
                    <Icon size={16} color={isActive ? config.color : colors.textSecondary} />
                    <Text
                      style={[
                        styles.filterButtonText,
                        { color: isActive ? config.color : colors.textSecondary },
                      ]}
                    >
                      {config.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package2 size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No items yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add items to start tracking your food storage
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const itemStatus = getItemStatus(item.expiry_date);
          const status = statusConfig[itemStatus];
          const displayQuantity = item.quantity && item.unit ? `${item.quantity} ${item.unit}` : item.quantity || '';

          const locationType = item.storage_locations?.type as keyof typeof locationConfig;
          const locationInfo = locationConfig[locationType];
          const LocationIcon = locationInfo?.icon || Package2;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: locationInfo?.backgroundColor || colors.primarySoft,
                      },
                    ]}
                  >
                    <LocationIcon size={20} color={locationInfo?.color || colors.primary} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.translatedName}</Text>
                    <View style={styles.cardSubtitleRow}>
                      {displayQuantity ? <Text style={styles.cardSubtitle}>{displayQuantity}</Text> : null}
                      {displayQuantity && locationInfo && <Text style={styles.cardSubtitle}> • </Text>}
                      {locationInfo && (
                        <Text style={[styles.cardSubtitle, { color: locationInfo.color }]}>
                          {locationInfo.name}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: status.backgroundColor, borderColor: status.color },
                  ]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              {item.expiry_date && (
                <View style={styles.cardFooter}>
                  <Calendar size={16} color={colors.textMuted} />
                  <Text style={styles.cardFooterText}>
                    {t('storage.expires')}: {new Date(item.expiry_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddItem')} accessibilityLabel="Add new item">
        <Plus size={24} color={colors.fabIcon} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      backgroundColor: colors.highlightBackground,
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 36,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      gap: 16,
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
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexWrap: 'wrap',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      backgroundColor: colors.surface,
    },
    filterButtonActive: {
      backgroundColor: colors.surface,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    list: {
      paddingBottom: 160,
    },
    listHeader: { paddingBottom: 0 },
    separator: { height: 16 },
    card: {
      marginHorizontal: 24,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flex: 1,
    },
    cardTextContainer: {
      flex: 1,
      gap: 2,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    cardSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 2,
    },
    statusBadge: {
      borderWidth: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderColor: colors.border,
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    statusText: {
      fontWeight: '600',
      fontSize: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
    },
    cardFooterText: {
      color: colors.textSecondary,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 100,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.fabBackground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
    },
    loadingLabel: {
      fontSize: 15,
    },
    emptyState: {
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
    },
    emptySubtitle: {
      textAlign: 'center',
    },
  });
