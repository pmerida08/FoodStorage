import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CONTENT_CACHE_KEY = 'content_translations_cache';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = Constants.expoConfig?.extra?.translationApiKey || '';

type TranslationCache = {
  [language: string]: {
    [originalText: string]: string;
  };
};

type TranslateOptions = {
  force?: boolean;
};

/**
 * Get cached content translations
 */
async function getCachedContentTranslations(): Promise<TranslationCache> {
  try {
    const cached = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading cached content translations:', error);
    return {};
  }
}

/**
 * Save content translations to cache
 */
async function cacheContentTranslations(cache: TranslationCache): Promise<void> {
  try {
    await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching content translations:', error);
  }
}

/**
 * Translate a single text string using OpenAI
 */
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
};

async function translateTextWithAPI(text: string, targetLanguage: string): Promise<string> {
  if (!API_KEY) {
    return text; // Return original if no API key
  }

  const targetLabel = LANGUAGE_LABELS[targetLanguage] ?? targetLanguage;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLabel}. Only return the translated text, nothing else.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Translate a text string to target language with caching
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  options: TranslateOptions = {},
): Promise<string> {
  const { force = false } = options;
  // Don't translate if target is English or text is empty
  if (!force && (targetLanguage === 'en' || !text.trim())) {
    return text;
  }

  // Check cache first
  const cache = await getCachedContentTranslations();
  if (cache[targetLanguage]?.[text]) {
    return cache[targetLanguage][text];
  }

  // Translate with API
  try {
    const translated = await translateTextWithAPI(text, targetLanguage);

    // Update cache
    if (!cache[targetLanguage]) {
      cache[targetLanguage] = {};
    }
    cache[targetLanguage][text] = translated;
    await cacheContentTranslations(cache);

    return translated;
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // Return original on error
  }
}

/**
 * Translate an array of strings (like ingredients or steps)
 */
export async function translateArray(
  items: string[],
  targetLanguage: string,
): Promise<string[]> {
  if (targetLanguage === 'en') {
    return items;
  }

  const translations = await Promise.all(
    items.map((item) => translateText(item, targetLanguage)),
  );

  return translations;
}

/**
 * Translate a recipe object
 */
export async function translateRecipe(
  recipe: {
    name: string;
    description?: string;
    ingredients?: string[];
    steps?: string[];
  },
  targetLanguage: string,
): Promise<{
  name: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
}> {
  if (targetLanguage === 'en') {
    return recipe;
  }

  const [name, description, ingredients, steps] = await Promise.all([
    translateText(recipe.name, targetLanguage),
    recipe.description ? translateText(recipe.description, targetLanguage) : undefined,
    recipe.ingredients ? translateArray(recipe.ingredients, targetLanguage) : undefined,
    recipe.steps ? translateArray(recipe.steps, targetLanguage) : undefined,
  ]);

  return {
    name,
    description,
    ingredients,
    steps,
  };
}

/**
 * Batch translate storage items
 */
export async function translateStorageItems(
  items: Array<{ id: string; name: string }>,
  targetLanguage: string,
): Promise<Array<{ id: string; name: string; translatedName: string }>> {
  if (targetLanguage === 'en') {
    return items.map((item) => ({ ...item, translatedName: item.name }));
  }

  const translatedItems = await Promise.all(
    items.map(async (item) => ({
      ...item,
      translatedName: await translateText(item.name, targetLanguage),
    })),
  );

  return translatedItems;
}

/**
 * Clear content translation cache
 */
export async function clearContentTranslationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONTENT_CACHE_KEY);
    console.log('Content translation cache cleared');
  } catch (error) {
    console.error('Error clearing content translation cache:', error);
  }
}
