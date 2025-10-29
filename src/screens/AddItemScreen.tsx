import { useMemo, useState } from 'react';
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
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const AddItemScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { showToast } = useToast();
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Breast"
            placeholderTextColor={colors.inputPlaceholder}
            value={form.name}
            onChangeText={(value) => setField('name', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500g or 2 pieces"
            placeholderTextColor={colors.inputPlaceholder}
            value={form.quantity}
            onChangeText={(value) => setField('quantity', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Storage Location</Text>
          <TextInput
            style={styles.input}
            placeholder="freezer, fridge, larder..."
            placeholderTextColor={colors.inputPlaceholder}
            value={form.location}
            onChangeText={(value) => setField('location', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.inputPlaceholder}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      color: colors.textPrimary,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.inputText,
    },
    submit: {
      marginTop: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitText: {
      color: colors.primaryContrast,
      fontSize: 16,
      fontWeight: '700',
    },
  });
