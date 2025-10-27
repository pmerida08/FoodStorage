import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sparkles, Clock, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const mockRecipes = [
  { id: '1', name: 'Creamy Chicken Pasta', matchScore: 85, time: '25 min', servings: 4, missing: 2 },
  { id: '2', name: 'Beef Tacos', matchScore: 70, time: '20 min', servings: 3, missing: 3 },
  { id: '3', name: 'Cheese Omelette', matchScore: 95, time: '10 min', servings: 2, missing: 0 },
] as const;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const RecipesScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    return mockRecipes.filter((recipe) => recipe.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Recipe Generator</Text>
              <View style={styles.searchWrapper}>
                <Search size={18} color="#cbd5f5" style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search recipes..."
                  placeholderTextColor="#cbd5f5"
                  style={styles.search}
                />
              </View>
              <TouchableOpacity
                style={[styles.generateButton, generating && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={generating}
              >
                <Sparkles size={18} color="#0f172a" />
                <Text style={styles.generateLabel}>
                  {generating ? 'Generating...' : 'Generate Smart Recipes'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Suggested Recipes</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>{filtered.length} matches</Text>
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
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.match}>
                <Text style={styles.matchValue}>{item.matchScore}%</Text>
                <Text style={styles.matchLabel}>match</Text>
              </View>
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
            <View
              style={[
                styles.missingBadge,
                item.missing === 0
                  ? { backgroundColor: '#22c55e33', borderColor: '#16a34a55' }
                  : { backgroundColor: '#f9731633', borderColor: '#ea580c55' },
              ]}
            >
              <Text
                style={[
                  styles.missingLabel,
                  item.missing === 0 ? { color: '#15803d' } : { color: '#ea580c' },
                ]}
              >
                {item.missing === 0
                  ? 'All ingredients available'
                  : `${item.missing} ingredients needed`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#334155',
  },
  search: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#22d3ee',
    borderRadius: 14,
    paddingVertical: 16,
  },
  generateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
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
    color: '#0f172a',
  },
  resultsBadge: {
    backgroundColor: '#22d3ee33',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  resultsBadgeText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  listHeader: { paddingBottom: 24 },
  card: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    color: '#0f172a',
    paddingRight: 16,
  },
  match: {
    alignItems: 'flex-end',
  },
  matchValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22d3ee',
  },
  matchLabel: {
    fontSize: 12,
    color: '#475569',
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
