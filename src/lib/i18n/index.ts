import { useCallback, useEffect, useState } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const translations = { en, es };

export type SupportedLanguage = keyof typeof translations;

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const fallback: { languageTag: SupportedLanguage } = { languageTag: 'en' };

const selectBestLanguage = (): SupportedLanguage => {
  const locales = Localization.getLocales();
  const bestLanguage = locales?.find((locale) => Object.keys(translations).includes(locale.languageCode ?? ''));
  return (bestLanguage?.languageCode as SupportedLanguage) ?? fallback.languageTag;
};

const setI18nConfig = (nextLocale?: SupportedLanguage) => {
  const languageToApply = nextLocale ?? selectBestLanguage();
  i18n.locale = languageToApply;
  return languageToApply;
};

setI18nConfig();

export const useTranslation = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Expo Localization doesn't have a direct event listener for language changes in the same way.
    // Usually, the app restarts on Android when language changes.
    // For iOS, we might need to check on AppState change, but for now we'll keep it simple.
    const handleLocalizationChange = () => {
      setI18nConfig();
      forceUpdate((value) => value + 1);
    };
    
    // Placeholder for future implementation if needed
    return () => {};
  }, []);

  const t = useCallback(
    (key: Parameters<typeof i18n.t>[0], options?: Parameters<typeof i18n.t>[1]) => i18n.t(key, options),
    [],
  );

  return { t, locale: i18n.locale as SupportedLanguage };
};

export { i18n, setI18nConfig };
