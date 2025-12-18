# Backend Multi-Platform Integration Instructions

**Updated:** December 2025

## Overview

We are transforming our FastAPI backend into a multi-platform system that serves 5 different branded platforms from a single codebase. Each platform has its own:
- Domain (e.g., squidgy.com, yeaa.com, fanatiq.com, trades.com, finance.com)
- Supabase database instance (with service key access)
- Available agents (AI agents with different capabilities)
- Pricing model and feature flags

The core API logic remains the same across all platforms - only the configuration, database connection, and feature access differ.

---

## Architecture Context

```
Frontend sends request with X-Platform-ID header
        ↓
FastAPI middleware reads header
        ↓
Sets platform context in request.state
        ↓
Route handlers use platform-aware dependencies
        ↓
Supabase client connects to correct database
        ↓
Response includes X-Platform-ID header for debugging
```

**Key principle:** The platform is determined by the `X-Platform-ID` header from the frontend, or by Origin/Referer headers as fallback.

---

## Files to Integrate

### 1. `config/platforms.py`

**Purpose:** Central registry of all platform configurations. This is the single source of truth for:
- Platform IDs and display names
- Domain mappings
- Supabase connection details (URL + anon key + service key)
- Available agents per platform
- Feature flags (workspaces, billing types)

**Placement:** `/config/platforms.py` or `/app/config/platforms.py` (match your project structure)

**Integration notes:**
- Environment variables follow the pattern `{PLATFORM_ID}_SUPABASE_URL`, etc.
- The service key is used for admin operations that bypass RLS
- Add or remove platforms as needed
- Keep agent lists in sync with frontend

---

### 2. `config/__init__.py`

**Purpose:** Makes the config directory a Python package and exports commonly used items.

**Placement:** `/config/__init__.py`

---

### 3. `core/platform.py`

**Purpose:** FastAPI middleware and dependencies for platform detection:
- `PlatformMiddleware` - Detects platform from request headers
- `get_platform_id` - Dependency to get current platform ID
- `get_current_platform` - Dependency to get full platform config
- `require_agent_access(agent_id)` - Dependency factory to gate agent access
- `PlatformContext` - Context object with platform info

**Placement:** `/core/platform.py` or `/app/core/platform.py`

**Integration notes:**
- Add middleware to your FastAPI app
- Use dependencies in route handlers
- The middleware tries multiple detection methods in order

---

### 4. `core/database.py`

**Purpose:** Platform-aware Supabase client factory:
- `SupabaseClientFactory` - Creates and caches clients per platform
- `get_supabase` - Dependency for user-context client (uses anon key, RLS applies)
- `get_supabase_admin` - Dependency for admin client (uses service key, bypasses RLS)
- `DatabaseContext` - Combined context with platform info and database clients

**Placement:** `/core/database.py` or `/app/core/database.py`

**Integration notes:**
- Clients are cached per platform to avoid reconnection overhead
- Use admin client carefully - it has full database access
- The factory validates environment variables on first use

---

### 5. `core/__init__.py`

**Purpose:** Makes the core directory a Python package and exports commonly used items.

**Placement:** `/core/__init__.py`

---

### 6. `.env.example`

**Purpose:** Template for environment variables needed for all platforms.

**Placement:** `/.env.example` (copy to `.env` for development)

**Integration notes:**
- For development, you only need one platform's credentials
- Service keys should NEVER be exposed to frontend
- Includes JWT, Stripe, N8N, and AI provider config placeholders

---

## Integration Steps

### Step 1: Install dependencies

```bash
pip install supabase pydantic python-dotenv
```

Or add to your requirements.txt:
```
supabase>=2.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

### Step 2: Add the files

Copy the provided files to their respective locations in your project. Typical structure:

```
your-backend/
├── app/
│   ├── main.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── platforms.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── platform.py
│   │   └── database.py
│   └── routes/
│       └── ...
├── .env
└── .env.example
```

### Step 3: Add middleware to FastAPI app

Update your `main.py` to include the platform middleware:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.platform import PlatformMiddleware

app = FastAPI(title="Multi-Platform API")

# Add CORS middleware (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add platform detection middleware
app.add_middleware(PlatformMiddleware)

# Your routes...
```

### Step 4: Update route handlers

Use the platform dependencies in your route handlers:

**Basic platform access:**
```python
from fastapi import Depends
from core.platform import get_platform_id, get_current_platform

@app.get("/api/info")
async def get_info(platform_id: str = Depends(get_platform_id)):
    return {"platform": platform_id}

@app.get("/api/config")
async def get_config(platform = Depends(get_current_platform)):
    return {
        "name": platform.display_name,
        "features": platform.features.dict(),
    }
```

**With database access:**
```python
from core.database import get_supabase, get_database_context, DatabaseContext
from supabase import Client

@app.get("/api/profiles")
async def list_profiles(supabase: Client = Depends(get_supabase)):
    result = supabase.table("profiles").select("*").execute()
    return result.data

@app.post("/api/agents/{agent_id}/run")
async def run_agent(
    agent_id: str,
    ctx: DatabaseContext = Depends(get_database_context)
):
    # Check agent access
    if not ctx.can_access_agent(agent_id):
        raise HTTPException(403, f"Agent '{agent_id}' not available on this platform")
    
    # Create run record
    result = ctx.supabase.table("agent_runs").insert({
        "agent_id": agent_id,
        "status": "pending",
    }).execute()
    
    return {"run_id": result.data[0]["id"]}
```

