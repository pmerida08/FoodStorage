import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useToast } from '@/providers/ToastProvider';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const AddItemScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    location: '',
    expiryDate: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    setSaving(true);
    // Placeholder for Supabase mutation.
    setTimeout(() => {
      setSaving(false);
      showToast({ title: 'Item added', message: `${form.name} saved to ${form.location}` });
      navigation.goBack();
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Breast"
            placeholderTextColor="#94a3b8"
            value={form.name}
            onChangeText={(value) => setField('name', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500g or 2 pieces"
            placeholderTextColor="#94a3b8"
            value={form.quantity}
            onChangeText={(value) => setField('quantity', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Storage Location</Text>
          <TextInput
            style={styles.input}
            placeholder="freezer, fridge, larder..."
            placeholderTextColor="#94a3b8"
            value={form.location}
            onChangeText={(value) => setField('location', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={form.expiryDate}
            onChangeText={(value) => setField('expiryDate', value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submit, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitText}>{saving ? 'Saving...' : 'Add Item'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  submit: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
});

