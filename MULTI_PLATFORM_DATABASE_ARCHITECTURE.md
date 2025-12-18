# Multi-Platform Database Architecture

## Overview

This document outlines the database architecture for supporting multiple whitelabel platforms (Squidgy, YEAA, FanatiQ, Trades, Finance) from a single codebase.

**Updated:** December 2024 - Based on actual Supabase database analysis

### Current Database Stats (Squidgy Production)
- **43 Tables** in public schema
- **100+ Indexes** for performance
- **19 Triggers** for automation
- **50+ Functions** including pgvector for RAG
- **10 Storage Buckets**
- **RLS Disabled** on all tables (only 1 policy exists)

### Key Decision: Table Isolation Strategy

1. **Fully Isolated** - Separate tables per platform (different Supabase instances)
2. **Shared with platform_id** - Single table with `platform_id` column to filter
3. **Fully Shared** - Same data across all platforms

---

## Platform Isolation Strategy

### Option A: Separate Supabase Instances (Recommended)

Each platform gets its own Supabase project with identical schema. This provides:
- Complete data isolation
- Platform-specific email templates (auth emails from @squidgy.com vs @yeaa.com)
- Independent scaling
- Simplified RLS (no platform_id filtering needed)
- Platform-specific Supabase Auth settings

**Platforms:**
| Platform | Supabase Project | Auth Email Domain |
|----------|------------------|-------------------|
| Squidgy | squidgy-prod | @squidgy.com |
| YEAA | yeaa-prod | @yeaa.com |
| FanatiQ | fanatiq-prod | @fanatiq.com |
| Trades | trades-prod | @trades.com |
| Finance | finance-prod | @finance.com |

---

## Table Categories

### 1. FULLY ISOLATED (Per-Platform Supabase Instance)

These tables contain user-specific data and should be completely isolated per platform:

#### Authentication & Users
| Table | Reason for Isolation |
|-------|---------------------|
| `auth.users` | Supabase Auth - users belong to one platform |
| `profiles` | User profiles linked to auth.users |
| `api_keys` | User API keys for MCP server |

#### User Data & History
| Table | Reason for Isolation |
|-------|---------------------|
| `user_onboarding` | Onboarding progress per user |
| `assistant_personalizations` | User's agent customizations |
| `onboarding_company_details` | Company details per user |
| `onboarding_sessions` | Session tracking |
| `agent_conversations` | Chat history |
| `agent_runs` | Agent execution logs |
| `content` | Generated content |

#### Business Configuration
| Table | Reason for Isolation |
|-------|---------------------|
| `business_details` | Business info per user |
| `solar_setup` | Solar agent configuration |
| `calendar_setup` | Calendar settings |
| `notification_preferences` | Notification settings |
| `website_analysis` | Website analysis results |

#### Billing & Subscriptions
| Table | Reason for Isolation |
|-------|---------------------|
| `billing_settings` | Subscription info |
| `billing_invoices` | Invoice history |
| `subscriptions` | Stripe subscriptions |
| `usage` | Usage tracking for billing |

#### Leads & CRM
| Table | Reason for Isolation |
|-------|---------------------|
| `leads` | Lead information |
| `lead_information` | Extended lead data |
| `notifications` | GHL message notifications |

#### Workspaces & Projects
| Table | Reason for Isolation |
|-------|---------------------|
| `workspaces` | Team workspaces |
| `workspace_members` | Workspace membership |
| `projects` | Projects within workspaces |

#### Referral System
| Table | Reason for Isolation |
|-------|---------------------|
| `referral_codes` | User referral codes |
| `referrals` | Referral relationships |
| `user_tier_status` | User tier progress |
| `user_rewards` | Earned rewards |
| `referral_shares` | Social shares |
| `referral_waitlist` | Waitlist positions |
| `referral_leaderboard` | Leaderboard rankings |
| `referral_achievements` | Unlocked achievements |

#### Content Creation
| Table | Reason for Isolation |
|-------|---------------------|
| `newsletter_projects` | Newsletter content |
| `history_content_repurposer` | Content repurposing |
| `history_newsletters` | Newsletter generation history |
| `content_repurposer_images` | Generated images |
| `newsletter_documents` | RAG documents with embeddings |
| `website_documents` | Website RAG documents |

#### Chat & Conversations
| Table | Reason for Isolation |
|-------|---------------------|
| `chat_history` | Primary conversation storage (741 rows) |
| `agent_conversations` | Alternative chat storage |

