import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

type RecognizeResult = {
  lines: string[];
  durationMs: number;
};

type ParsedReceiptItem = {
  name: string;
  quantity: string;
  unit: string;
};

const OPENAI_VISION_URL = 'https://api.openai.com/v1/chat/completions';
const GPT_VISION_MODEL = 'gpt-4o-mini';

type ExpoExtra = Partial<Record<'ocrApiKey' | 'translationApiKey', string>>;

const getExpoExtra = (): ExpoExtra => {
  const configExtra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  if (Object.keys(configExtra).length) {
    return configExtra;
  }

  const manifestExtra =
    ((Constants.manifest as { extra?: ExpoExtra } | null)?.extra ??
      // @ts-expect-error manifest2 is not typed but exists at runtime
      (Constants.manifest2?.extra as ExpoExtra | undefined)) ??
    {};

  return manifestExtra;
};

const { ocrApiKey, translationApiKey } = getExpoExtra();
const OCR_API_KEY = ocrApiKey || translationApiKey || '';

const RECEIPT_OCR_PROMPT =
  'You are an OCR assistant that extracts every readable line from grocery receipts. Output a strict JSON object with a single key "lines" containing the text lines in top-to-bottom order. Do not add explanations.';

const RECEIPT_ITEM_PROMPT = `You are a purchasing assistant. From grocery receipt lines, extract ONLY edible items (meals, ingredients, food staples).
- Ignore totals, payments, discounts, loyalty information, and store metadata.
- Translate every item name to English.
- Return strict JSON: {"items":[{"name":"string","quantity":"number as string","unit":"string"}]}
- Default quantity to "1" when absent. Default unit to "pcs" when ambiguous.
- Preserve the numeric quantity that appears on the receipt (e.g. "2", "1.5").`;

const PRICE_AT_END_REGEX =
  /(?:[$€£¥]|USD|EUR|GBP|MXN|CAD)\s*\d+(?:[.,]\d{2})?\s*$|(?:\s|^)\d+[.,]\d{2}\s*$/i;
const MULTIPLIER_REGEX = /(?<quantity>\d+)\s?(?:x|X)\b/;
const QUANTITY_UNIT_REGEX =
  /(?<quantity>\d+(?:[.,]\d+)?)(?:\s?)(?<unit>kg|g|mg|lb|lbs|oz|l|ml|cl|pcs?|pc|pack|pkt|pkg|bag|ct|ea|units?)/i;

const STOP_WORDS = [
  'subtotal',
  'total',
  'change',
  'credit',
  'debit',
  'cash',
  'visa',
  'mastercard',
  'payment',
  'balance',
  'tax',
  'iva',
  'vat',
  'amount due',
  'thank you',
  'store',
  'receipt',
  'invoice',
  'clerk',
  'items',
];

const DEFAULT_UNIT = 'pcs';

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/\s([.,])/g, '$1').trim();

const normalizeUnit = (unit?: string): string => {
  if (!unit) {
    return DEFAULT_UNIT;
  }
  const normalized = unit.toLowerCase();
  if (['lb', 'lbs'].includes(normalized)) {
    return 'lb';
  }
  if (normalized === 'pc' || normalized === 'pcs' || normalized.startsWith('unit') || normalized === 'ea') {
    return DEFAULT_UNIT;
  }
  if (normalized === 'pkt' || normalized === 'pkg' || normalized === 'pack' || normalized === 'bag') {
    return 'pack';
  }
  return normalized;
};

const sanitizeQuantity = (value?: string): string => {
  if (!value) {
    return '1';
  }
  return value.replace(',', '.');
};

const shouldIgnoreLine = (line: string): boolean => {
  if (!line.trim()) {
    return true;
  }
  const normalized = line.trim().toLowerCase();

  if (normalized.length < 3) {
    return true;
  }

  if (/^[-=*_]+$/.test(normalized)) {
    return true;
  }

  if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(normalized)) {
    return true;
  }

  if (/^\d+$/.test(normalized)) {
    return true;
  }

  return STOP_WORDS.some((word) => normalized.includes(word));
};

const stripTrailingPrice = (line: string): string => line.replace(PRICE_AT_END_REGEX, '').trim();

