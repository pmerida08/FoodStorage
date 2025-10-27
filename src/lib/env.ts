const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_PROJECT_ID = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID;

export const env = {
  supabaseUrl:
    SUPABASE_URL ?? (SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : undefined),
  supabaseAnonKey: SUPABASE_ANON_KEY,
} as const;