#### Integrations
| Table | Reason for Isolation |
|-------|---------------------|
| `facebook_integrations` | Facebook/Meta ads integration |
| `ghl_subaccounts` | GoHighLevel subaccounts |

#### Knowledge Base
| Table | Reason for Isolation |
|-------|---------------------|
| `firm_users_knowledge_base` | User-uploaded documents |

#### MCP System
| Table | Reason for Isolation |
|-------|---------------------|
| `mcps` | MCP server registrations |
| `mcp_audit_logs` | Tool usage logging |
| `security_scans` | Security scan results |

#### Team Management
| Table | Reason for Isolation |
|-------|---------------------|
| `team_members` | Team member invitations |

---

### 2. SHARED WITH `platform_id` FIELD (Optional Central Database)

If you want a central database for cross-platform analytics or admin, these tables could be shared with a `platform_id` column:

#### Agent Definitions (Read-Only Reference)
```sql
-- Add platform_id to agents table for availability filtering
ALTER TABLE agents ADD COLUMN IF NOT EXISTS platform_id VARCHAR(50);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS available_platforms TEXT[] DEFAULT ARRAY['squidgy'];

-- Example: Agent available on multiple platforms
UPDATE agents SET available_platforms = ARRAY['squidgy', 'yeaa', 'fanatiq'] 
WHERE agent_id = 'social-media-manager';

-- Example: Agent only on specific platform
UPDATE agents SET available_platforms = ARRAY['finance'] 
WHERE agent_id = 'financial-advisor';
```

#### Referral Tiers (Shared Configuration)
```sql
-- Tiers can be shared or platform-specific
ALTER TABLE referral_tiers ADD COLUMN IF NOT EXISTS platform_id VARCHAR(50) DEFAULT 'all';

-- Platform-specific tiers
INSERT INTO referral_tiers (tier_name, tier_level, min_referrals, platform_id)
VALUES ('yeaa_gold', 3, 5, 'yeaa');
```

---

### 3. FULLY SHARED (Same Across All Platforms)

No tables are fully shared - all tables are isolated per platform for complete data separation.

---

## Schema Changes Required

### For Each Platform's Supabase Instance

Run the base schema from `multi-platform-core/supabase/schema.sql` on each platform's Supabase project. This creates:
- profiles
- workspaces
- workspace_members
- projects
- agent_runs
- content
- usage
- subscriptions
- api_keys

### Additional Tables Per Platform

Run these additional schemas on each platform:

```sql
-- 1. Onboarding System
\i database/onboarding_schema.sql

-- 2. Business Details
\i database/business_details_table.sql

-- 3. Solar Setup
\i database/solar_setup_table.sql

-- 4. Calendar Setup
\i database/calendar_setup_table.sql

-- 5. Notification Preferences
\i database/notification_preferences_table.sql

-- 6. Website Analysis
\i database/website_analysis_table.sql

-- 7. Leads
\i database/leads_table.sql
\i database/lead_information_table.sql

-- 8. Billing
\i database/billing_settings_table.sql

-- 9. Newsletter
\i database/newsletter_schema.sql

-- 10. Referral System
\i supabase/migrations/20241116_referral_system_complete.sql

-- 11. Agents (if not using central)
\i database/agents_schema.sql
```

---

## Email Configuration Per Platform

Each Supabase project needs custom email templates:

### Supabase Auth Settings

1. **Go to Authentication > Email Templates**
2. **Update for each platform:**

| Template | Squidgy | YEAA | FanatiQ |
|----------|---------|------|---------|
| Confirm Email | From: noreply@squidgy.com | From: noreply@yeaa.com | From: noreply@fanatiq.com |
| Reset Password | Subject: Reset your Squidgy password | Subject: Reset your YEAA password | Subject: Reset your FanatiQ password |
| Magic Link | Branded with Squidgy logo | Branded with YEAA logo | Branded with FanatiQ logo |

### Custom SMTP (Recommended)

For production, configure custom SMTP per platform:

```
# Squidgy
SMTP_HOST=smtp.squidgy.com
SMTP_FROM=noreply@squidgy.com

# YEAA  
SMTP_HOST=smtp.yeaa.com
SMTP_FROM=noreply@yeaa.com
```

---

## Agent Availability

Agents are the same across platforms but with different availability. Two approaches:

### Approach A: Frontend-Only Gating (Current)

Agents are defined in `client/config/platforms.ts` with availability per platform:
```typescript
agents: ['social-media-manager', 'content-creator', 'lead-generator']
// or
agents: 'all'
```

