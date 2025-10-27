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
import { Calendar, Package2, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const mockItems = [
  { id: '1', name: 'Chicken Breast', quantity: '500g', expiryDate: '2025-11-05', status: 'fresh' },
  { id: '2', name: 'Milk', quantity: '1L', expiryDate: '2025-10-28', status: 'expiring' },
  { id: '3', name: 'Pasta', quantity: '2 packages', expiryDate: '2026-03-15', status: 'fresh' },
  { id: '4', name: 'Ground Beef', quantity: '400g', expiryDate: '2025-10-27', status: 'expiring' },
  { id: '5', name: 'Cheddar Cheese', quantity: '200g', expiryDate: '2025-11-10', status: 'fresh' },
] as const;

const statusConfig = {
  fresh: { label: 'Fresh', backgroundColor: '#22c55e33', color: '#16a34a' },
  expiring: { label: 'Expiring Soon', backgroundColor: '#f9731633', color: '#ea580c' },
  expired: { label: 'Expired', backgroundColor: '#ef444433', color: '#b91c1c' },
} as const;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const StorageScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return mockItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Storage</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search items..."
              placeholderTextColor="#94a3b8"
              style={styles.search}
            />
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
                    <Package2 size={20} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.quantity}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: status.backgroundColor, borderColor: status.color + '55' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Calendar size={16} color="#475569" />
                <Text style={styles.cardFooterText}>
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem')}
        accessibilityLabel="Add new item"
      >
        <Plus size={24} color="#0f172a" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  search: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  list: {
    paddingBottom: 96,
  },
  listHeader: { paddingBottom: 24 },
  separator: { height: 16 },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0f172a',
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
    backgroundColor: '#2563eb22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardSubtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
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
    color: '#475569',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
