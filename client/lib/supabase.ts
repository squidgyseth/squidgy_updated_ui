// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporarily allow the app to load without Supabase for development
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('⚠️ Supabase not configured. Authentication will not work until you add your Supabase credentials to .env');
}

// Log Supabase configuration for debugging
console.log('🔧 Supabase client configuration:', {
  url: supabaseUrl,
  anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'not set',
  isClient: typeof window !== 'undefined'
});

// Use dummy values if not configured to prevent app crash
const finalUrl = supabaseUrl || 'https://dummy.supabase.co';
const finalKey = supabaseAnonKey || 'dummy-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,     // ✅ Enable automatic token refresh
    persistSession: true,       // ✅ Persist sessions across browser refreshes
    detectSessionInUrl: true,   // ✅ Handle auth redirects from OAuth providers
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  realtime: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
});

// Custom types for Supabase tables
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  profile_avatar_url?: string;
  company_id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ForgotPassword {
  id: string;
  user_id: string;
  email: string;
  reset_token: string;
  token_expires_at: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
}

export interface CallToAction {
  id: string;
  text: string;
  href: string;
  type: 'button' | 'link';
}

export interface Newsletter {
  id: string;
  user_id: string;
  session_id?: string;
  chat_history_id?: string;
  agent_id?: string;
  title: string;
  content: string;
  call_to_actions?: CallToAction[];
  created_at: string;
  updated_at: string;
}

export default supabase;
