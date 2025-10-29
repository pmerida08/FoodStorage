import type { RootStackParamList } from '@/navigation/types';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, Package2, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockItems = [
  { id: '1', name: 'Chicken Breast', quantity: '500g', expiryDate: '2025-11-05', status: 'fresh' },
  { id: '2', name: 'Milk', quantity: '1L', expiryDate: '2025-10-28', status: 'expiring' },
  { id: '3', name: 'Pasta', quantity: '2 packages', expiryDate: '2026-03-15', status: 'fresh' },
  { id: '4', name: 'Ground Beef', quantity: '400g', expiryDate: '2025-10-27', status: 'expiring' },
  { id: '5', name: 'Cheddar Cheese', quantity: '200g', expiryDate: '2025-11-10', status: 'fresh' },
] as const;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const StorageScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const statusConfig = useMemo(
    () => ({
      fresh: { label: 'Fresh', backgroundColor: colors.successSoft, color: colors.success },
      expiring: { label: 'Expiring Soon', backgroundColor: colors.warningSoft, color: colors.warning },
      expired: { label: 'Expired', backgroundColor: colors.dangerSoft, color: colors.danger },
    }),
    [colors.danger, colors.dangerSoft, colors.success, colors.successSoft, colors.warning, colors.warningSoft],
  );

  const filtered = useMemo(() => {
    return mockItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Storage</Text>
            <View style={styles.searchWrapper}>
              <Search size={18} color={colors.inputPlaceholder} style={{ marginRight: 8 }} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search items..."
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.search}
              />
            </View>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const status = statusConfig[item.status as keyof typeof statusConfig];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <View style={styles.icon}>
                    <Package2 size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.quantity}</Text>
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
              <View style={styles.cardFooter}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={styles.cardFooterText}>
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
              </View>
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
    list: {
      paddingBottom: 160,
    },
    listHeader: { paddingBottom: 24 },
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
      alignItems: 'center',
    },
    cardTitleContainer: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    statusBadge: {
      borderWidth: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderColor: colors.border,
    },
    statusText: {
      fontWeight: '600',
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
  });