**Pros:** Simple, no database changes
**Cons:** Security relies on frontend, users could bypass

### Approach B: Backend + Database Gating (Recommended for Production)

Add `platform_agents` table to central admin database:

```sql
CREATE TABLE platform_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id VARCHAR(50) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    custom_pricing JSONB, -- Platform-specific pricing
    custom_limits JSONB,  -- Platform-specific limits
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, agent_id)
);

-- Squidgy has all agents
INSERT INTO platform_agents (platform_id, agent_id) 
SELECT 'squidgy', agent_id FROM agents;

-- YEAA has specific agents
INSERT INTO platform_agents (platform_id, agent_id) VALUES
('yeaa', 'social-media-manager'),
('yeaa', 'content-creator'),
('yeaa', 'email-marketer');

-- FanatiQ has sports-focused agents
INSERT INTO platform_agents (platform_id, agent_id) VALUES
('fanatiq', 'social-media-manager'),
('fanatiq', 'fan-engagement-specialist');
```

---

## Pricing Models Per Platform

Each platform can have different pricing:

### Option 1: Platform-Specific Stripe Products

Create separate Stripe products/prices per platform:
- `squidgy_pro_monthly`
- `yeaa_pro_monthly`
- `fanatiq_pro_monthly`

### Option 2: Shared Products with Platform Metadata

Use Stripe metadata to track platform:
```json
{
  "platform_id": "yeaa",
  "plan_type": "pro"
}
```

### Database Schema for Pricing

```sql
CREATE TABLE platform_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'enterprise'
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),
    features JSONB,
    limits JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, plan_type)
);

-- Example pricing
INSERT INTO platform_pricing (platform_id, plan_name, plan_type, price_monthly, features) VALUES
('squidgy', 'Squidgy Pro', 'pro', 49.00, '{"agents": "all", "runs_per_month": 1000}'),
('yeaa', 'YEAA Pro', 'pro', 39.00, '{"agents": ["social-media-manager", "content-creator"], "runs_per_month": 500}'),
('fanatiq', 'FanatiQ Pro', 'pro', 29.00, '{"agents": ["social-media-manager"], "runs_per_month": 300}');
```

---

## Implementation Checklist

### Phase 1: Database Setup

- [ ] Create Supabase project for each platform
- [ ] Run base schema on each project
- [ ] Run additional table schemas
- [ ] Configure email templates per platform
- [ ] Set up custom SMTP (optional)

### Phase 2: Backend Integration

- [ ] Implement platform middleware (from `multi-platform-core/backend`)
- [ ] Create platform-aware Supabase client factory
- [ ] Add agent access gating
- [ ] Update all endpoints to use platform context

### Phase 3: Frontend Integration

- [x] Platform detection and context (completed)
- [x] Dynamic theming (completed)
- [ ] Update auth flows to use platform Supabase
- [ ] Update all API calls to include X-Platform-ID header

### Phase 4: Testing

- [ ] Test user registration on each platform
- [ ] Verify email branding per platform
- [ ] Test agent availability gating
- [ ] Test data isolation between platforms

---

## Environment Variables

### Per Platform (Backend)

```bash
# Squidgy
SQUIDGY_SUPABASE_URL=https://xxx.supabase.co
SQUIDGY_SUPABASE_ANON_KEY=eyJ...
SQUIDGY_SUPABASE_SERVICE_KEY=eyJ...
SQUIDGY_STRIPE_SECRET_KEY=sk_...

# YEAA
YEAA_SUPABASE_URL=https://yyy.supabase.co
YEAA_SUPABASE_ANON_KEY=eyJ...
YEAA_SUPABASE_SERVICE_KEY=eyJ...
YEAA_STRIPE_SECRET_KEY=sk_...

# ... repeat for other platforms
```

### Frontend (Vite)

```bash
# Default
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Platform-specific (optional, uses default if not set)
VITE_YEAA_SUPABASE_URL=https://yyy.supabase.co
VITE_YEAA_SUPABASE_ANON_KEY=eyJ...
```

---

## Summary

