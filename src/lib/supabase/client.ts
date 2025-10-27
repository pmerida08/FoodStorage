import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { asyncStorageAdapter } from '@/lib/supabase/storage';
import type { Database } from '@/lib/supabase/types';

if (!env.supabaseUrl) {
  throw new Error(
    'Supabase URL is not configured. Set EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PROJECT_ID.',
  );
}

if (!env.supabaseAnonKey) {
  throw new Error('Supabase anon key is not configured. Set EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: asyncStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'food-storage-auth',
  },
});
