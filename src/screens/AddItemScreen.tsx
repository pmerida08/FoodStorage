import { useMemo, useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorageLocations, createStorageItem } from '@/lib/supabase/storageService';
import { useLanguage } from '@/providers/LanguageProvider';
import { translateText } from '@/lib/i18n/contentTranslation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type TranslatedLocation = Awaited<ReturnType<typeof getStorageLocations>>[number] & {
  translatedName: string;
};

export const AddItemScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { showToast } = useToast();
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    storageLocationId: '',
    expiryDate: '',
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['storage-locations', user?.id],
    queryFn: () => getStorageLocations(user!.id),
    enabled: Boolean(user?.id),
  });

  const [translatedLocations, setTranslatedLocations] = useState<TranslatedLocation[]>([]);

  useEffect(() => {
    const translateLocationNames = async () => {
      const translated = await Promise.all(
        locations.map(async (location) => ({
          ...location,
          translatedName: await translateText(location.name, language),
        })),
      );
      setTranslatedLocations(translated);
    };

    if (locations.length > 0) {
      translateLocationNames();
    }
  }, [locations, language]);

  const addItemMutation = useMutation({
    mutationFn: () =>
      createStorageItem(
        {
          name: form.name,
          quantity: form.quantity || null,
          unit: form.unit || null,
          storage_location_id: form.storageLocationId,
          expiry_date: form.expiryDate || null,
        },
        user!.id,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storage-items'] });
      const location = translatedLocations.find((loc) => loc.id === form.storageLocationId);
      showToast({
        title: t('addItem.itemAdded'),
        message: t('addItem.itemAddedMsg', { name: form.name, location: location?.translatedName || location?.name || '' }),
      });
      navigation.goBack();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add item';
      showToast({ title: t('addItem.itemAdded'), message, type: 'error' });
    },
  });

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast({ title: 'Error', message: 'Please enter an item name', type: 'error' });
      return;
    }
    if (!form.storageLocationId) {
      showToast({ title: 'Error', message: 'Please select a storage location', type: 'error' });
      return;
    }
    addItemMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.itemName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('addItem.itemNamePlaceholder')}
            placeholderTextColor={colors.inputPlaceholder}
            value={form.name}
            onChangeText={(value) => setField('name', value)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>{t('addItem.quantity')}</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.quantity}
              onChangeText={(value) => setField('quantity', value)}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="g, kg, pcs"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.unit}
              onChangeText={(value) => setField('unit', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.storageLocation')}</Text>
          <View style={styles.locationButtons}>
            {translatedLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationButton,
                  {
                    backgroundColor:
                      form.storageLocationId === location.id ? colors.primary : colors.surfaceMuted,
                    borderColor: form.storageLocationId === location.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setField('storageLocationId', location.id)}
              >
                <Text
                  style={[
                    styles.locationButtonText,
                    {
                      color:
                        form.storageLocationId === location.id ? colors.primaryContrast : colors.textPrimary,
                    },
                  ]}
                >
                  {location.translatedName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.expiryDate')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('addItem.expiryPlaceholder')}
            placeholderTextColor={colors.inputPlaceholder}
            value={form.expiryDate}
            onChangeText={(value) => setField('expiryDate', value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submit, addItemMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={addItemMutation.isPending}
        >
          <Text style={styles.submitText}>
            {addItemMutation.isPending ? t('addItem.saving') : t('addItem.addItem')}
          </Text>
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
    row: {
      flexDirection: 'row',
      gap: 12,
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
    locationButtons: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    locationButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    locationButtonText: {
      fontSize: 15,
      fontWeight: '600',
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
