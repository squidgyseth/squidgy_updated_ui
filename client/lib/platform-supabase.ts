/**
 * Platform-Aware Supabase Client
 * 
 * Creates Supabase clients that connect to the correct database
 * based on the current platform context.
 * 
 * Adapted for Vite + React architecture.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPlatform, DEFAULT_PLATFORM_ID, detectPlatformFromUrl } from '../config/platforms'

// Cache for Supabase clients per platform
const clientCache: Map<string, SupabaseClient> = new Map()

/**
 * Get platform ID from localStorage or URL
 */
function getCurrentPlatformId(): string {
  // Check localStorage first
  const storedPlatform = localStorage.getItem('platform_id')
  if (storedPlatform) {
    return storedPlatform
  }
  
  // Detect from URL
  return detectPlatformFromUrl()
}

/**
 * Get Supabase config for a platform
 */
function getSupabaseConfig(platformId: string): { url: string; anonKey: string } {
  const platform = getPlatform(platformId)
  
  if (!platform) {
    console.warn(`Platform "${platformId}" not found, falling back to default`)
    const defaultPlatform = getPlatform(DEFAULT_PLATFORM_ID)!
    return {
      url: defaultPlatform.supabase.url,
      anonKey: defaultPlatform.supabase.anonKey,
    }
  }
  
  // Check if Supabase is configured for this platform
  if (!platform.supabase.url || !platform.supabase.anonKey) {
    // Fall back to default Supabase if platform-specific not configured
    const defaultPlatform = getPlatform(DEFAULT_PLATFORM_ID)!
    if (defaultPlatform.supabase.url && defaultPlatform.supabase.anonKey) {
      console.warn(
        `Supabase not configured for platform "${platformId}", using default. ` +
        `Set VITE_${platformId.toUpperCase()}_SUPABASE_URL and ` +
        `VITE_${platformId.toUpperCase()}_SUPABASE_ANON_KEY for platform-specific database.`
      )
      return {
        url: defaultPlatform.supabase.url,
        anonKey: defaultPlatform.supabase.anonKey,
      }
    }
  }
  
  return {
    url: platform.supabase.url,
    anonKey: platform.supabase.anonKey,
  }
}

/**
 * Create or get cached Supabase client for a platform
 * 
 * Usage:
 * ```tsx
 * import { createPlatformClient } from './lib/platform-supabase'
 * 
 * // Get client for current platform
 * const supabase = createPlatformClient()
 * 
 * // Or specify a platform
 * const yeaaSupabase = createPlatformClient('yeaa')
 * ```
 */
export function createPlatformClient(platformIdOverride?: string): SupabaseClient {
  const platformId = platformIdOverride || getCurrentPlatformId()
  
  // Check cache first
  if (clientCache.has(platformId)) {
    return clientCache.get(platformId)!
  }
  
  const { url, anonKey } = getSupabaseConfig(platformId)
  
  // Use dummy values if not configured to prevent app crash
  const finalUrl = url || 'https://dummy.supabase.co'
  const finalKey = anonKey || 'dummy-key'
  
  if (!url || !anonKey) {
    console.warn('⚠️ Supabase not configured for platform:', platformId)
  }
  
  const client = createClient(finalUrl, finalKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: `supabase.auth.token.${platformId}`, // Platform-specific storage key
      flowType: 'pkce'
    },
    realtime: {
      headers: {
        apikey: finalKey,
      },
    },
  })
  
  // Cache the client
  clientCache.set(platformId, client)
  
  return client
}

/**
 * Clear cached Supabase clients
 * Useful when switching platforms
 */
export function clearSupabaseCache(): void {
  clientCache.clear()
}

/**
 * Get Supabase client for the current platform
 * This is a convenience function that always uses the current platform
 */
export function getSupabaseClient(): SupabaseClient {
  return createPlatformClient()
}

/**
 * Hook-friendly function to get platform-specific Supabase URL
 */
export function getPlatformSupabaseUrl(platformId?: string): string {
  const id = platformId || getCurrentPlatformId()
  const { url } = getSupabaseConfig(id)
  return url
}

/**
 * Check if Supabase is properly configured for a platform
 */
export function isSupabaseConfigured(platformId?: string): boolean {
  const id = platformId || getCurrentPlatformId()
  const { url, anonKey } = getSupabaseConfig(id)
  return !!(url && anonKey && url !== 'https://dummy.supabase.co')
}
