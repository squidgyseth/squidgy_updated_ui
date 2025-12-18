# Multi-Platform Core Implementation

This package contains the core files needed to transform your existing codebase into a multi-platform system.

## Quick Start

### 1. Set Up Supabase Instances

Create 5 Supabase projects (or start with 1 for development):

1. Go to [supabase.com](https://supabase.com)
2. Create a new project for each platform (e.g., `squidgy-prod`, `yeaa-prod`, etc.)
3. Run `supabase/schema.sql` in each project's SQL Editor
4. Copy the URL, anon key, and service key for each

### 2. Frontend Setup (Next.js)

Copy these files to your frontend repo:

```
your-frontend/
├── config/
│   └── platforms.ts      # Platform definitions
├── lib/
│   ├── platform-context.tsx  # React context
│   └── supabase.ts          # Supabase client
├── middleware.ts            # Domain detection
└── .env.local              # Environment variables
```

**Install dependencies:**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Update your layout.tsx:**

```tsx
import { PlatformProvider } from '@/lib/platform-context'
import { headers } from 'next/headers'

export default async function RootLayout({ children }) {
  const headersList = await headers()
  const platformId = headersList.get('x-platform-id') || 'squidgy'
  
  return (
    <html>
      <body>
        <PlatformProvider initialPlatformId={platformId}>
          {children}
        </PlatformProvider>
      </body>
    </html>
  )
}
```

**Use platform context in components:**

```tsx
'use client'
import { usePlatform, usePlatformTheme, useAgentAvailable } from '@/lib/platform-context'

export function Header() {
  const { platform } = usePlatform()
  const theme = usePlatformTheme()
  
  return (
    <header style={{ background: theme.primaryColor }}>
      <img src={theme.logo} alt={platform.displayName} />
      <h1>{platform.displayName}</h1>
    </header>
  )
}

export function AgentCard({ agentId }) {
  const isAvailable = useAgentAvailable(agentId)
  
  if (!isAvailable) {
    return <LockedAgentCard />
  }
  
  return <AvailableAgentCard />
}
```

### 3. Backend Setup (FastAPI)

Copy these files to your backend repo:

```
your-backend/
├── config/
│   └── platforms.py      # Platform definitions
├── core/
│   ├── platform.py       # Middleware & dependencies
│   └── database.py       # Supabase client factory
└── .env                  # Environment variables
```

**Install dependencies:**

```bash
pip install supabase pydantic python-dotenv
```

**Update your main.py:**

```python
from fastapi import FastAPI
from core.platform import PlatformMiddleware

app = FastAPI()

# Add platform detection middleware
app.add_middleware(PlatformMiddleware)
```

**Use platform context in routes:**

```python
from fastapi import Depends
from core.platform import get_platform_id, get_current_platform, require_agent_access
from core.database import get_supabase, DatabaseContext, get_database_context

@app.get("/api/agents")
async def list_agents(platform_id: str = Depends(get_platform_id)):
    return {"platform": platform_id}

@app.post("/api/agents/lead-generator/run")
async def run_lead_generator(
    ctx: DatabaseContext = Depends(get_database_context),
    _: str = require_agent_access("lead-generator")
):
    # Only runs if platform has access to lead-generator
    result = ctx.supabase.table("agent_runs").insert({
        "agent_id": "lead-generator",
        "status": "pending"
    }).execute()
    
    return {"run_id": result.data[0]["id"]}
```

### 4. Local Development

**Switch platforms locally:**

Option 1: Environment variable
```bash
# .env.local
NEXT_PUBLIC_PLATFORM_ID=yeaa
```

Option 2: Query parameter
```
http://localhost:3000?platform=yeaa
```

The query param sets a cookie, so subsequent requests maintain the platform context.

### 5. Production Deployment

**Vercel (Frontend):**

1. Connect your repo to Vercel
2. Add all environment variables from `.env.example`
3. Configure domains in Vercel:
   - squidgy.com → same deployment
   - yeaa.com → same deployment
   - etc.

The middleware automatically detects the domain and sets the platform.

**Heroku (Backend):**

1. Add all environment variables from `.env.example`
2. The middleware reads the `X-Platform-ID` header from frontend requests

---

## Adding a New Platform

1. **Add platform config** in both:
   - `frontend/config/platforms.ts`
   - `backend/config/platforms.py`

2. **Create Supabase instance**:
   - Create new project
   - Run `schema.sql`
   - Add credentials to environment variables

3. **Add environment variables**:
   - `{PLATFORM}_SUPABASE_URL`
   - `{PLATFORM}_SUPABASE_ANON_KEY`
   - `{PLATFORM}_SUPABASE_SERVICE_KEY`

4. **Configure domain** (production):
   - Point DNS to Vercel
   - Add domain to `platforms[].domains` array

---

## Removing a Platform

1. Remove from config files
2. Remove environment variables
3. (Optional) Delete Supabase project

---

## File Reference

| File | Purpose |
|------|---------|
| `frontend/config/platforms.ts` | Platform definitions, agents, themes |
| `frontend/middleware.ts` | Domain detection, sets platform context |
| `frontend/lib/platform-context.tsx` | React hooks for platform access |
| `frontend/lib/supabase.ts` | Platform-aware Supabase client |
| `backend/config/platforms.py` | Platform definitions (Python) |
| `backend/core/platform.py` | FastAPI middleware & dependencies |
| `backend/core/database.py` | Supabase client factory |
| `supabase/schema.sql` | Database schema for all platforms |

---

## Common Patterns

### Check agent availability

```tsx
// Frontend
const canUse = useAgentAvailable('lead-generator')

// Backend
if not ctx.can_access_agent('lead-generator'):
    raise HTTPException(403, "Not available")
```

### Check platform features

```tsx
// Frontend
const { workspaces, tokenBilling } = usePlatformFeatures()

// Backend
if ctx.has_feature('token_billing'):
    track_tokens(...)
```

### Apply theme

```tsx
const theme = usePlatformTheme()

<Button style={{ 
  background: theme.primaryColor,
  color: 'white' 
}}>
  Click me
</Button>
```

### Platform-specific content

```tsx
const { platformId } = usePlatform()

{platformId === 'fanatiq' && (
  <MatchDayBanner />
)}
```
