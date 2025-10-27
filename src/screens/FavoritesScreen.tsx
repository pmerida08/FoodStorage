import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Clock, Users } from 'lucide-react-native';

const favorites = [
  { id: '1', name: 'Spaghetti Carbonara', time: '20 min', servings: 2 },
  { id: '2', name: 'Greek Salad', time: '10 min', servings: 4 },
  { id: '3', name: 'Chocolate Brownies', time: '35 min', servings: 8 },
] as const;

export const FavoritesScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Favorite Recipes</Text>
            <Text style={styles.subtitle}>{favorites.length} saved recipes</Text>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Heart size={20} color="#ef4444" />
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={16} color="#475569" />
                <Text style={styles.metaLabel}>{item.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={16} color="#475569" />
                <Text style={styles.metaLabel}>{item.servings} servings</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Heart size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Start saving recipes you love.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  listHeader: { paddingBottom: 24 },
  separator: { height: 16 },
  header: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fef2f2',
  },
  subtitle: {
    marginTop: 8,
    color: '#fee2e2',
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: '#0f172a',
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
    color: '#0f172a',
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
    color: '#475569',
  },
  emptyCard: {
    marginTop: 48,
    marginHorizontal: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    color: '#475569',
  },
});
