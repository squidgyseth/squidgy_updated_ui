# Multi-Platform Database Architecture

## Overview

This document outlines the database architecture for supporting multiple whitelabel platforms from a single codebase.

**Updated:** December 2025 - Minimal Architecture (Database-Level Isolation)

---

## Architecture Decision: Database-Level Isolation

Each platform has its own **isolated Supabase instance**. This means:

- ✅ **No `platform_id` columns needed** on user tables
- ✅ Complete data isolation at database level
- ✅ Platform-specific email templates and auth settings
- ✅ Independent scaling per platform
- ✅ Simplified queries (no platform filtering)
- ✅ Minimal code changes to existing Squidgy codebase

**Platforms:**
| Platform | Supabase Project | Auth Email Domain |
|----------|------------------|-------------------|
| Squidgy | squidgy-prod | @squidgy.com |
| YEAA | yeaa-prod | @yeaa.com |
| FanatiQ | fanatiq-prod | @fanatiq.com |
| Trades | trades-prod | @trades.com |
| Finance | finance-prod | @finance.com |

---

## Schema Files

### For Squidgy (Existing Database)

The Squidgy database has been upgraded with multi-platform extensions. The complete schema is in:

```
database/SQUIDGY_FULL_SCHEMA.sql
```

### For New Platforms (YEAA, etc.)

Run this on a fresh Supabase project:

```
database/NEW_PLATFORM_SETUP.sql
```

---

## Key Tables for Multi-Platform

### 1. `platform_config` (1 row per database)

Identifies this database and its billing model:

```sql
CREATE TABLE platform_config (
    platform_id TEXT NOT NULL UNIQUE,      -- 'squidgy', 'yeaa', etc.
    platform_name TEXT NOT NULL,
    billing_model TEXT DEFAULT 'all_access', -- 'all_access', 'per_agent', 'hybrid'
    supports_teams BOOLEAN DEFAULT FALSE,
    max_team_size INTEGER DEFAULT 1,
    trial_days INTEGER DEFAULT 14,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}'
);
```

### 2. `billing_settings` (Extended)

Extended with multi-platform billing fields:

```sql
-- New columns added:
billing_model TEXT DEFAULT 'all_access',
seats_purchased INTEGER DEFAULT 1,
seats_used INTEGER DEFAULT 0,
agent_access JSONB DEFAULT '{}',           -- Per-agent access: {"SOL": {"active": true}}
usage_this_period JSONB DEFAULT '{"runs": 0, "tokens": 0}'
```

### 3. `team_members` (Extended)

Extended with permissions:

```sql
-- New columns added:
permissions JSONB DEFAULT '{}',            -- {"can_manage_billing": false}
allowed_agents TEXT[]                      -- ["SOL", "newsletter"] or null for all
```

### 4. `chat_history` (Extended)

Extended with usage tracking:

```sql
-- New columns added:
tokens_used INTEGER DEFAULT 0,
cost_usd DECIMAL(10, 6) DEFAULT 0
```

### 5. `user_knowledge_base` (New Table)

Stores extracted/structured KB content per user. General Assistant creates KB, other agents read/use it:

