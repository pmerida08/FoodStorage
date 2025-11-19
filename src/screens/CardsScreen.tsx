import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from '@/lib/i18n';
import { detectLanguage, translateText } from '@/lib/language/openai';
import type { Card } from '@/types/card';
import { useToast } from '@/providers/ToastProvider';

const buildId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CardsScreen = () => {
  const { colors } = useThemeMode();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cards, setCards] = useState<Card[]>([]);
  const [text, setText] = useState('');
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [translatingCardId, setTranslatingCardId] = useState<string | null>(null);

  const addCard = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setIsCreatingCard(true);
    try {
      const detectedLanguage = await detectLanguage(trimmed);
      const newCard: Card = {
        id: buildId(),
        originalText: trimmed,
        originalLanguage: detectedLanguage,
      };
      setCards((prev) => [newCard, ...prev]);
      setText('');
    } catch (error) {
      console.error('detectLanguage failed', error);
      showToast({ title: t('cards.languageDetectError'), type: 'error' });
      const newCard: Card = {
        id: buildId(),
        originalText: trimmed,
        originalLanguage: 'en',
      };
      setCards((prev) => [newCard, ...prev]);
      setText('');
    } finally {
      setIsCreatingCard(false);
    }
  };

  const handleTranslateCard = async (card: Card) => {
    const target = card.originalLanguage === 'en' ? 'es' : 'en';
    setTranslatingCardId(card.id);
    try {
      const translated = await translateText(card.originalText, target);
      setCards((prev) =>
        prev.map((current) =>
          current.id === card.id
            ? {
                ...current,
                translatedText: translated,
                userRequestedTranslation: true,
              }
            : current,
        ),
      );
      showToast({ title: t('cards.translationSaved') });
    } catch (error) {
      console.error('translateText failed', error);
      showToast({ title: t('cards.translationError'), type: 'error' });
    } finally {
      setTranslatingCardId(null);
    }
  };

  const removeTranslation = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, translatedText: undefined, userRequestedTranslation: false } : card,
      ),
    );
  };

  const renderCard = ({ item }: { item: Card }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.originalText}</Text>
        <Text style={styles.cardMeta}>
          {t('cards.languageDetected')}: {item.originalLanguage.toUpperCase()}
        </Text>

        {item.translatedText ? (
          <View style={styles.translationBlock}>
            <Text style={styles.translationLabel}>{t('cards.translatedLabel')}</Text>
            <Text style={styles.translationText}>{item.translatedText}</Text>
            <View style={styles.translationActions}>
              <Text style={styles.translationMeta}>
                {t('cards.requestTranslation')}: {item.userRequestedTranslation ? '✓' : '—'}
              </Text>
              <TouchableOpacity onPress={() => removeTranslation(item.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>{t('cards.removeTranslation')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleTranslateCard(item)}
            disabled={translatingCardId === item.id}
          >
            {translatingCardId === item.id ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.secondaryButtonText}>{t('cards.translateButton')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('cards.title')}</Text>
            <Text style={styles.subtitle}>{t('cards.subtitle')}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder={t('cards.inputPlaceholder')}
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { marginTop: 12, opacity: !text.trim() || isCreatingCard ? 0.6 : 1 },
              ]}
              onPress={addCard}
              disabled={!text.trim() || isCreatingCard}
            >
              {isCreatingCard ? (
                <ActivityIndicator color={colors.primaryContrast} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('cards.addCard')}</Text>
              )}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('cards.emptyStateTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('cards.emptyStateSubtitle')}</Text>
          </View>
        }
        renderItem={renderCard}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 32,
    },
    header: {
      padding: 24,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      borderColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
    },
    cardInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 16,
      padding: 16,
      minHeight: 80,
      textAlignVertical: 'top',
      color: colors.inputText,
      backgroundColor: colors.inputBackground,
    },
    card: {
      marginHorizontal: 24,
      marginTop: 24,
      padding: 18,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    translationBlock: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      gap: 6,
    },
    translationLabel: {
      fontWeight: '600',
      color: colors.textSecondary,
    },
    translationText: {
      color: colors.textPrimary,
    },
    translationMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    translationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    translationEditor: {
      gap: 12,
    },
    translationInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 12,
      color: colors.inputText,
      minHeight: 80,
      textAlignVertical: 'top',
      backgroundColor: colors.inputBackground,
    },
    translationButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: colors.primaryContrast,
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    emptyState: {
      marginTop: 48,
      marginHorizontal: 24,
      padding: 24,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      alignItems: 'center',
      gap: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    linkText: {
      fontWeight: '600',
    },
  });
