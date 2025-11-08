type RecognizeResult = {
  lines: string[];
  durationMs: number;
};

type ParsedReceiptItem = {
  name: string;
  quantity: string;
  unit: string;
};

export const recognizeReceiptText = async (): Promise<RecognizeResult> => {
  throw new Error('Receipt OCR is not implemented yet.');
};

export const parseReceiptLines = (_lines: string[]): ParsedReceiptItem[] => {
  return [];
};
