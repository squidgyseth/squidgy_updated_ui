/**
 * Platform Configuration for Whitelabel Support
 * 
 * Central registry for all platforms. Add or remove platforms here.
 * This is the single source of truth for platform definitions.
 * 
 * Adapted for Vite + React architecture.
 */

export interface PlatformTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logo: string
  logoLight: string
  favicon: string
  gradientStart: string
  gradientMid: string
  gradientEnd: string
}

export interface PlatformConfig {
  id: string
  name: string
  displayName: string
  domains: string[]
  supabase: {
    url: string
    anonKey: string
  }
  theme: PlatformTheme
  agents: string[] | 'all'
  features: {
    workspaces: boolean
    tokenBilling: boolean
    perAgentBilling: boolean
    perUserBilling: boolean
    referrals: boolean
    newsletter: boolean
    socialMedia: boolean
    leads: boolean
  }
}

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback
}

/**
 * Platform Definitions
 * 
 * To add a new platform:
 * 1. Add entry here with unique id
 * 2. Add environment variables: VITE_{PLATFORM_ID}_SUPABASE_URL, VITE_{PLATFORM_ID}_SUPABASE_ANON_KEY
 * 3. Configure domain DNS
 * 4. Set up corresponding Supabase instance with schema
 * 5. Add logo files to public/logos/{platform_id}.svg
 */
