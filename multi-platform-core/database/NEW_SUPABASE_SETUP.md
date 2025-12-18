# Multi-Platform Supabase Setup Guide

## Overview

You only need **2 SQL files**:

| File | Run On | Purpose |
|------|--------|---------|
| `SQUIDGY_WHITELABEL_UPGRADE.sql` | **Existing Squidgy Supabase** | Add white-label support (run ONCE) |
| `NEW_PLATFORM_SETUP.sql` | **New YEAA/clone Supabase** | Complete setup for new platforms |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-PLATFORM ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  SQUIDGY (Main)      │    │  YEAA/New Platform   │          │
│  │  Existing Supabase   │    │  Fresh Supabase      │          │
│  ├──────────────────────┤    ├──────────────────────┤          │
│  │ ✅ Existing tables   │    │ ✅ Core tables       │          │
│  │ ✅ + Core tables     │    │ ✅ Flexible billing  │          │
│  │ ✅ + Flexible billing│    │ ✅ Helper functions  │          │
│  │ ✅ Solar, GHL, etc.  │    │ ❌ No Squidgy tables │          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                  │
│  Run: SQUIDGY_WHITELABEL     Run: NEW_PLATFORM_SETUP            │
│       _UPGRADE.sql                 .sql                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Step 1: Upgrade Existing Squidgy (Run Once)

Open Supabase SQL Editor on your **existing Squidgy project** and run:

```sql
-- Copy entire contents of SQUIDGY_WHITELABEL_UPGRADE.sql
-- Paste and run in SQL Editor
```

This adds:
- Missing core tables (workspaces, projects, agent_runs, etc.)
- Flexible billing system (8 tables)
- Helper functions
- Squidgy configured as default platform

### Step 2: Create New Platform (YEAA, etc.)

1. Create a new Supabase project
2. Open SQL Editor and run:

```sql
-- Copy entire contents of NEW_PLATFORM_SETUP.sql
-- Paste and run in SQL Editor
```

3. Configure your platform:

```sql
INSERT INTO platform_billing_config (platform_id, billing_model, supports_teams)
VALUES ('yeaa', 'per_agent', false);
```

---

## Table Summary

### Core Tables (Both Platforms)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `workspaces` | Teams/Organizations |
| `workspace_members` | Team membership |
| `projects` | Projects within workspaces |
| `agent_runs` | Agent execution logs |
| `content` | Generated content |
| `usage` | Usage tracking for billing |
| `api_keys` | MCP server access keys |
| `chat_history` | Conversation storage |

### Flexible Billing Tables (Both Platforms)

| Table | Purpose |
|-------|---------|
| `platform_billing_config` | Billing model per platform |
| `subscription_plans` | Platform-specific plans |
| `agent_bundles` | Bundle definitions |
| `agent_pricing` | Per-agent pricing |
| `user_subscriptions` | Active subscriptions |
| `user_agent_access` | Individual agent purchases |
| `subscription_team_members` | Team seat assignments |
| `billing_usage_records` | Usage tracking for pay-per-use |

### Squidgy-Specific Tables (Already exist, not touched)

| Table | Purpose |
|-------|---------|
| `business_details` | Business info with GHL integration |
| `solar_setup` | Solar agent configuration |
| `calendar_setup` | Calendar settings |
| `notification_preferences` | Notification settings |
| `website_analysis` | Website analysis results |
| `leads` | Lead information |
| `billing_settings` | Existing billing (Squidgy-specific) |
| `referral_*` | Referral system tables |

---

## Storage Buckets

### Core Buckets (All Platforms)
- `avatars` (public) - User avatars
- `content` (private) - Generated content
- `documents` (private) - User documents

### Squidgy-Specific Buckets
- `company` (private) - Company assets
- `invoices` (private) - Invoice PDFs
- `newsletter` (private) - Newsletter files
- `newsletter-images` (public) - Newsletter images
- `content_repurposer` (private) - Repurposed content
- `agentkbs` (private) - Agent knowledge bases
- `profiles` (public) - Profile images
- `Squidgy` (public) - Platform assets
- `static` (public) - Static files

---

## Environment Variables

After creating the Supabase project, add these to your `.env`:

```bash
# Squidgy Supabase
SQUIDGY_SUPABASE_URL=https://your-project.supabase.co
SQUIDGY_SUPABASE_ANON_KEY=eyJ...
SQUIDGY_SUPABASE_SERVICE_KEY=eyJ...

# For Vite frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Frontend/Backend Compatibility

These schemas are designed to work with the existing frontend and backend code **without changes**:

### Frontend (`client/lib/api.ts`)
- Uses `firm_user_id` and `agent_id` for all setup tables ✅
- Expects GHL fields (`ghl_location_id`, `ghl_user_id`) ✅
- Uses `chat_history` for conversations ✅

### Backend (`server/index.ts`)
- All API endpoints remain compatible ✅
- No changes needed to route handlers ✅

---

## Migration from Old Database

If migrating data from an existing Supabase project:

1. Export data from old project using Supabase Dashboard or `pg_dump`
2. Run the new schema scripts on fresh project
3. Import data using Supabase Dashboard or `psql`

**Note:** The new schema has cleaner structure but maintains the same column names and types for compatibility.

---

## RLS (Row Level Security)

RLS is **disabled** by default for development simplicity. For production:

1. Enable RLS on each table:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

2. Add appropriate policies:
```sql
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
```

---

## Platform-Specific Extensions

### For YEAA Platform
Create `02_yeaa_specific.sql` with:
- Sports/entertainment specific tables
- Different agent configurations

### For FanatiQ Platform
Create `02_fanatiq_specific.sql` with:
- Fan engagement tables
- Sports analytics tables

### For Trades Platform
Create `02_trades_specific.sql` with:
- Trade/contractor specific tables
- Job management tables

### For Finance Platform
Create `02_finance_specific.sql` with:
- Financial advisor tables
- Portfolio management tables

---

## Verification

After running the scripts, verify with:

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check storage buckets
SELECT name, public FROM storage.buckets ORDER BY name;
```

Expected counts:
- Core only: 10 tables
- Squidgy full: 34 tables
