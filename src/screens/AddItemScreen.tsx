import { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Camera, Check, Edit3, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { parseReceiptLines, recognizeReceiptText } from '@/lib/ocr';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type TranslatedLocation = Awaited<ReturnType<typeof getStorageLocations>>[number] & {
  translatedName: string;
};

type AddItemMode = 'manual' | 'receipt';

type BatchItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  storageLocationId: string;
  selected: boolean;
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
  const [mode, setMode] = useState<AddItemMode>('manual');
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    storageLocationId: '',
    expiryDate: '',
  });
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ['storage-locations', user?.id],
    queryFn: () => getStorageLocations(user!.id),
    enabled: Boolean(user?.id),
  });

  const [translatedLocations, setTranslatedLocations] = useState<TranslatedLocation[]>([]);

  useEffect(() => {
    if (!locations.length) {
      setTranslatedLocations((prev) => (prev.length ? [] : prev));
      return;
    }

    const translateLocationNames = async () => {
      const translated = await Promise.all(
        locations.map(async (location) => ({
          ...location,
          translatedName: await translateText(location.name, language),
        })),
      );
      setTranslatedLocations(translated);
    };

    translateLocationNames();
  }, [locations, language]);

  const defaultLocationId = useMemo(() => translatedLocations[0]?.id ?? '', [translatedLocations]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-items'] });
      const location = translatedLocations.find((loc) => loc.id === form.storageLocationId);
      showToast({
        title: t('addItem.itemAdded'),
        message: t('addItem.itemAddedMsg', {
          name: form.name,
          location: location?.translatedName || location?.name || '',
        }),
      });
      navigation.goBack();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add item';
      showToast({ title: t('addItem.itemAdded'), message, type: 'error' });
    },
  });

  const batchAddMutation = useMutation({
    mutationFn: async (items: BatchItem[]) => {
      await Promise.all(
        items.map((item) =>
          createStorageItem(
            {
              name: item.name,
              quantity: item.quantity || null,
              unit: item.unit || null,
              storage_location_id: item.storageLocationId,
              expiry_date: null,
            },
            user!.id,
          ),
        ),
      );
    },
    onSuccess: (_, addedItems) => {
      queryClient.invalidateQueries({ queryKey: ['storage-items'] });
      showToast({
        title: t('addItem.itemsAdded', { defaultValue: 'Items added' }),
        message: t('addItem.itemsAddedMsg', {
          defaultValue: `Added ${addedItems.length} items from the receipt.`,
          count: addedItems.length,
        }),
      });
      setBatchItems([]);
      setEditingItemId(null);
      setReceiptImageUri(null);
      navigation.goBack();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add items';
      showToast({
        title: t('addItem.itemsAddedError', { defaultValue: 'Could not add items' }),
        message,
        type: 'error',
      });
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

  const launchPicker = async (source: 'camera' | 'library') => {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted || permission.status !== ImagePicker.PermissionStatus.GRANTED) {
        showToast({
          title: t('addItem.permissionDeniedTitle', { defaultValue: 'Permission needed' }),
          message: t('addItem.permissionDeniedMsg', {
            defaultValue: 'Please allow access so we can read the receipt photo.',
          }),
          type: 'error',
        });
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        quality: 0.85,
        base64: false,
        allowsMultipleSelection: false,
        allowsEditing: false,
        exif: false,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        throw new Error('Unable to read the selected photo.');
      }

      setReceiptImageUri(asset.uri);
      setBatchItems([]);
      setEditingItemId(null);
      showToast({
        title: t('addItem.receiptReadyTitle', { defaultValue: 'Receipt ready' }),
        message: t('addItem.receiptReadyMsg', {
          defaultValue: 'Process the receipt to detect items automatically.',
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to access the selected photo.';
      showToast({
        title: t('addItem.receiptReadyError', { defaultValue: 'Could not attach receipt' }),
        message,
        type: 'error',
      });
    }
  };

  const handleAttachPhoto = () => {
    Alert.alert(
      t('addItem.attachReceiptTitle', { defaultValue: 'Attach receipt' }),
      t('addItem.attachReceiptSubtitle', {
        defaultValue: 'Choose whether to capture a new photo or pick one from your gallery.',
      }),
      [
        {
          text: t('common.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
        },
        {
          text: t('addItem.useCameraAction', { defaultValue: 'Use camera' }),
          onPress: () => {
            void launchPicker('camera');
          },
        },
        {
          text: t('addItem.chooseLibraryAction', { defaultValue: 'Choose photo' }),
          onPress: () => {
            void launchPicker('library');
          },
        },
      ],
    );
  };

  const handleProcessReceipt = async () => {
    if (!receiptImageUri) {
      showToast({
        title: t('addItem.attachReceiptFirstTitle', { defaultValue: 'Add a receipt photo first' }),
        message: t('addItem.attachReceiptFirstMsg', {
          defaultValue: 'Attach a receipt so we know what to process.',
        }),
        type: 'error',
      });
      return;
    }

    if (!defaultLocationId) {
      showToast({
        title: t('addItem.noLocationsTitle', { defaultValue: 'Add a location first' }),
        message: t('addItem.noLocationsMsg', {
          defaultValue: 'Create at least one storage location to continue.',
        }),
        type: 'error',
      });
      return;
    }

    setIsProcessingReceipt(true);
    setEditingItemId(null);
    try {
      const { lines, durationMs } = await recognizeReceiptText(receiptImageUri);
      if (!lines.length) {
        showToast({
          title: t('addItem.ocrNoTextTitle', { defaultValue: 'No text detected' }),
          message: t('addItem.ocrNoTextMsg', {
            defaultValue: 'Try a clearer photo with better lighting.',
          }),
          type: 'error',
        });
        setBatchItems([]);
        return;
      }

      const parsedItems = parseReceiptLines(lines);
      if (!parsedItems.length) {
        showToast({
          title: t('addItem.ocrNoItemsTitle', { defaultValue: 'No products found' }),
          message: t('addItem.ocrNoItemsMsg', {
            defaultValue: 'We could not match any lines to products. Please edit manually.',
          }),
          type: 'error',
        });
        setBatchItems([]);
        return;
      }

      setBatchItems(
        parsedItems.map((item, index) => ({
          id: `${Date.now()}-${index}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          storageLocationId: defaultLocationId,
          selected: true,
        })),
      );

      const seconds = (durationMs / 1000).toFixed(1);
      showToast({
        title: t('addItem.ocrSuccessTitle', { defaultValue: 'Receipt processed' }),
        message: t('addItem.ocrSuccessMsg', {
          defaultValue: `Detected ${parsedItems.length} items in ${seconds}s.`,
          count: parsedItems.length,
          seconds,
        }),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('addItem.ocrFailedGeneric', { defaultValue: 'An unknown error occurred while running OCR.' });
      showToast({
        title: t('addItem.ocrErrorTitle', { defaultValue: 'Could not process receipt' }),
        message,
        type: 'error',
      });
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const updateBatchItem = (id: string, payload: Partial<BatchItem>) => {
    setBatchItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const toggleBatchSelection = (id: string) => {
    setBatchItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  const handleAddBatchItems = () => {
    const selectedItems = batchItems.filter((item) => item.selected);
    if (!selectedItems.length) {
      showToast({
        title: t('addItem.selectItemsTitle', { defaultValue: 'Select at least one item' }),
        message: t('addItem.selectItemsMsg', {
          defaultValue: 'Choose the items you want to import before continuing.',
        }),
        type: 'error',
      });
      return;
    }
    const missingLocation = selectedItems.find((item) => !item.storageLocationId);
    if (missingLocation) {
      showToast({
        title: t('addItem.locationMissingTitle', { defaultValue: 'Location required' }),
        message: t('addItem.locationMissingMsg', {
          defaultValue: 'Please pick a storage location for every selected item.',
        }),
        type: 'error',
      });
      return;
    }
    batchAddMutation.mutate(selectedItems);
  };

  const manualModeActive = mode === 'manual';
  const receiptReady = Boolean(receiptImageUri);
  const receiptFileName = receiptImageUri?.split('/').pop() ?? '';
  const selectedBatchItems = batchItems.filter((item) => item.selected);
  const missingLocationCount = selectedBatchItems.filter((item) => !item.storageLocationId).length;
  const canSubmitBatch = selectedBatchItems.length > 0 && missingLocationCount === 0;

  const renderManualForm = () => (
    <>
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

      <View style={[styles.section, styles.row]}>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>{t('addItem.quantity')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('addItem.quantityPlaceholder')}
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
    </>
  );

  const renderReceiptFlow = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>{t('addItem.receiptCapture', { defaultValue: 'Receipt capture' })}</Text>
        <Text style={styles.helperText}>
          {t('addItem.receiptCaptureHint', {
            defaultValue: 'Snap a ticket or load a photo so OCR can detect the products.',
          })}
        </Text>
        <TouchableOpacity style={styles.receiptUpload} onPress={handleAttachPhoto}>
          <View style={styles.receiptPlaceholder}>
            <Camera size={26} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.receiptPlaceholderTitle}>
                {receiptReady
                  ? t('addItem.receiptReady', { defaultValue: 'Receipt attached' })
                  : t('addItem.attachReceipt', { defaultValue: 'Tap to attach receipt photo' })}
              </Text>
              <Text style={styles.receiptPlaceholderSubtitle}>
                {receiptReady
                  ? t('addItem.receiptReadySubtitle', {
                      defaultValue: receiptFileName
                        ? `Using ${receiptFileName}. Run OCR to extract the items listed on the ticket.`
                        : 'Run OCR to extract the items listed on the ticket.',
                      fileName: receiptFileName,
                    })
                  : t('addItem.attachReceiptSubtitle', {
                      defaultValue: 'Use your gallery or camera. Photos stay on your device.',
                    })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.receiptActions}>
          <TouchableOpacity
            style={[styles.scanButton, isProcessingReceipt && { opacity: 0.7 }]}
            onPress={handleProcessReceipt}
            disabled={isProcessingReceipt}
          >
            {isProcessingReceipt ? (
              <ActivityIndicator color={colors.primaryContrast} />
            ) : (
              <Text style={styles.scanButtonText}>
                {t('addItem.processReceipt', { defaultValue: 'Process receipt (OCR beta)' })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {batchItems.length === 0 ? (
        <View style={styles.batchEmptyState}>
          <Text style={styles.batchEmptyTitle}>
            {t('addItem.noOCRItemsTitle', { defaultValue: 'No detected items yet' })}
          </Text>
          <Text style={styles.batchEmptySubtitle}>
            {t('addItem.noOCRItemsSubtitle', {
              defaultValue: 'Once OCR finds products they will appear here for review.',
            })}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>
              {t('addItem.reviewItems', { defaultValue: 'Review & edit before saving' })}
            </Text>
            <Text style={styles.helperText}>
              {t('addItem.reviewHelper', {
                defaultValue: 'Toggle items, edit details and choose the correct storage location.',
              })}
            </Text>
          </View>

          <View style={styles.batchList}>
            {batchItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.batchCard,
                  item.selected && { borderColor: colors.primary, backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.batchCardHeader}>
                  <TouchableOpacity
                    style={styles.batchCardTitleRow}
                    onPress={() => toggleBatchSelection(item.id)}
                  >
                    <View
                      style={[
                        styles.selectBadge,
                        {
                          borderColor: item.selected ? colors.primary : colors.border,
                          backgroundColor: item.selected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {item.selected ? <Check size={14} color={colors.primaryContrast} /> : null}
                    </View>
                    <Text style={styles.batchCardTitle}>{item.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.batchCardActions}>
                    <TouchableOpacity onPress={() => setEditingItemId(item.id)}>
                      <Edit3 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeBatchItem(item.id)}>
                      <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {editingItemId === item.id ? (
                  <View style={styles.batchEditSection}>
                    <TextInput
                      style={styles.input}
                      value={item.name}
                      onChangeText={(value) => updateBatchItem(item.id, { name: value })}
                    />
                    <View style={[styles.row, { marginTop: 8 }]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={item.quantity}
                        onChangeText={(value) => updateBatchItem(item.id, { quantity: value })}
                        placeholder={t('addItem.quantityPlaceholder')}
                        placeholderTextColor={colors.inputPlaceholder}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={item.unit}
                        onChangeText={(value) => updateBatchItem(item.id, { unit: value })}
                        placeholder="g, kg, pcs"
                        placeholderTextColor={colors.inputPlaceholder}
                      />
                    </View>
                    <TouchableOpacity style={styles.doneButton} onPress={() => setEditingItemId(null)}>
                      <Text style={styles.doneButtonText}>
                        {t('common.done', { defaultValue: 'Done' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.batchDetailsRow}>
                    <Text style={styles.batchDetailsText}>
                      {item.quantity
                        ? `${item.quantity} ${item.unit}`.trim()
                        : t('addItem.noQuantity', { defaultValue: 'No quantity' })}
                    </Text>
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>
                  {t('addItem.storageLocation')}
                </Text>
                <View style={styles.locationButtons}>
                  {translatedLocations.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      style={[
                        styles.locationButton,
                        {
                          backgroundColor:
                            item.storageLocationId === location.id ? colors.primary : colors.surfaceMuted,
                          borderColor:
                            item.storageLocationId === location.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => updateBatchItem(item.id, { storageLocationId: location.id })}
                    >
                      <Text
                        style={[
                          styles.locationButtonText,
                          {
                            color:
                              item.storageLocationId === location.id
                                ? colors.primaryContrast
                                : colors.textPrimary,
                          },
                        ]}
                      >
                        {location.translatedName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {t('addItem.summarySelected', {
                defaultValue: '{{count}} items selected',
                count: selectedBatchItems.length,
              })}
            </Text>
            <Text style={styles.summarySubText}>
              {missingLocationCount > 0
                ? t('addItem.summaryMissing', {
                    defaultValue: '{{count}} items still need a location',
                    count: missingLocationCount,
                  })
                : t('addItem.summaryReady', {
                    defaultValue: 'All selected items have a destination',
                  })}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submit,
              (!canSubmitBatch || batchAddMutation.isPending) && { opacity: 0.6 },
            ]}
            onPress={handleAddBatchItems}
            disabled={!canSubmitBatch || batchAddMutation.isPending}
          >
            <Text style={styles.submitText}>
              {batchAddMutation.isPending
                ? t('addItem.saving')
                : t('addItem.addSelectedItems', { defaultValue: 'Add selected items' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setBatchItems([])}>
            <Text style={styles.secondaryButtonText}>
              {t('addItem.clearItems', { defaultValue: 'Clear list' })}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('addItem.modeTitle', { defaultValue: 'How would you like to add items?' })}
          </Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                manualModeActive && { borderColor: colors.primary, backgroundColor: colors.surface },
              ]}
              onPress={() => setMode('manual')}
            >
              <Text style={styles.modeButtonTitle}>
                {t('addItem.manualModeTitle', { defaultValue: 'Manual entry' })}
              </Text>
              <Text style={styles.modeButtonSubtitle}>
                {t('addItem.manualModeSubtitle', {
                  defaultValue: 'Fill out the form for a single product.',
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                !manualModeActive && { borderColor: colors.primary, backgroundColor: colors.surface },
              ]}
              onPress={() => setMode('receipt')}
            >
              <Text style={styles.modeButtonTitle}>
                {t('addItem.ocrModeTitle', { defaultValue: 'Scan receipt (OCR)' })}
              </Text>
              <Text style={styles.modeButtonSubtitle}>
                {t('addItem.ocrModeSubtitle', {
                  defaultValue: 'Detect multiple products from a ticket photo.',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {manualModeActive ? renderManualForm() : renderReceiptFlow()}
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
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
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
    modeToggle: {
      flexDirection: 'row',
      gap: 12,
    },
    modeButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 6,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    modeButtonTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modeButtonSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    receiptUpload: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      backgroundColor: colors.surfaceMuted,
    },
    receiptPlaceholder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    receiptPlaceholderTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    receiptPlaceholderSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    receiptActions: {
      marginTop: 12,
    },
    scanButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    scanButtonText: {
      color: colors.primaryContrast,
      fontWeight: '600',
    },
    batchEmptyState: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 24,
      backgroundColor: colors.surfaceMuted,
      gap: 6,
    },
    batchEmptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    batchEmptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    batchList: {
      gap: 16,
    },
    batchCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.surfaceMuted,
      gap: 12,
    },
    batchCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    batchCardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    batchCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    batchCardActions: {
      flexDirection: 'row',
      gap: 12,
    },
    selectBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    batchEditSection: {
      gap: 8,
    },
    batchDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    batchDetailsText: {
      color: colors.textSecondary,
    },
    doneButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    doneButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    summaryCard: {
      marginTop: 8,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    summaryText: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summarySubText: {
      color: colors.textSecondary,
    },
    secondaryButton: {
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