const cleanName = (line: string): string =>
  normalizeWhitespace(line.replace(/^[\-\*\d.]+\s*/, '').replace(/\b(qty|ea)\b\.?/gi, '').trim());

const deriveItemFromLine = (line: string): ParsedReceiptItem | null => {
  if (shouldIgnoreLine(line)) {
    return null;
  }

  let working = normalizeWhitespace(stripTrailingPrice(line));
  if (!working) {
    return null;
  }

  const quantityUnitMatch = working.match(QUANTITY_UNIT_REGEX);
  if (quantityUnitMatch?.groups) {
    const name = cleanName(working.slice(0, quantityUnitMatch.index).trim() || working);
    if (!name) {
      return null;
    }

    return {
      name,
      quantity: sanitizeQuantity(quantityUnitMatch.groups.quantity),
      unit: normalizeUnit(quantityUnitMatch.groups.unit),
    };
  }

  const multiplierMatch = working.match(MULTIPLIER_REGEX);
  if (multiplierMatch?.groups) {
    const name = cleanName(working.replace(multiplierMatch[0], '').trim());
    if (!name) {
      return null;
    }
    return {
      name,
      quantity: sanitizeQuantity(multiplierMatch.groups.quantity),
      unit: DEFAULT_UNIT,
    };
  }

  const trailingNumber = working.match(/\d+(?:[.,]\d+)?$/);
  if (trailingNumber) {
    working = working.slice(0, trailingNumber.index).trim();
  }

  const name = cleanName(working);
  if (!name) {
    return null;
  }

  return {
    name,
    quantity: '1',
    unit: DEFAULT_UNIT,
  };
};

const memoizedDataUri = new Map<string, string>();

const getMimeTypeFromUri = (uri: string): string => {
  const extensionMatch = uri.split('.').pop()?.toLowerCase();
  switch (extensionMatch) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

const ensureLocalUri = async (uri: string): Promise<{ localUri: string; cleanupUri?: string }> => {
  if (uri.startsWith('file://')) {
    return { localUri: uri };
  }

  const tempFile = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}receipt-ocr-${Date.now()}`;
  const download = await FileSystem.downloadAsync(uri, tempFile);
  return { localUri: download.uri, cleanupUri: download.uri };
};

const createImageDataUri = async (imageUri: string): Promise<string> => {
  if (memoizedDataUri.has(imageUri)) {
    return memoizedDataUri.get(imageUri)!;
  }

  const { localUri, cleanupUri } = await ensureLocalUri(imageUri);
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    const mimeType = getMimeTypeFromUri(localUri);
    const dataUri = `data:${mimeType};base64,${base64}`;
    memoizedDataUri.set(imageUri, dataUri);
    return dataUri;
  } finally {
    if (cleanupUri) {
      void FileSystem.deleteAsync(cleanupUri, { idempotent: true }).catch(() => undefined);
    }
  }
};

const extractContentText = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text ?? '');
        }
        return '';
      })
      .join('\n');
  }

  if (content && typeof content === 'object' && 'text' in content) {
    return String((content as { text?: string }).text ?? '');
  }

  return '';
};

const coerceResponseLines = (rawContent: string): string[] => {
  const sanitized = rawContent.replace(/```(?:json)?/gi, '').trim();
  if (!sanitized) {
    return [];
  }

  try {
    const parsed = JSON.parse(sanitized);
    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value).trim()).filter(Boolean);
    }
    if (Array.isArray(parsed?.lines)) {
      return parsed.lines.map((value: unknown) => String(value ?? '').trim()).filter(Boolean);
    }
    if (typeof parsed?.text === 'string') {
      return parsed.text.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    }
  } catch {
    // Fall through to split by newline.
  }

  return sanitized
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
};

