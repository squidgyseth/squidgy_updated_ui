/**
 * Platform Configuration
 * 
 * Central registry for all platforms. Add or remove platforms here.
 * This is the single source of truth for platform definitions.
 */

export interface PlatformTheme {
  primaryColor: string
  secondaryColor: string
  logo: string
  favicon: string
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
    workspaces: boolean      // Team/org support
    tokenBilling: boolean    // Token-based usage
    perAgentBilling: boolean // Per-agent pricing
    perUserBilling: boolean  // Per-seat pricing
  }
}

/**
 * Platform Definitions
 * 
 * To add a new platform:
 * 1. Add entry here with unique id
 * 2. Add environment variables: {PLATFORM_ID}_SUPABASE_URL, {PLATFORM_ID}_SUPABASE_ANON_KEY
 * 3. Configure domain DNS to point to Vercel
 * 4. Set up corresponding Supabase instance with schema
 */
export const platforms: Record<string, PlatformConfig> = {
  squidgy: {
    id: 'squidgy',
    name: 'squidgy',
    displayName: 'Squidgy',
    domains: ['squidgy.com', 'www.squidgy.com'],
    supabase: {
      url: process.env.NEXT_PUBLIC_SQUIDGY_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SQUIDGY_SUPABASE_ANON_KEY || '',
    },
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      logo: '/logos/squidgy.svg',
      favicon: '/favicons/squidgy.ico',
    },
    agents: 'all',
    features: {
      workspaces: true,
      tokenBilling: false,
      perAgentBilling: false,
      perUserBilling: false,
    },
  },

  yeaa: {
    id: 'yeaa',
    name: 'yeaa',
    displayName: 'YEAA',
    domains: ['yeaa.com', 'www.yeaa.com'],
    supabase: {
      url: process.env.NEXT_PUBLIC_YEAA_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_YEAA_SUPABASE_ANON_KEY || '',
    },
    theme: {
      primaryColor: '#f59e0b',
      secondaryColor: '#d97706',
      logo: '/logos/yeaa.svg',
      favicon: '/favicons/yeaa.ico',
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
    },
  },

  fanatiq: {
    id: 'fanatiq',
    name: 'fanatiq',
    displayName: 'FanatiQ',
    domains: ['fanatiq.com', 'www.fanatiq.com'],
    supabase: {
      url: process.env.NEXT_PUBLIC_FANATIQ_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_FANATIQ_SUPABASE_ANON_KEY || '',
    },
    theme: {
      primaryColor: '#ef4444',
      secondaryColor: '#dc2626',
      logo: '/logos/fanatiq.svg',
      favicon: '/favicons/fanatiq.ico',
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
    },
  },

  trades: {
    id: 'trades',
    name: 'trades',
    displayName: 'Trades',
    domains: ['trades.com', 'www.trades.com'],
    supabase: {
      url: process.env.NEXT_PUBLIC_TRADES_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_TRADES_SUPABASE_ANON_KEY || '',
    },
    theme: {
      primaryColor: '#f97316',
      secondaryColor: '#ea580c',
      logo: '/logos/trades.svg',
      favicon: '/favicons/trades.ico',
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
    },
  },

  finance: {
    id: 'finance',
    name: 'finance',
    displayName: 'Finance',
    domains: ['finance.com', 'www.finance.com'],
    supabase: {
      url: process.env.NEXT_PUBLIC_FINANCE_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_FINANCE_SUPABASE_ANON_KEY || '',
    },
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#0284c7',
      logo: '/logos/finance.svg',
      favicon: '/favicons/finance.ico',
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
