export type Card = {
  id: string;
  originalText: string;
  originalLanguage: 'es' | 'en';
  translatedText?: string;
  userRequestedTranslation?: boolean;
};
