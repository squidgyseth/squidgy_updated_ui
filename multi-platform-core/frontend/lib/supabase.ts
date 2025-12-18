/**
 * Platform-Aware Supabase Client
 * 
 * Creates Supabase clients that connect to the correct database
 * based on the current platform context.
 */

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPlatform, DEFAULT_PLATFORM_ID, type PlatformConfig } from '@/config/platforms'

// Type for our database - extend this with your actual schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          owner_id?: string | null
        }
      }
      // Add more tables as needed
    }
  }
}

/**
 * Get platform ID from cookie (works in both client and server)
 */
function getPlatformIdFromCookie(): string {
  if (typeof document !== 'undefined') {
    // Client-side
    const match = document.cookie.match(/platform_id=([^;]+)/)
    return match?.[1] || DEFAULT_PLATFORM_ID
  }
  return DEFAULT_PLATFORM_ID
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
  
  if (!platform.supabase.url || !platform.supabase.anonKey) {
    throw new Error(
      `Supabase not configured for platform "${platformId}". ` +
      `Set NEXT_PUBLIC_${platformId.toUpperCase()}_SUPABASE_URL and ` +
      `NEXT_PUBLIC_${platformId.toUpperCase()}_SUPABASE_ANON_KEY`
    )
  }
  
  return {
    url: platform.supabase.url,
    anonKey: platform.supabase.anonKey,
  }
}

/**
 * Create Supabase client for browser/client components
 * 
 * Usage:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase'
 * 
 * export function MyComponent() {
 *   const supabase = createClient()
 *   
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient(platformIdOverride?: string) {
  const platformId = platformIdOverride || getPlatformIdFromCookie()
  const { url, anonKey } = getSupabaseConfig(platformId)
  
  return createBrowserClient<Database>(url, anonKey)
}

/**
 * Create Supabase client for server components and API routes
 * 
 * Usage in Server Component:
 * ```tsx
 * import { createServerComponentClient } from '@/lib/supabase'
 * 
 * export default async function Page() {
 *   const supabase = createServerComponentClient()
 *   const { data } = await supabase.from('profiles').select()
 *   
 *   return <div>...</div>
 * }
 * ```
 */
export async function createServerComponentClient(platformIdOverride?: string) {
  const cookieStore = await cookies()
  
  const platformId = platformIdOverride || 
    cookieStore.get('platform_id')?.value || 
    DEFAULT_PLATFORM_ID
  
  const { url, anonKey } = getSupabaseConfig(platformId)
  
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookies in read-only context (middleware)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle cookies in read-only context
        }
      },
    },
  })
}

/**
 * Create Supabase client for API routes (Route Handlers)
 * 
 * Usage:
 * ```tsx
 * import { createRouteHandlerClient } from '@/lib/supabase'
 * import { NextRequest, NextResponse } from 'next/server'
 * 
 * export async function GET(request: NextRequest) {
 *   const supabase = await createRouteHandlerClient(request)
 *   const { data } = await supabase.from('profiles').select()
 *   
 *   return NextResponse.json(data)
 * }
 * ```
 */
export async function createRouteHandlerClient(request: NextRequest) {
  const cookieStore = await cookies()
  
  // Get platform from header (set by middleware) or cookie
  const platformId = 
    request.headers.get('x-platform-id') ||
    cookieStore.get('platform_id')?.value || 
    DEFAULT_PLATFORM_ID
  
  const { url, anonKey } = getSupabaseConfig(platformId)
  
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle read-only context
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle read-only context
        }
      },
    },
  })
}

// Re-export NextRequest for convenience
import { NextRequest } from 'next/server'
export type { NextRequest }
