// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getPlatform, detectPlatformFromUrl, DEFAULT_PLATFORM_ID } from '../config/platforms';

/**
 * Get platform-aware Supabase configuration
 * Uses the current platform's Supabase URL and anon key
 */
function getPlatformSupabaseConfig(): { url: string; key: string; platformId: string } {
  const platformId = detectPlatformFromUrl();
  const platform = getPlatform(platformId);
  
  if (platform && platform.supabase.url && platform.supabase.anonKey) {
    return {
      url: platform.supabase.url,
      key: platform.supabase.anonKey,
      platformId
    };
  }
  
  // Fall back to default platform
  const defaultPlatform = getPlatform(DEFAULT_PLATFORM_ID);
  if (defaultPlatform && defaultPlatform.supabase.url && defaultPlatform.supabase.anonKey) {
    return {
      url: defaultPlatform.supabase.url,
      key: defaultPlatform.supabase.anonKey,
      platformId: DEFAULT_PLATFORM_ID
    };
  }
  
  // Ultimate fallback to env vars
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
    platformId: 'default'
  };
}

// Get platform-aware config
const config = getPlatformSupabaseConfig();
const supabaseUrl = config.url;
const supabaseAnonKey = config.key;

// Temporarily allow the app to load without Supabase for development
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('⚠️ Supabase not configured. Authentication will not work until you add your Supabase credentials to .env');
}

// Log Supabase configuration for debugging
console.log('🔧 Supabase client configuration:', {
  platform: config.platformId,
  url: supabaseUrl,
  anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'not set',
  isClient: typeof window !== 'undefined'
});

// Use dummy values if not configured to prevent app crash
const finalUrl = supabaseUrl || 'https://dummy.supabase.co';
const finalKey = supabaseAnonKey || 'dummy-key';

// Cache for platform-specific Supabase clients
const clientCache: Map<string, SupabaseClient> = new Map();

/**
 * Get or create a Supabase client for the current platform
 * This ensures we use the correct Supabase instance based on the platform parameter
 */
export function getSupabaseClient(): SupabaseClient {
  const currentConfig = getPlatformSupabaseConfig();
  const cacheKey = currentConfig.platformId;
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  
  const url = currentConfig.url || 'https://dummy.supabase.co';
  const key = currentConfig.key || 'dummy-key';
  
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: `supabase.auth.token.${cacheKey}`,
      flowType: 'pkce'
    },
    realtime: {
      headers: {
        apikey: key,
      },
    },
  });
  
  clientCache.set(cacheKey, client);
  console.log(`🔧 Created Supabase client for platform: ${cacheKey}`);
  
  return client;
}

// Default export for backward compatibility - uses platform-aware client
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,     // ✅ Enable automatic token refresh
    persistSession: true,       // ✅ Persist sessions across browser refreshes
    detectSessionInUrl: true,   // ✅ Handle auth redirects from OAuth providers
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: `supabase.auth.token.${config.platformId}`,
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

export interface ContentRepurposer {
  id: string;
  user_id: string;
  session_id?: string;
  chat_history_id?: string;
  agent_id?: string;
  title: string;
  content: string;
  repurposed_content?: any[];
  source_type?: string;
  target_formats?: string[];
  created_at: string;
  updated_at: string;
  content_repurposer_questions?: string;
}

export default supabase;