export const recognizeReceiptText = async (imageUri: string): Promise<RecognizeResult> => {
  if (!imageUri) {
    throw new Error('Attach a receipt photo before running OCR.');
  }

  if (!OCR_API_KEY) {
    throw new Error('Receipt OCR is not configured. Add EXPO_PUBLIC_OCR_API_KEY to your environment.');
  }

  const startedAt = Date.now();

  const imageDataUri = await createImageDataUri(imageUri);

  let response: Response;
  try {
    response = await fetch(OPENAI_VISION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OCR_API_KEY}`,
      },
      body: JSON.stringify({
        model: GPT_VISION_MODEL,
        temperature: 0.1,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: RECEIPT_OCR_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract every line of text exactly as written on this receipt.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUri,
                },
              },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Receipt OCR request failed', error);
    throw new Error('Unable to contact the OCR service. Check your connection and try again.');
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error('Receipt OCR API error', response.status, errorPayload);
    throw new Error('The OCR service rejected the request. Verify your API key and try again.');
  }

  const payload = await response.json();
  const firstChoice = payload?.choices?.[0];
  const rawContent = extractContentText(firstChoice?.message?.content);
  const lines = coerceResponseLines(rawContent);
  const durationMs = Date.now() - startedAt;

  return {
    lines,
    durationMs,
  };
};
const sanitizeModelItems = (input: unknown): ParsedReceiptItem[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: ParsedReceiptItem[] = [];
  const seen = new Set<string>();

  for (const candidate of input) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    const name = cleanName(String((candidate as Record<string, unknown>).name ?? '').trim());
    if (!name) {
      continue;
    }

    const quantityRaw = String(
      (candidate as Record<string, unknown>).quantity ?? (candidate as Record<string, unknown>).qty ?? '',
    ).trim();
    const unitRaw = String(
      (candidate as Record<string, unknown>).unit ??
        (candidate as Record<string, unknown>).units ??
        (candidate as Record<string, unknown>).measurement ??
        '',
    ).trim();

    const item: ParsedReceiptItem = {
      name,
      quantity: sanitizeQuantity(quantityRaw || '1'),
      unit: normalizeUnit(unitRaw),
    };

    const key = `${item.name.toLowerCase()}|${item.quantity}|${item.unit}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(item);
  }

  return normalized;
};

const extractMealsWithModel = async (lines: string[]): Promise<ParsedReceiptItem[]> => {
  if (!lines.length) {
    return [];
  }

  const response = await fetch(OPENAI_VISION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OCR_API_KEY}`,
    },
    body: JSON.stringify({
      model: GPT_VISION_MODEL,
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: RECEIPT_ITEM_PROMPT,
        },
        {
          role: 'user',
          content: `Receipt lines:\n${lines.map((line) => `- ${line}`).join('\n')}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error('Receipt item extraction API error', response.status, errorPayload);
    return [];
  }

  const payload = await response.json();
  const rawContent = extractContentText(payload?.choices?.[0]?.message?.content);
  const sanitized = rawContent.replace(/```(?:json)?/gi, '').trim();
  if (!sanitized) {
    return [];
  }

  try {
    const parsed = JSON.parse(sanitized);
    if (Array.isArray(parsed)) {
      return sanitizeModelItems(parsed);
    }
    if (Array.isArray(parsed?.items)) {
      return sanitizeModelItems(parsed.items);
    }
  } catch (error) {
    console.error('Failed to parse receipt item extraction response', error);
  }

  return [];
};

const parseLinesHeuristically = (lines: string[]): ParsedReceiptItem[] => {
  if (!Array.isArray(lines) || !lines.length) {
    return [];
  }

  const items: ParsedReceiptItem[] = [];
  const seenNames = new Set<string>();

  for (const rawLine of lines) {
    const item = deriveItemFromLine(rawLine);
    if (!item) {
      continue;
    }

    const key = item.name.toLowerCase();
    if (seenNames.has(key)) {
      continue;
    }
    seenNames.add(key);
    items.push(item);
  }

  return items;
};

export const parseReceiptLines = async (lines: string[]): Promise<ParsedReceiptItem[]> => {
  if (!lines.length) {
    return [];
  }

  if (!OCR_API_KEY) {
    return parseLinesHeuristically(lines);
  }

  try {
    const aiItems = await extractMealsWithModel(lines);
    if (aiItems.length) {
      return aiItems;
    }
  } catch (error) {
    console.error('Receipt meal extraction failed', error);
  }

  return parseLinesHeuristically(lines);
};

export type { RecognizeResult, ParsedReceiptItem };