export const platforms: Record<string, PlatformConfig> = {
  squidgy: {
    id: 'squidgy',
    name: 'squidgy',
    displayName: 'Squidgy',
    domains: ['squidgy.com', 'www.squidgy.com', 'localhost', '127.0.0.1'],
    supabase: {
      url: getEnvVar('VITE_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#5E17EB',
      secondaryColor: '#A61D92',
      accentColor: '#FB252A',
      logo: '/logos/squidgy.svg',
      logoLight: '/logos/squidgy-light.svg',
      favicon: '/favicons/squidgy.ico',
      gradientStart: '#FB252A',
      gradientMid: '#A61D92',
      gradientEnd: '#6017E8',
    },
    agents: 'all',
    features: {
      workspaces: true,
      tokenBilling: false,
      perAgentBilling: false,
      perUserBilling: false,
      referrals: true,
      newsletter: true,
      socialMedia: true,
      leads: true,
    },
  },

  yeaa: {
    id: 'yeaa',
    name: 'yeaa',
    displayName: 'YEAA',
    domains: ['yeaa.com', 'www.yeaa.com'],
    supabase: {
      url: getEnvVar('VITE_YEAA_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_YEAA_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#f59e0b',
      secondaryColor: '#d97706',
      accentColor: '#fbbf24',
      logo: '/logos/yeaa.svg',
      logoLight: '/logos/yeaa-light.svg',
      favicon: '/favicons/yeaa.ico',
      gradientStart: '#fbbf24',
      gradientMid: '#f59e0b',
      gradientEnd: '#d97706',
    },
    agents: [
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      'lead-generator',
      'outreach-agent',
      'landing-page-builder',
      'funnel-tracker',
      'competitor-spy',
      'launch-manager',
    ],
    features: {
      workspaces: true,
      tokenBilling: false,
      perAgentBilling: true,
      perUserBilling: false,
      referrals: true,
      newsletter: true,
      socialMedia: true,
      leads: true,
    },
  },

  fanatiq: {
    id: 'fanatiq',
    name: 'fanatiq',
    displayName: 'FanatiQ',
    domains: ['fanatiq.com', 'www.fanatiq.com'],
    supabase: {
      url: getEnvVar('VITE_FANATIQ_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_FANATIQ_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#ef4444',
      secondaryColor: '#dc2626',
      accentColor: '#f87171',
      logo: '/logos/fanatiq.svg',
      logoLight: '/logos/fanatiq-light.svg',
      favicon: '/favicons/fanatiq.ico',
      gradientStart: '#f87171',
      gradientMid: '#ef4444',
      gradientEnd: '#dc2626',
    },
    agents: [
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      'match-day-agent',
      'fan-pulse',
      'merch-promoter',
      'ticket-agent',
      'player-spotlight',
      'chant-culture-keeper',
      'live-commentator',
    ],
    features: {
      workspaces: true,
      tokenBilling: true,
      perAgentBilling: false,
      perUserBilling: true,
      referrals: false,
      newsletter: true,
      socialMedia: true,
      leads: false,
    },
  },

  trades: {
    id: 'trades',
    name: 'trades',
    displayName: 'Trades',
    domains: ['trades.com', 'www.trades.com'],
    supabase: {
      url: getEnvVar('VITE_TRADES_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_TRADES_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#f97316',
      secondaryColor: '#ea580c',
      accentColor: '#fb923c',
      logo: '/logos/trades.svg',
      logoLight: '/logos/trades-light.svg',
      favicon: '/favicons/trades.ico',
      gradientStart: '#fb923c',
      gradientMid: '#f97316',
      gradientEnd: '#ea580c',
    },
    agents: [
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      'quote-builder',
      'job-scheduler',
      'review-chaser',
      'local-seo-agent',
      'before-after-agent',
      'invoice-agent',
      'emergency-response',
    ],
    features: {
      workspaces: true,
      tokenBilling: false,
      perAgentBilling: true,
      perUserBilling: false,
      referrals: true,
      newsletter: false,
      socialMedia: true,
      leads: true,
    },
  },

  finance: {
    id: 'finance',
    name: 'finance',
    displayName: 'Finance',
    domains: ['finance.com', 'www.finance.com'],
    supabase: {
      url: getEnvVar('VITE_FINANCE_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_FINANCE_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#0284c7',
      accentColor: '#38bdf8',
      logo: '/logos/finance.svg',
      logoLight: '/logos/finance-light.svg',
      favicon: '/favicons/finance.ico',
      gradientStart: '#38bdf8',
      gradientMid: '#0ea5e9',
      gradientEnd: '#0284c7',
    },
    agents: [
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      'compliance-checker',
      'market-update-agent',
      'client-onboarder',
      'report-generator',
      'regulatory-radar',
      'jargon-translator',
      'renewal-agent',
    ],
    features: {
      workspaces: true,
      tokenBilling: false,
      perAgentBilling: true,
      perUserBilling: false,
      referrals: false,
      newsletter: true,
      socialMedia: false,
      leads: true,
    },
  },
}

/**
 * Default platform for local development and fallback
 */
export const DEFAULT_PLATFORM_ID = 'squidgy'

/**
 * Get platform by ID
 */
export function getPlatform(platformId: string): PlatformConfig | null {
  return platforms[platformId] || null
}

/**
 * Get platform by domain
 */
export function getPlatformByDomain(domain: string): PlatformConfig | null {
  const normalizedDomain = domain.toLowerCase().replace(/:\d+$/, '') // Remove port
  
  for (const platform of Object.values(platforms)) {
    if (platform.domains.includes(normalizedDomain)) {
      return platform
    }
  }
  
  return null
}

/**
 * Get all platform IDs
 */
export function getAllPlatformIds(): string[] {
  return Object.keys(platforms)
}

/**
 * Check if agent is available on platform
 */
export function isAgentAvailable(platformId: string, agentId: string): boolean {
  const platform = getPlatform(platformId)
  if (!platform) return false
  
  if (platform.agents === 'all') return true
  return platform.agents.includes(agentId)
}

/**
 * Get available agents for platform
 */
export function getAvailableAgents(platformId: string): string[] {
  const platform = getPlatform(platformId)
  if (!platform) return []
  
  if (platform.agents === 'all') {
    // Return all possible agents
    return [
      // Universal
      'content-creator',
      'visual-designer',
      'graham',
      'engagement-manager',
      'analytics-expert',
      'strategy-advisor',
      // YEAA specific
      'lead-generator',
      'outreach-agent',
      'landing-page-builder',
      'funnel-tracker',
      'competitor-spy',
      'launch-manager',
      // FanatiQ specific
      'match-day-agent',
      'fan-pulse',
      'merch-promoter',
      'ticket-agent',
      'player-spotlight',
      'chant-culture-keeper',
      'live-commentator',
      // Trades specific
      'quote-builder',
      'job-scheduler',
      'review-chaser',
      'local-seo-agent',
      'before-after-agent',
      'invoice-agent',
      'emergency-response',
      // Finance specific
      'compliance-checker',
      'market-update-agent',
      'client-onboarder',
      'report-generator',
      'regulatory-radar',
      'jargon-translator',
      'renewal-agent',
    ]
  }
  
  return platform.agents
}

/**
 * Detect platform from current URL
 */
export function detectPlatformFromUrl(): string {
  // Check query param override (for dev/testing)
  const urlParams = new URLSearchParams(window.location.search)
  const queryPlatform = urlParams.get('platform')
  if (queryPlatform && getPlatform(queryPlatform)) {
    return queryPlatform
  }
  
  // Check localStorage (for persisting dev choice)
  const storedPlatform = localStorage.getItem('platform_id')
  if (storedPlatform && getPlatform(storedPlatform)) {
    return storedPlatform
  }
  
  // Check environment variable
  const envPlatform = import.meta.env.VITE_PLATFORM_ID
  if (envPlatform && getPlatform(envPlatform)) {
    return envPlatform
  }
  
  // Detect from domain
  const hostname = window.location.hostname
  const platform = getPlatformByDomain(hostname)
  if (platform) {
    return platform.id
  }
  
  // Fall back to default
  return DEFAULT_PLATFORM_ID
}
