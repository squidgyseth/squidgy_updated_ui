'use client'

/**
 * Platform Context
 * 
 * Provides platform configuration to all components.
 * Use the usePlatform() hook to access platform data.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { PlatformConfig, getPlatform, DEFAULT_PLATFORM_ID } from '@/config/platforms'

interface PlatformContextValue {
  platform: PlatformConfig
  platformId: string
  isLoading: boolean
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

/**
 * Get platform ID from cookie (client-side)
 */
function getPlatformIdFromCookie(): string {
  if (typeof document === 'undefined') return DEFAULT_PLATFORM_ID
  
  const match = document.cookie.match(/platform_id=([^;]+)/)
  return match?.[1] || DEFAULT_PLATFORM_ID
}

interface PlatformProviderProps {
  children: React.ReactNode
  initialPlatformId?: string
}

/**
 * Platform Provider
 * 
 * Wrap your app with this provider to enable platform context.
 * 
 * Usage in layout.tsx:
 * ```tsx
 * import { PlatformProvider } from '@/lib/platform-context'
 * import { headers } from 'next/headers'
 * 
 * export default function RootLayout({ children }) {
 *   const platformId = headers().get('x-platform-id') || 'squidgy'
 *   
 *   return (
 *     <html>
 *       <body>
 *         <PlatformProvider initialPlatformId={platformId}>
 *           {children}
 *         </PlatformProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function PlatformProvider({ children, initialPlatformId }: PlatformProviderProps) {
  const [platformId, setPlatformId] = useState<string>(
    initialPlatformId || DEFAULT_PLATFORM_ID
  )
  const [isLoading, setIsLoading] = useState(!initialPlatformId)
  
  useEffect(() => {
    if (!initialPlatformId) {
      // Client-side fallback: get from cookie
      const cookiePlatformId = getPlatformIdFromCookie()
      setPlatformId(cookiePlatformId)
      setIsLoading(false)
    }
  }, [initialPlatformId])
  
  const platform = getPlatform(platformId)
  
  if (!platform) {
    // Fallback to default if somehow we got an invalid platform
    const defaultPlatform = getPlatform(DEFAULT_PLATFORM_ID)!
    return (
      <PlatformContext.Provider
        value={{
          platform: defaultPlatform,
          platformId: DEFAULT_PLATFORM_ID,
          isLoading: false,
        }}
      >
        {children}
      </PlatformContext.Provider>
    )
  }
  
  return (
    <PlatformContext.Provider value={{ platform, platformId, isLoading }}>
      {children}
    </PlatformContext.Provider>
  )
}

/**
 * Hook to access platform context
 * 
 * Usage:
 * ```tsx
 * const { platform, platformId } = usePlatform()
 * 
 * return (
 *   <div style={{ color: platform.theme.primaryColor }}>
 *     Welcome to {platform.displayName}
 *   </div>
 * )
 * ```
 */
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext)
  
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider')
  }
  
  return context
}

/**
 * Hook to check if an agent is available on current platform
 * 
 * Usage:
 * ```tsx
 * const canUseLeadGen = useAgentAvailable('lead-generator')
 * 
 * if (!canUseLeadGen) {
 *   return <UpgradePrompt />
 * }
 * ```
 */
export function useAgentAvailable(agentId: string): boolean {
  const { platform } = usePlatform()
  
  if (platform.agents === 'all') return true
  return platform.agents.includes(agentId)
}

/**
 * Hook to get available agents for current platform
 */
export function useAvailableAgents(): string[] {
  const { platform } = usePlatform()
  
  if (platform.agents === 'all') {
    // Return all agents - you may want to import a master list
    return [
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      // ... add all agents
    ]
  }
  
  return platform.agents
}

/**
 * Hook to get current platform's theme
 * 
 * Usage:
 * ```tsx
 * const theme = usePlatformTheme()
 * 
 * return <Button style={{ background: theme.primaryColor }}>Click</Button>
 * ```
 */
export function usePlatformTheme() {
  const { platform } = usePlatform()
  return platform.theme
}

/**
 * Hook to check platform features
 * 
 * Usage:
 * ```tsx
 * const features = usePlatformFeatures()
 * 
 * if (features.workspaces) {
 *   return <WorkspaceSelector />
 * }
 * ```
 */
export function usePlatformFeatures() {
  const { platform } = usePlatform()
  return platform.features
}
