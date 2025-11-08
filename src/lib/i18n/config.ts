import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// Initial resources with only English
// Other languages will be loaded dynamically via API
const resources = {
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Add translations for a language dynamically
 */
export function addTranslationResource(language: string, translations: Record<string, any>) {
  i18n.addResourceBundle(language, 'translation', translations, true, true);
}

export default i18n;
