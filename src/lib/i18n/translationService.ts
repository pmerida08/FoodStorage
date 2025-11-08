import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const TRANSLATION_CACHE_KEY = 'translations_cache';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// You can set this via environment variable
const API_PROVIDER = 'openai'; // or 'anthropic'
const API_KEY = Constants.expoConfig?.extra?.translationApiKey || '';

export type TranslationResource = Record<string, any>;

/**
 * Translate a flat object of English strings to target language using AI
 */
async function translateWithOpenAI(
  sourceText: string,
  targetLanguage: string,
): Promise<string> {
  console.log(`[TranslationAPI] Using API key: ${API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET'}`);

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
          content: `You are a professional translator. Translate the following JSON object to ${targetLanguage}. Maintain the exact same JSON structure and keys, only translate the values. Return ONLY the translated JSON, no explanations.`,
        },
        {
          role: 'user',
          content: sourceText,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[TranslationAPI] Error ${response.status}: ${errorBody}`);
    throw new Error(`Translation API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Translate using Anthropic Claude API
 */
async function translateWithAnthropic(
  sourceText: string,
  targetLanguage: string,
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a professional translator. Translate the following JSON object to ${targetLanguage}. Maintain the exact same JSON structure and keys, only translate the values. Return ONLY the translated JSON, no explanations.\n\n${sourceText}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Main translation function that routes to the appropriate API
 */
async function translateViaAPI(
  sourceResource: TranslationResource,
  targetLanguage: string,
): Promise<TranslationResource> {
  const sourceText = JSON.stringify(sourceResource, null, 2);

  let translatedText: string;

  if (API_PROVIDER === 'anthropic') {
    translatedText = await translateWithAnthropic(sourceText, targetLanguage);
  } else {
    translatedText = await translateWithOpenAI(sourceText, targetLanguage);
  }

  // Extract JSON from response (in case there's extra text)
  const jsonMatch = translatedText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse translation response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Get cached translations from AsyncStorage
 */
async function getCachedTranslations(): Promise<Record<string, TranslationResource>> {
  try {
    const cached = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading cached translations:', error);
    return {};
  }
}

/**
 * Save translations to AsyncStorage
 */
async function cacheTranslations(translations: Record<string, TranslationResource>): Promise<void> {
  try {
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(translations));
  } catch (error) {
    console.error('Error caching translations:', error);
  }
}

/**
 * Load translations for a language. Uses cache first, then API if needed.
 */
export async function loadTranslationsForLanguage(
  sourceResource: TranslationResource,
  targetLanguage: string,
  forceRefresh: boolean = false,
): Promise<TranslationResource> {
  // For English, just return the source
  if (targetLanguage === 'en') {
    return sourceResource;
  }

  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedTranslations();
    if (cached[targetLanguage]) {
      console.log(`Using cached translations for ${targetLanguage}`);
      return cached[targetLanguage];
    }
  }

  // If no API key, try to load static fallback or return source
  if (!API_KEY) {
    console.warn('No translation API key found, trying static fallback');
    try {
      // Try to load static Spanish translations if available
      if (targetLanguage === 'es') {
        const es = require('./locales/es.json');
        return es;
      }
    } catch (err) {
      console.warn('No static translation found, using English as fallback');
    }
    return sourceResource;
  }

  // Fetch from API with timeout
  console.log(`Fetching translations for ${targetLanguage} from API...`);
  try {
    // Add timeout of 10 seconds
    const timeoutPromise = new Promise<TranslationResource>((_, reject) => {
      setTimeout(() => reject(new Error('Translation request timeout')), 10000);
    });

    const translationPromise = translateViaAPI(sourceResource, targetLanguage);

    const translated = await Promise.race([translationPromise, timeoutPromise]);

    // Cache the result
    const cached = await getCachedTranslations();
    cached[targetLanguage] = translated;
    await cacheTranslations(cached);

    return translated;
  } catch (error) {
    console.error(`Error translating to ${targetLanguage}:`, error);

    // Try static fallback before returning source
    try {
      if (targetLanguage === 'es') {
        const es = require('./locales/es.json');
        console.log('Using static Spanish fallback');
        return es;
      }
    } catch (err) {
      console.warn('No static translation available');
    }

    // Return source as last fallback
    return sourceResource;
  }
}

/**
 * Clear translation cache
 */
export async function clearTranslationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRANSLATION_CACHE_KEY);
    console.log('Translation cache cleared');
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
}
