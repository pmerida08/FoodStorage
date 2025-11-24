import { env } from "@/lib/env";
import { asyncStorageAdapter } from "@/lib/supabase/storage";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (_supabase) return _supabase;

  if (!env.supabaseUrl) {
    throw new Error(
      "Supabase URL is not configured. Set EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PROJECT_ID."
    );
  }

  if (!env.supabaseAnonKey) {
    throw new Error(
      "Supabase anon key is not configured. Set EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  _supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: asyncStorageAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "food-storage-auth",
    },
  });

  return _supabase;
};

// For backward compatibility - uses Proxy to lazily initialize on first access
export const supabase = new Proxy(
  {} as ReturnType<typeof createClient<Database>>,
  {
    get(target, prop) {
      return getSupabase()[
        prop as keyof ReturnType<typeof createClient<Database>>
      ];
    },
  }
);