| Category | Strategy | Tables |
|----------|----------|--------|
| **User Data** | Fully Isolated | profiles, onboarding, conversations, etc. |
| **Business Config** | Fully Isolated | business_details, solar_setup, calendar_setup, notification_preferences, website_analysis |
| **Billing & Pricing** | Fully Isolated | billing_settings, billing_invoices, platform_pricing |
| **Leads/CRM** | Fully Isolated | leads, lead_information, notifications |
| **Referrals** | Fully Isolated | All referral_* tables (10 tables) |
| **Agents** | Fully Isolated | agents, agent_conversations |
| **Chat** | Fully Isolated | chat_history (primary), agent_conversations |
| **Content** | Fully Isolated | history_newsletters, history_content_repurposer, content_repurposer_images |
| **Documents/RAG** | Fully Isolated | newsletter_documents, website_documents, firm_users_knowledge_base |
| **Integrations** | Fully Isolated | facebook_integrations, ghl_subaccounts |
| **MCP System** | Fully Isolated | mcps, mcp_audit_logs, security_scans |
| **Team** | Fully Isolated | team_members |

**Recommendation:** Use separate Supabase instances per platform for complete isolation, with a central admin database for cross-platform configuration (agent availability, pricing) if needed.

---

## Complete Table List (43 Tables)

Based on December 2024 database analysis:

### Core Tables
1. `profiles` - User profiles (38 rows)
2. `agents` - Agent definitions (0 rows - defined in code)
3. `chat_history` - Primary conversation storage (741 rows)
4. `agent_conversations` - Alternative chat storage (0 rows)

### Onboarding (5 tables)
5. `user_onboarding` - Onboarding progress
6. `assistant_personalizations` - Agent customizations
7. `assistant_customization` - Alternative customization (duplicate)
8. `onboarding_company_details` - Company info
9. `onboarding_sessions` - Session tracking

### Business Config (6 tables)
10. `business_details` - Business info
11. `business_settings` - Alternative business config (duplicate)
12. `solar_setup` - Solar agent config
13. `calendar_setup` - Calendar settings
14. `notification_preferences` - Notification settings
15. `website_analysis` - Website analysis

### Leads/CRM (3 tables)
16. `leads` - Lead information
17. `lead_information` - Extended lead data
18. `notifications` - GHL message notifications

### Billing (2 tables)
19. `billing_settings` - Subscription info
20. `billing_invoices` - Invoice history

### Content (6 tables)
21. `newsletter_projects` - Newsletter content
22. `history_newsletters` - Newsletter history
23. `history_content_repurposer` - Content repurposing history
24. `content_repurposer_images` - Generated images
25. `newsletter_documents` - RAG documents (embeddings)
26. `website_documents` - Website RAG documents

### Integrations (2 tables)
27. `facebook_integrations` - Facebook/Meta integration
28. `ghl_subaccounts` - GoHighLevel subaccounts

### Knowledge Base (1 table)
29. `firm_users_knowledge_base` - User documents

### MCP System (3 tables)
30. `mcps` - MCP server registry
31. `mcp_audit_logs` - Tool usage logs
32. `security_scans` - Security scans

### Referral System (10 tables)
33. `referral_tiers` - Tier definitions
34. `referral_codes` - User referral codes
35. `referral_rewards` - Reward definitions
36. `referrals` - Referral relationships
37. `user_tier_status` - User tier progress
38. `user_rewards` - Earned rewards
39. `referral_shares` - Social shares
40. `referral_waitlist` - Waitlist positions
41. `referral_leaderboard` - Rankings
42. `referral_achievements` - Achievements

### Team (1 table)
43. `team_members` - Team invitations

---

## Storage Buckets (10 Total)

| Bucket | Purpose |
|--------|---------|
| `agentkbs` | Agent knowledge bases |
| `avatars` | User avatars |
| `company` | Company assets |
| `content_repurposer` | Generated content |
| `invoices` | Invoice PDFs |
| `newsletter` | Newsletter files |
| `newsletter-images` | Newsletter images |
| `profiles` | Profile images |
| `Squidgy` | Platform assets |
| `static` | Static files |

---

## Schema Files

Run these scripts on each new Supabase instance:

```bash
# Complete schema (recommended - single file)
database/platform_complete_schema_v2.sql

# Or individual files:
database/agents_schema.sql           # Agents + chat_history
database/onboarding_schema.sql       # Onboarding system
database/business_details_table.sql  # Business details
database/solar_setup_table.sql       # Solar setup
database/calendar_setup_table.sql    # Calendar setup
database/notification_preferences_table.sql
database/website_analysis_table.sql
database/leads_table.sql
database/lead_information_table.sql
database/billing_settings_table.sql
database/newsletter_schema.sql       # Newsletter + content history + RAG
supabase/migrations/20241116_referral_system_complete.sql
```
