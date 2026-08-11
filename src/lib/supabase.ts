import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  metaEnv.VITE_SUPABASE_URL &&
    metaEnv.VITE_SUPABASE_ANON_KEY &&
    !metaEnv.VITE_SUPABASE_URL.includes('seu-projeto') &&
    !metaEnv.VITE_SUPABASE_URL.includes('placeholder') &&
    metaEnv.VITE_SUPABASE_ANON_KEY !== 'placeholder-anon-key' &&
    !metaEnv.VITE_SUPABASE_ANON_KEY.includes('eyJhbGciOi...')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
