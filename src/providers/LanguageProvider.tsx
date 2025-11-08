import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { loadTranslationsForLanguage } from '@/lib/i18n/translationService';
import { addTranslationResource } from '@/lib/i18n/config';
import en from '@/lib/i18n/locales/en.json';

const LANGUAGE_STORAGE_KEY = 'food-storage-language';

export type Language = 'en' | 'es';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(false);

  // Load translations for a language from API
  const loadLanguageTranslations = useCallback(
    async (lang: Language) => {
      if (lang === 'en') {
        // English is already loaded
        return;
      }

      setLoading(true);
      try {
        console.log(`Loading translations for ${lang}...`);
        const translations = await loadTranslationsForLanguage(en, lang);
        addTranslationResource(lang, translations);
        console.log(`Translations for ${lang} loaded successfully`);
      } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'es') {
          setLanguageState(savedLanguage);

          // Load translations asynchronously without blocking
          if (savedLanguage !== 'en') {
            // Don't await - load in background
            loadLanguageTranslations(savedLanguage).then(() => {
              i18n.changeLanguage(savedLanguage);
            });
          } else {
            await i18n.changeLanguage(savedLanguage);
          }
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };

    loadLanguage();
  }, [i18n, loadLanguageTranslations]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        setLoading(true);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

        // Load translations from API if not English
        if (lang !== 'en') {
          await loadLanguageTranslations(lang);
        }

        setLanguageState(lang);
        await i18n.changeLanguage(lang);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      } finally {
        setLoading(false);
      }
    },
    [i18n, loadLanguageTranslations],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      loading,
    }),
    [language, setLanguage, loading],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
