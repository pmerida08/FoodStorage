import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChefHat, Package, Refrigerator, Snowflake, TrendingUp } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/types';

const storageData = [
  { id: 'freezer', name: 'Freezer', items: 12, expiringSoon: 2, icon: Snowflake, color: '#38bdf8' },
  { id: 'fridge', name: 'Fridge', items: 18, expiringSoon: 4, icon: Refrigerator, color: '#34d399' },
  { id: 'larder', name: 'Larder', items: 24, expiringSoon: 1, icon: Package, color: '#facc15' },
];

type Navigation = BottomTabNavigationProp<AppTabsParamList, 'Home'>;

export const HomeScreen = () => {
  const navigation = useNavigation<Navigation>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={['#0f172a', '#1e3a8a']} style={styles.hero}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Let's manage your food storage</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Storage</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>7 expiring soon</Text>
            </View>
          </View>

          {storageData.map((storage) => (
            <TouchableOpacity
              key={storage.id}
              style={styles.card}
              onPress={() => navigation.navigate('Storage')}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconWrapper, { backgroundColor: `${storage.color}22` }]}>
                  <storage.icon size={24} color={storage.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{storage.name}</Text>
                  <Text style={styles.cardSubtitle}>{storage.items} items</Text>
                </View>
                {storage.expiringSoon > 0 && (
                  <View style={styles.expiringBadge}>
                    <Text style={styles.expiringText}>{storage.expiringSoon} expiring</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.highlightCard}>
            <View style={styles.highlightIcon}>
              <TrendingUp size={28} color="#22d3ee" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.highlightTitle}>Generate Smart Recipes</Text>
              <Text style={styles.highlightSubtitle}>
                AI will suggest recipes based on what you have in stock.
              </Text>
              <TouchableOpacity
                style={styles.highlightButton}
                onPress={() => navigation.navigate('Recipes')}
              >
                <ChefHat size={18} color="#0f172a" />
                <Text style={styles.highlightButtonText}>Get Recipe Ideas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#1d4ed8' }]}>
              <Text style={styles.statValue}>54</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#22d3ee' }]}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#f8fafc',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5f5',
  },
  body: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#facc1533',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  badgeText: {
    color: '#ca8a04',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
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
    color: '#0f172a',
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#475569',
  },
  expiringBadge: {
    backgroundColor: '#f9731633',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  expiringText: {
    color: '#ea580c',
    fontWeight: '600',
  },
  highlightCard: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    gap: 16,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#22d3ee33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  highlightSubtitle: {
    color: '#94a3b8',
    marginBottom: 12,
  },
  highlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22d3ee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  highlightButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 20,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  statLabel: {
    color: '#e2e8f0',
  },
});