**Gating specific agents:**
```python
from core.platform import require_agent_access

@app.post("/api/agents/lead-generator/run")
async def run_lead_generator(
    payload: dict,
    platform_id: str = require_agent_access("lead-generator")
):
    # This only executes if platform has access to lead-generator
    # Otherwise returns 403 automatically
    return {"status": "started"}
```

### Step 5: Update existing Supabase usage

Replace any existing Supabase client creation with the new platform-aware functions:

**Before:**
```python
from supabase import create_client
supabase = create_client(url, key)
```

**After (in route handlers):**
```python
from core.database import get_supabase
from fastapi import Depends

@app.get("/api/data")
async def get_data(supabase = Depends(get_supabase)):
    # supabase is already connected to the correct platform's database
    result = supabase.table("data").select("*").execute()
    return result.data
```

**After (outside route handlers):**
```python
from core.database import get_client, get_admin

# For user-context operations
supabase = get_client("yeaa")

# For admin operations (bypasses RLS)
supabase_admin = get_admin("yeaa")
```

### Step 6: Set up environment variables

Create `.env` from `.env.example` and fill in your credentials:

```bash
# Default platform for development
DEFAULT_PLATFORM_ID=squidgy

# JWT for MCP server tokens
JWT_SECRET=your-secret-key

# Squidgy Supabase
SQUIDGY_SUPABASE_URL=https://xxx.supabase.co
SQUIDGY_SUPABASE_ANON_KEY=eyJ...
SQUIDGY_SUPABASE_SERVICE_KEY=eyJ...
```

### Step 7: Load environment variables

Ensure your app loads the `.env` file. Add to your `main.py` or config:

```python
from dotenv import load_dotenv
load_dotenv()
```

### Step 8: Test locally

1. Start the server: `uvicorn app.main:app --reload`
2. Test with platform header:
```bash
curl -H "X-Platform-ID: squidgy" http://localhost:8000/api/info
curl -H "X-Platform-ID: yeaa" http://localhost:8000/api/info
```
3. Check that different platforms connect to different databases

---

## Common Modifications Needed

### If using a different project structure

Adjust imports in the files to match your structure:

```python
# If your structure is flat:
from config.platforms import get_platform

# If using app/ directory:
from app.config.platforms import get_platform
```

### If you have existing auth middleware

The platform middleware should run after auth middleware. The platform detection can also use authenticated user context if needed.

### If using async Supabase client

The current implementation uses the sync client. For async:

```python
from supabase._async.client import AsyncClient, create_client

async def get_async_client(platform_id: str) -> AsyncClient:
    platform = get_platform(platform_id)
    return await create_client(platform.supabase.url, platform.supabase.anon_key)
```

### If using dependency injection framework

Adapt the `SupabaseClientFactory` to work with your DI container.

---

## N8N Webhook Integration

When receiving webhooks from N8N or triggering N8N workflows:

**Receiving from N8N:**
```python
@app.post("/webhook/n8n-complete")
async def n8n_callback(
    payload: dict,
    ctx: DatabaseContext = Depends(get_database_context)
):
    run_id = payload["run_id"]
    status = payload["status"]
    
    # Update in the correct platform's database
    ctx.supabase.table("agent_runs").update({
        "status": status,
        "output": payload.get("output"),
        "completed_at": "now()",
    }).eq("id", run_id).execute()
    
    return {"ok": True}
```

**Triggering N8N:**
```python
import httpx

async def trigger_n8n_workflow(
    platform_id: str,
    agent_id: str,
    run_id: str,
    payload: dict,
    jwt_token: str,
):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            os.getenv("N8N_WEBHOOK_URL"),
            json={
                "platform_id": platform_id,
                "agent_id": agent_id,
                "run_id": run_id,
                "jwt_token": jwt_token,  # For MCP server auth
                "callback_url": f"{os.getenv('API_BASE_URL')}/webhook/n8n-complete",
                "payload": payload,
            },
            headers={"Authorization": f"Bearer {os.getenv('N8N_API_KEY')}"}
        )
        return response.json()
```

---

## JWT Token Issuance (for MCP Server)

The backend issues JWT tokens for MCP server authentication:

```python
import jwt
from datetime import datetime, timedelta

def create_mcp_token(
    platform_id: str,
    user_id: str,
    project_ids: list[str],
) -> str:
    payload = {
        "platform_id": platform_id,
        "user_id": user_id,
        "project_ids": project_ids,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
    }
    
    return jwt.encode(
        payload,
        os.getenv("JWT_SECRET"),
        algorithm=os.getenv("JWT_ALGORITHM", "HS256")
    )
```

---

## Testing Checklist

- [ ] Middleware correctly reads X-Platform-ID header
- [ ] Fallback to Origin/Referer header works
- [ ] Default platform is used when no header present
- [ ] Platform context is available in request.state
- [ ] Supabase connects to correct instance per platform
- [ ] Agent access gating works (403 for unavailable agents)
- [ ] Admin client bypasses RLS correctly
- [ ] Response includes X-Platform-ID header

---

## Security Notes

- Service keys should NEVER be exposed to frontend or logs
- Always validate platform_id before using it
- Use the anon key client for user-context operations (RLS applies)
- Use admin client only for operations that truly need it
- JWT tokens for MCP should have short expiry times
- Implement token revocation checking

---

## Notes for AI Assistant

- This is a multi-tenant system where tenancy is determined by domain/header, not user
- All platforms share the same codebase and API structure
- The only differences are configuration, database connection, and feature access
- The frontend sends `X-Platform-ID` header with every request
- Each platform has its own isolated Supabase database
- The frontend (Next.js) has a parallel implementation - keep configurations in sync
- Service keys provide full database access - use carefully
- N8N workflows are platform-agnostic but receive platform_id to route correctly
