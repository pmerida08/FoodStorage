import Constants from 'expo-constants';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ?? Constants.manifest?.extra?.openaiApiKey ?? process.env.OPENAI_API_KEY;

export type SupportedContentLanguage = 'es' | 'en';

const fallbackDetect = (text: string): SupportedContentLanguage => {
  const normalized = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(normalized)) {
    return 'es';
  }
  if (normalized.includes(' el ') || normalized.includes(' la ') || normalized.includes(' que ')) {
    return 'es';
  }
  return 'en';
};

const callOpenAI = async (messages: Array<{ role: 'system' | 'user'; content: string }>) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI API key');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected OpenAI response format');
  }
  return content.trim();
};

export const detectLanguage = async (text: string): Promise<SupportedContentLanguage> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'en';
  }

  try {
    const result = await callOpenAI([
      {
        role: 'system',
        content:
          'You are a language detector. Reply with exactly "es" for Spanish or "en" for English depending on the user text.',
      },
      {
        role: 'user',
        content: trimmed,
      },
    ]);

    if (result.toLowerCase().includes('es')) {
      return 'es';
    }
    if (result.toLowerCase().includes('en')) {
      return 'en';
    }
  } catch (error) {
    console.warn('detectLanguage fallback:', error);
  }

  return fallbackDetect(trimmed);
};

export const translateText = async (text: string, targetLanguage: SupportedContentLanguage): Promise<string> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const targetLabel = targetLanguage === 'en' ? 'English' : 'Spanish';
    const translation = await callOpenAI([
      {
        role: 'system',
        content: `Translate the user text to ${targetLabel}. Respond with translation only.`,
      },
      {
        role: 'user',
        content: trimmed,
      },
    ]);
    return translation;
  } catch (error) {
    console.warn('translateText failed:', error);
    return trimmed;
  }
};
