# Whitelabel Feature Guide

This document explains how to use the whitelabel/multi-platform feature in the Squidgy frontend.

## Overview

The whitelabel feature allows serving multiple branded platforms from a single codebase. Each platform can have:
- Custom branding (colors, logos, gradients)
- Different Supabase database instances
- Platform-specific agent availability
- Feature flags (referrals, newsletter, leads, etc.)

## Architecture

```
User visits domain (e.g., yeaa.com)
        ↓
Platform detected from URL/domain
        ↓
PlatformContext provides config to all components
        ↓
CSS variables updated for theming
        ↓
Platform-specific branding and features displayed
```

## Files Structure

```
client/
├── config/
│   └── platforms.ts          # Platform definitions (single source of truth)
├── contexts/
│   └── PlatformContext.tsx   # React context provider and hooks
├── lib/
│   └── platform-supabase.ts  # Platform-aware Supabase client
├── components/
│   └── PlatformBranding.tsx  # Reusable branding components
└── global.css                # CSS variables for theming

public/
└── logos/
    ├── squidgy.svg           # Platform logos
    ├── squidgy-light.svg
    ├── yeaa.svg
    └── ...
```

## Usage

### 1. Access Platform Context

```tsx
import { usePlatform, usePlatformTheme } from '../contexts/PlatformContext'

function MyComponent() {
  const { platform, platformId } = usePlatform()
  const theme = usePlatformTheme()
  
  return (
    <div style={{ color: theme.primaryColor }}>
      Welcome to {platform.displayName}
    </div>
  )
}
```

### 2. Check Agent Availability

```tsx
import { useAgentAvailable } from '../contexts/PlatformContext'

function AgentCard({ agentId }) {
  const isAvailable = useAgentAvailable(agentId)
  
  if (!isAvailable) {
    return <LockedAgentCard />
  }
  
  return <AvailableAgentCard />
}
```

### 3. Check Feature Flags

```tsx
import { usePlatformFeatures, useFeatureEnabled } from '../contexts/PlatformContext'

function ReferralSection() {
  const hasReferrals = useFeatureEnabled('referrals')
  
  if (!hasReferrals) {
    return null
  }
  
  return <ReferralHub />
}
```

### 4. Use Platform Branding Components

```tsx
import { 
  PlatformLogo, 
  PlatformName, 
  PlatformButton,
  PlatformGradientText,
  PlatformSwitcher 
} from '../components/PlatformBranding'

function Header() {
  return (
    <header>
      <PlatformLogo showName />
      <PlatformGradientText>Welcome!</PlatformGradientText>
      <PlatformButton>Get Started</PlatformButton>
      
      {/* Dev only - switch platforms */}
      <PlatformSwitcher />
    </header>
  )
}
```

### 5. Use Tailwind Platform Classes

```tsx
// Use platform colors via Tailwind
<div className="bg-platform-primary text-white">
  Primary colored background
</div>

<div className="text-platform-secondary">
  Secondary colored text
</div>

<div className="bg-platform-gradient">
  Platform gradient background
</div>
```

## Adding a New Platform

1. **Add platform config** in `client/config/platforms.ts`:

```ts
export const platforms: Record<string, PlatformConfig> = {
  // ... existing platforms
  
  newplatform: {
    id: 'newplatform',
    name: 'newplatform',
    displayName: 'New Platform',
    domains: ['newplatform.com', 'www.newplatform.com'],
    supabase: {
      url: getEnvVar('VITE_NEWPLATFORM_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_NEWPLATFORM_SUPABASE_ANON_KEY'),
    },
    theme: {
      primaryColor: '#your-color',
      secondaryColor: '#your-color',
      accentColor: '#your-color',
      logo: '/logos/newplatform.svg',
      logoLight: '/logos/newplatform-light.svg',
      favicon: '/favicons/newplatform.ico',
      gradientStart: '#your-color',
      gradientMid: '#your-color',
      gradientEnd: '#your-color',
    },
    agents: ['agent-1', 'agent-2'], // or 'all'
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
}
```

2. **Add environment variables** to `.env`:

```bash
VITE_NEWPLATFORM_SUPABASE_URL=https://your-project.supabase.co
VITE_NEWPLATFORM_SUPABASE_ANON_KEY=your-anon-key
```

3. **Add logo files** to `public/logos/`:
   - `newplatform.svg`
   - `newplatform-light.svg`

4. **Configure domain DNS** to point to your deployment

## Local Development

### Switch Platforms

**Option 1: Query Parameter**
```
http://localhost:5173?platform=yeaa
```

**Option 2: Environment Variable**
```bash
# .env
VITE_PLATFORM_ID=yeaa
```

**Option 3: Platform Switcher Component**
Add `<PlatformSwitcher />` to your UI (only visible in development)

### Test Different Platforms

1. Start dev server: `npm run dev`
2. Visit `http://localhost:5173` - loads default (squidgy)
3. Visit `http://localhost:5173?platform=yeaa` - switches to YEAA
4. Check that theming changes and agent availability differs

## Production Deployment

### Vercel/Netlify

1. Add all environment variables from `.env.example`
2. Configure multiple domains pointing to the same deployment:
   - squidgy.com → deployment
   - yeaa.com → deployment
   - fanatiq.com → deployment

The platform is automatically detected from the domain.

### Environment Variables Required

```bash
# Default Supabase (required)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Platform-specific Supabase (optional - uses default if not set)
VITE_YEAA_SUPABASE_URL=https://xxx.supabase.co
VITE_YEAA_SUPABASE_ANON_KEY=eyJ...
# ... repeat for other platforms
```

## Available Platforms

| Platform | ID | Primary Color | Description |
|----------|-----|---------------|-------------|
| Squidgy | `squidgy` | Purple (#5E17EB) | Default platform, all agents |
| YEAA | `yeaa` | Amber (#f59e0b) | Marketing/growth focused |
| FanatiQ | `fanatiq` | Red (#ef4444) | Sports/fan engagement |
| Trades | `trades` | Orange (#f97316) | Trades/services |
| Finance | `finance` | Sky Blue (#0ea5e9) | Financial services |

## Hooks Reference

| Hook | Description |
|------|-------------|
| `usePlatform()` | Get current platform config and ID |
| `usePlatformTheme()` | Get current platform's theme colors |
| `useAgentAvailable(agentId)` | Check if agent is available |
| `useAvailableAgents()` | Get list of available agents |
| `usePlatformFeatures()` | Get all feature flags |
| `useFeatureEnabled(feature)` | Check if specific feature is enabled |

## CSS Variables

The following CSS variables are set dynamically based on platform:

```css
--platform-primary: #5E17EB;
--platform-secondary: #A61D92;
--platform-accent: #FB252A;
--platform-gradient-start: #FB252A;
--platform-gradient-mid: #A61D92;
--platform-gradient-end: #6017E8;
```

## Tailwind Classes

```css
/* Colors */
bg-platform-primary
bg-platform-secondary
bg-platform-accent
text-platform-primary
text-platform-secondary
text-platform-accent
border-platform-primary

/* Gradient */
bg-platform-gradient
```
