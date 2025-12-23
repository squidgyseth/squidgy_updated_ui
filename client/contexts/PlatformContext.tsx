/**
 * Platform Context for Whitelabel Support
 * 
 * Provides platform configuration to all components.
 * Use the usePlatform() hook to access platform data.
 * 
 * Adapted for Vite + React architecture.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  PlatformConfig, 
  PlatformTheme,
  getPlatform, 
  DEFAULT_PLATFORM_ID,
  detectPlatformFromUrl,
  isAgentAvailable as checkAgentAvailable,
  getAvailableAgents as getAgents
} from '../config/platforms'
import { OptimizedAgentService } from '../services/optimizedAgentService'

interface PlatformContextValue {
  platform: PlatformConfig
  platformId: string
  isLoading: boolean
  setPlatformId: (id: string) => void
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

interface PlatformProviderProps {
  children: React.ReactNode
  initialPlatformId?: string
}

/**
 * Platform Provider
 * 
 * Wrap your app with this provider to enable platform context.
 * 
 * Usage in App.tsx:
 * ```tsx
 * import { PlatformProvider } from './contexts/PlatformContext'
 * 
 * const App = () => (
 *   <PlatformProvider>
 *     <YourApp />
 *   </PlatformProvider>
 * )
 * ```
 */
/**
 * Detect platform from URL query param or localStorage
 * Default is squidgy unless ?platform=xxx is passed
 */
function getInitialPlatformId(): string {
  // Check query param first (highest priority)
  const urlParams = new URLSearchParams(window.location.search)
  const queryPlatform = urlParams.get('platform')
  
  if (queryPlatform && getPlatform(queryPlatform)) {
    // Store in localStorage so it persists through redirects
    localStorage.setItem('platform_id', queryPlatform)
    // Mark that this is a platform session (for redirect persistence)
    sessionStorage.setItem('platform_redirect', 'true')
    console.log('🎨 Platform switched via URL param:', queryPlatform)
    return queryPlatform
  }
  
  // Check localStorage for persisted platform (persists through navigation within session)
  const storedPlatform = localStorage.getItem('platform_id')
  const isActiveSession = sessionStorage.getItem('platform_redirect') === 'true'
  
  if (storedPlatform && getPlatform(storedPlatform) && isActiveSession) {
    console.log('🎨 Platform loaded from storage (session):', storedPlatform)
    return storedPlatform
  }
  
  // Default to squidgy
  console.log('🎨 Platform using default:', DEFAULT_PLATFORM_ID)
  return DEFAULT_PLATFORM_ID
}

export function PlatformProvider({ children, initialPlatformId }: PlatformProviderProps) {
  // Detect platform synchronously during initialization
  const [platformId, setPlatformIdState] = useState<string>(() => {
    return initialPlatformId || getInitialPlatformId()
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // Apply theme CSS variables when platform changes
  useEffect(() => {
    const platform = getPlatform(platformId)
    if (platform) {
      applyPlatformTheme(platform.theme)
      
      // Update favicon
      updateFavicon(platform.theme.favicon)
      
      // Update document title
      document.title = `${platform.displayName} - AI Assistant`
    }
  }, [platformId])
  
  // Load available agents from database when platform is ready
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const agentService = OptimizedAgentService.getInstance()
        await agentService.loadAvailableAgents()
        console.log('📦 Platform agents loaded from database')
      } catch (error) {
        console.error('Failed to load platform agents:', error)
      }
    }
    
    loadAgents()
  }, [platformId])
  
  const setPlatformId = useCallback((newPlatformId: string) => {
    const platform = getPlatform(newPlatformId)
    if (platform) {
      setPlatformIdState(newPlatformId)
      // Update URL with platform param for easy sharing/testing
      const url = new URL(window.location.href)
      url.searchParams.set('platform', newPlatformId)
      window.history.replaceState({}, '', url.toString())
    }
  }, [])
  
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
          setPlatformId,
        }}
      >
        {children}
      </PlatformContext.Provider>
    )
  }
  
  return (
    <PlatformContext.Provider value={{ platform, platformId, isLoading, setPlatformId }}>
      {children}
    </PlatformContext.Provider>
  )
}

/**
 * Apply platform theme as CSS variables
 */
function applyPlatformTheme(theme: PlatformTheme) {
  const root = document.documentElement
  
  // Set CSS custom properties for theming
  root.style.setProperty('--platform-primary', theme.primaryColor)
  root.style.setProperty('--platform-secondary', theme.secondaryColor)
  root.style.setProperty('--platform-accent', theme.accentColor)
  root.style.setProperty('--platform-gradient-start', theme.gradientStart)
  root.style.setProperty('--platform-gradient-mid', theme.gradientMid)
  root.style.setProperty('--platform-gradient-end', theme.gradientEnd)
  
  // Convert hex to HSL for shadcn/ui compatibility
  const primaryHsl = hexToHsl(theme.primaryColor)
  const secondaryHsl = hexToHsl(theme.secondaryColor)
  const accentHsl = hexToHsl(theme.accentColor)
  
  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--secondary', secondaryHsl)
  root.style.setProperty('--accent', accentHsl)
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.primaryColor)
  }
}

/**
 * Update favicon dynamically
 */
function updateFavicon(faviconPath: string) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) {
    link.href = faviconPath
  } else {
    const newLink = document.createElement('link')
    newLink.rel = 'icon'
    newLink.href = faviconPath
    document.head.appendChild(newLink)
  }
}

/**
 * Convert hex color to HSL string
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
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
  const { platformId } = usePlatform()
  return checkAgentAvailable(platformId, agentId)
}

/**
 * Hook to get available agents for current platform
 */
export function useAvailableAgents(): string[] {
  const { platformId } = usePlatform()
  return getAgents(platformId)
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
export function usePlatformTheme(): PlatformTheme {
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

/**
 * Hook to check if a specific feature is enabled
 * 
 * Usage:
 * ```tsx
 * const hasReferrals = useFeatureEnabled('referrals')
 * ```
 */
export function useFeatureEnabled(feature: keyof PlatformConfig['features']): boolean {
  const features = usePlatformFeatures()
  return features[feature]
}
