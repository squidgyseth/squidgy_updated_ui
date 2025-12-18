# Frontend Multi-Platform Integration Instructions

## Overview

We are transforming our Next.js frontend into a multi-platform system that serves 5 different branded platforms from a single codebase. Each platform has its own:
- Domain (e.g., squidgy.com, yeaa.com, fanatiq.com, trades.com, finance.com)
- Supabase database instance
- Theme (colors, logo, branding)
- Available agents (AI agents with different capabilities)
- Pricing model

The core UI and functionality remain the same across all platforms - only the configuration, branding, and feature access differ.

---

## Architecture Context

```
User visits yeaa.com
        ↓
Next.js middleware detects domain
        ↓
Sets platform_id = "yeaa" in headers/cookies
        ↓
App loads with YEAA branding, connects to YEAA Supabase
        ↓
Only YEAA-available agents are shown
```

**Key principle:** The platform is determined by the domain in production, and by environment variable or query param in development.

---

## Files to Integrate

### 1. `config/platforms.ts`

**Purpose:** Central registry of all platform configurations. This is the single source of truth for:
- Platform IDs and display names
- Domain mappings
- Supabase connection details (URL + anon key)
- Theme configuration (colors, logos)
- Available agents per platform
- Feature flags (workspaces, billing types)

**Placement:** `/config/platforms.ts` or `/src/config/platforms.ts` (match your project structure)

**Integration notes:**
- Update Supabase URLs and keys to use your actual environment variable names if different
- Add or remove platforms as needed
- Adjust theme colors to match your design system
- Update agent lists based on your actual agents

---

### 2. `middleware.ts`

**Purpose:** Next.js middleware that intercepts every request to:
- Detect the platform from the domain (production)
- Allow platform override via `?platform=xxx` query param (development)
- Set platform context via headers and cookies for downstream use

**Placement:** `/middleware.ts` (root of Next.js app, or `/src/middleware.ts` if using src directory)

**Integration notes:**
- If you have an existing middleware, merge this logic into it
- The matcher config excludes static files - adjust if needed
- In development, use `?platform=yeaa` to switch platforms

---

### 3. `lib/platform-context.tsx`

**Purpose:** React context provider and hooks for accessing platform configuration throughout the app:
- `PlatformProvider` - Wraps the app, provides platform context
- `usePlatform()` - Get current platform config
- `usePlatformTheme()` - Get theme colors/branding
- `useAgentAvailable(agentId)` - Check if agent is available
- `usePlatformFeatures()` - Check feature flags

**Placement:** `/lib/platform-context.tsx` or `/src/lib/platform-context.tsx`

**Integration notes:**
- This is a client component ('use client')
- Must wrap your app with `PlatformProvider` in the root layout
- Initial platform ID should come from server (headers) for SSR

---

### 4. `lib/supabase.ts`

**Purpose:** Platform-aware Supabase client factory that:
- Creates browser clients for client components
- Creates server clients for server components and API routes
- Automatically connects to the correct Supabase instance based on platform

**Placement:** `/lib/supabase.ts` or `/src/lib/supabase.ts`

**Integration notes:**
- If you have existing Supabase setup, replace it with this
- Update the `Database` type with your actual schema types
- Requires `@supabase/ssr` package

---

### 5. `.env.example`

**Purpose:** Template for environment variables needed for all platforms.

**Placement:** `/.env.example` (copy to `.env.local` for development)

**Integration notes:**
- For development, you only need one platform's credentials
- Add credentials for other platforms as you set them up
- All Supabase env vars must be prefixed with `NEXT_PUBLIC_` for client access

---

## Integration Steps

### Step 1: Install dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Step 2: Add the files

Copy the provided files to their respective locations in your project.

### Step 3: Update root layout

Modify your root `layout.tsx` to include the PlatformProvider:

```tsx
import { PlatformProvider } from '@/lib/platform-context'
import { headers } from 'next/headers'

export default async function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const headersList = await headers()
  const platformId = headersList.get('x-platform-id') || 'squidgy'
  
  return (
    <html lang="en">
      <body>
        <PlatformProvider initialPlatformId={platformId}>
          {children}
        </PlatformProvider>
      </body>
    </html>
  )
}
```

### Step 4: Update existing Supabase usage

Replace any existing Supabase client creation with the new platform-aware functions:

**Before:**
```tsx
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

**After (client components):**
```tsx
import { createClient } from '@/lib/supabase'
const supabase = createClient()
```

**After (server components):**
```tsx
import { createServerComponentClient } from '@/lib/supabase'
const supabase = await createServerComponentClient()
```

### Step 5: Apply theming

Update your UI components to use platform theme:

```tsx
'use client'
import { usePlatformTheme, usePlatform } from '@/lib/platform-context'

export function Header() {
  const { platform } = usePlatform()
  const theme = usePlatformTheme()
  
  return (
    <header style={{ backgroundColor: theme.primaryColor }}>
      <img src={theme.logo} alt={platform.displayName} />
      <h1>{platform.displayName}</h1>
    </header>
  )
}
```

### Step 6: Gate agent access

Check agent availability before showing or enabling agents:

```tsx
'use client'
import { useAgentAvailable } from '@/lib/platform-context'

export function AgentCard({ agentId, agentName }) {
  const isAvailable = useAgentAvailable(agentId)
  
  if (!isAvailable) {
    return (
      <div className="agent-card locked">
        <span>{agentName}</span>
        <span>Not available on this plan</span>
      </div>
    )
  }
  
  return (
    <div className="agent-card">
      <span>{agentName}</span>
      <button>Run Agent</button>
    </div>
  )
}
```

### Step 7: Set up environment variables

Create `.env.local` from `.env.example` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_PLATFORM_ID=squidgy
NEXT_PUBLIC_SQUIDGY_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SQUIDGY_SUPABASE_ANON_KEY=eyJ...
```

### Step 8: Test locally

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000` - should load default platform (squidgy)
3. Visit `http://localhost:3000?platform=yeaa` - should switch to YEAA
4. Check that theming changes and agent availability differs

---

## Common Modifications Needed

### If using Tailwind CSS

Update your tailwind config to use CSS variables for platform colors:

```tsx
// In a client component
const theme = usePlatformTheme()

// Set CSS variables
useEffect(() => {
  document.documentElement.style.setProperty('--color-primary', theme.primaryColor)
  document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor)
}, [theme])
```

### If using a UI library (shadcn, etc.)

Map platform theme to your UI library's theme system.

### If you have existing auth

The Supabase client handles auth automatically. Ensure your auth flows use the platform-aware client.

---

## Testing Checklist

- [ ] Middleware correctly detects platform from query param
- [ ] Platform context is available in client components
- [ ] Theme colors apply correctly
- [ ] Supabase connects to correct instance
- [ ] Agent availability checks work
- [ ] Server components can access platform context
- [ ] API routes receive platform headers

---

## Notes for AI Assistant

- This is a multi-tenant system where tenancy is determined by domain, not user
- All platforms share the same codebase and UI structure
- The only differences are configuration, branding, and feature access
- In production, domain detection is automatic via middleware
- In development, use `?platform=xxx` query parameter to switch
- Each platform has its own isolated Supabase database
- The backend (FastAPI) has a parallel implementation - keep configurations in sync