```sql
CREATE TABLE user_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,  -- 01-12 KB categories
    content JSONB NOT NULL,  -- Structured KB content
    source_file TEXT,        -- Original filename
    source_url TEXT,         -- File URL in storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**KB Categories (12-category structure):**
| # | Category | Content |
|---|----------|---------|
| 01 | company-overview | Business model, mission, history |
| 02 | icp-target-audience | Customer personas, job titles |
| 03 | branding-identity | Logo, colors, tone of voice |
| 04 | messaging-positioning | Taglines, value props |
| 05 | product-services | Products, features, pricing |
| 06 | sales-process | Sales stages, objections |
| 07 | marketing-channels | Channels, campaigns |
| 08 | development-technical | Tech stack, integrations |
| 09 | operations-workflows | Tools, SOPs |
| 10 | contacts-stakeholders | Key people, roles |
| 11 | customer-success | Onboarding, support |
| 12 | competitive-landscape | Competitors, positioning |

### 6. `api_keys` (New Table)

For MCP server access:

```sql
CREATE TABLE api_keys (
    user_id UUID NOT NULL,
    company_id UUID,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    allowed_agents TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ
);
```

---

## Helper Functions

### `check_agent_access(user_id, agent_id)`

Checks if a user can access an agent based on the platform's billing model:

```sql
SELECT check_agent_access('user-uuid', 'SOL');
-- Returns: true/false
```

### `get_user_agents(user_id)`

Returns list of agents the user can access:

```sql
SELECT get_user_agents('user-uuid');
-- Returns: ['*'] for all-access, or ['SOL', 'newsletter'] for per-agent
```

### `track_usage(user_id, agent_id, tokens, cost)`

Tracks usage for billing:

```sql
SELECT track_usage('user-uuid', 'SOL', 1500, 0.003);
```

---

## Billing Models

### 1. All-Access (Squidgy Default)

- User pays for a plan (Free, Starter, Pro, Enterprise)
- Gets access to ALL agents
- `billing_model = 'all_access'`

### 2. Per-Agent

- User pays per agent individually
- Access tracked in `billing_settings.agent_access` JSONB
- `billing_model = 'per_agent'`

```json
{
  "SOL": {"active": true, "expires": null},
  "newsletter": {"active": true, "expires": "2025-01-01"}
}
```

### 3. Hybrid

- Base plan gives access to some agents
- Premium agents require additional purchase
- `billing_model = 'hybrid'`

---

## Environment Variables

### Backend

```bash
# Squidgy
SQUIDGY_SUPABASE_URL=https://xxx.supabase.co
SQUIDGY_SUPABASE_ANON_KEY=eyJ...
SQUIDGY_SUPABASE_SERVICE_KEY=eyJ...

# YEAA
YEAA_SUPABASE_URL=https://yyy.supabase.co
YEAA_SUPABASE_ANON_KEY=eyJ...
YEAA_SUPABASE_SERVICE_KEY=eyJ...
```

### Frontend

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Platform-specific (optional)
VITE_YEAA_SUPABASE_URL=https://yyy.supabase.co
VITE_YEAA_SUPABASE_ANON_KEY=eyJ...
```

---

## Implementation Summary

### What Changed for Multi-Platform

| Component | Change |
|-----------|--------|
| `billing_settings` | +5 columns for billing model, seats, agent access, usage |
| `team_members` | +2 columns for permissions, allowed agents |
| `chat_history` | +2 columns for token/cost tracking |
| `platform_config` | New table (1 row identifies platform) |
| `api_keys` | New table for MCP access |
| `user_knowledge_base` | New table for shared KB (General Assistant creates, all agents use) |
| `knowledge-base` bucket | New storage bucket with user-specific folders |
| Functions | 3 new helper functions + KB cleanup trigger |

### What Stayed the Same

- All existing table structures
- All existing queries
- Frontend `BillingSettings.tsx` works unchanged
- No `platform_id` on user tables (database isolation)

---

## Email Configuration Per Platform

Each Supabase project needs custom email templates:

1. **Go to Authentication > Email Templates**
2. **Update branding per platform:**

| Template | Squidgy | YEAA |
|----------|---------|------|
| Confirm Email | From: noreply@squidgy.com | From: noreply@yeaa.com |
| Reset Password | Squidgy branding | YEAA branding |

### Custom SMTP (Recommended)

```
# Squidgy
SMTP_HOST=smtp.squidgy.com
SMTP_FROM=noreply@squidgy.com

# YEAA  
SMTP_HOST=smtp.yeaa.com
SMTP_FROM=noreply@yeaa.com
```

---

## Quick Start

### Upgrade Existing Squidgy

Already done - schema is in `database/SQUIDGY_FULL_SCHEMA.sql`

### Setup New Platform (YEAA)

1. Create new Supabase project
2. Run `database/NEW_PLATFORM_SETUP.sql`
3. Configure platform:
   ```sql
   INSERT INTO platform_config (platform_id, platform_name, billing_model)
   VALUES ('yeaa', 'YEAA', 'per_agent');
   ```
4. Add agents:
   ```sql
   INSERT INTO agents (agent_id, name) VALUES ('content_writer', 'Content Writer');
   ```
5. Set environment variables
6. Configure email templates
