# Current Supabase Database Architecture Analysis

## Overview

Analysis of the existing Supabase database schema based on query results from December 2024.

**Key Stats:**
- **43 Tables** in public schema
- **100+ Indexes** for performance
- **19 Triggers** for automation
- **50+ Functions** including vector operations
- **10 Storage Buckets**
- **RLS Disabled** on all tables (only 1 policy exists)
- **No Custom Enums** (Query 9 returned empty)

---

## Current Tables (43 Total)

### By Category

| Category | Tables | Row Count |
|----------|--------|-----------|
| **Chat/Conversations** | chat_history, chat_history_old_backup, agent_conversations | 1,032 |
| **Content** | content_repurposer_images, history_content_repurposer, history_newsletters, newsletter_documents, website_documents | 91 |
| **User/Auth** | profiles | 38 |
| **Onboarding** | user_onboarding, assistant_personalizations, assistant_customization, onboarding_company_details, onboarding_sessions | 30 |
| **Business Config** | business_details, business_settings, solar_setup, calendar_setup, notification_preferences, website_analysis | 40 |
| **Leads/CRM** | leads, lead_information, notifications | 25 |
| **Integrations** | facebook_integrations, ghl_subaccounts | 32 |
| **Referral System** | referral_tiers, referral_codes, referral_shares, referral_waitlist, referral_achievements, referral_leaderboard, referrals, referral_rewards, user_tier_status, user_rewards | 14 |
| **Billing** | billing_settings, billing_invoices | 1 |
| **MCP System** | mcps, mcp_audit_logs, security_scans | 4 |
| **Agents** | agents | 0 |
| **Knowledge Base** | firm_users_knowledge_base | 6 |
| **Team** | team_members | 1 |

---

## Table Details

### 1. Chat & Conversations

#### `chat_history` (741 rows) - **MAIN CONVERSATION STORAGE**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | text | |
| session_id | text | |
| sender | text | |
| message | text | |
| timestamp | timestamptz | |
| agent_name | text | |
| agent_id | text | |
| message_hash | text | Deduplication |
| mcp_tool_used | text | MCP integration |
| mcp_context | jsonb | MCP context |

#### `agent_conversations` (0 rows) - **UNUSED**
- FK to `agents(agent_id)`
- Appears to be newer schema but not in use

#### `chat_history_old_backup` (291 rows)
- Backup of old chat format

---

### 2. User & Authentication

#### `profiles` (38 rows)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | Links to auth.users |
| email | text | |
| full_name | text | |
| profile_avatar_url | text | |
| company_id | uuid | |
| role | text | |
| email_confirmed | boolean | |
| ghl_record_id | text | GHL integration |

**Note:** Has `user_id` column that other tables reference via FK.

---

### 3. Onboarding System

#### `user_onboarding` (5 rows)
- FK to `profiles(user_id)`
- Tracks onboarding progress (steps 1-6)
- Stores business_type, selected_departments, selected_assistants

#### `assistant_personalizations` (20 rows)
- FK to `profiles(user_id)`
- Custom names, tones, instructions per assistant

#### `assistant_customization` (4 rows) - **DUPLICATE?**
- Similar to assistant_personalizations
- Has company_id, more fields (specialization, tagline, capabilities)
- No FK constraints

#### `onboarding_company_details` (1 row)
- FK to `profiles(user_id)`
- Company info collected during onboarding

#### `onboarding_sessions` (0 rows)
- FK to `profiles(user_id)`
- Session tracking for analytics

---

### 4. Business Configuration

#### `business_details` (8 rows)
| Column | Type | Notes |
|--------|------|-------|
| firm_user_id | uuid | |
| agent_id | varchar(50) | Default 'SOL' |
| business_name, email, phone | | |
| address fields | | |
| ghl_location_id | varchar(255) | GHL integration |
| ghl_user_id | varchar(255) | GHL integration |

**Note:** No FK constraint to profiles, no PK constraint!

#### `business_settings` (1 row) - **DUPLICATE?**
- Has user_id (not firm_user_id)
- Similar fields to business_details
- Has company_logo_url

#### `solar_setup` (9 rows)
- Solar-specific configuration
- Pricing, financing, incentives
- Has ghl_location_id, ghl_user_id

#### `calendar_setup` (6 rows)
- Calendar/appointment settings
- Business hours, duration, booking rules
- Has ghl_location_id, ghl_user_id

#### `notification_preferences` (6 rows)
- Email, SMS, WhatsApp, GHL notification settings
- Has ghl_location_id, ghl_user_id

#### `website_analysis` (9 rows)
- Website screenshot, favicon, analysis data

---

### 5. Leads & CRM

#### `leads` (5 rows)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| company_id | uuid | |
| name, email, phone | | |
| status | text | new/contacted/qualified/proposal_sent/won/lost |
| qualification_score | integer | 0-100 |
| estimated_value | numeric | |
| currency | text | Default 'GBP' |

#### `lead_information` (3 rows)
- FK to `leads(id)`
- Extended lead data (notes, files, proposals, activities)

#### `notifications` (17 rows)
- GHL message notifications
- ghl_location_id, ghl_contact_id
- Message content, sender info
- read_status, responded_status
- mcp_context for MCP integration

---

### 6. Integrations

#### `facebook_integrations` (16 rows)
- Facebook/Meta ads integration
- Credentials, tokens, page IDs
- Automation status tracking

#### `ghl_subaccounts` (16 rows)
- GoHighLevel subaccount management
- Business info, GHL IDs
- Automation status

---

### 7. Content Creation

#### `history_content_repurposer` (7 rows)
- FK to `chat_history(id)`
- Content repurposing history

#### `content_repurposer_images` (39 rows)
- FK to `history_content_repurposer(id)`
- Generated images for content

#### `history_newsletters` (8 rows)
- FK to `chat_history(id)`
- Newsletter generation history

#### `newsletter_documents` (17 rows)
- Has `embedding` column (vector type)
- For RAG/semantic search

#### `website_documents` (20 rows)
- Similar to newsletter_documents
- Website content for RAG

---

### 8. Referral System (Complete)

| Table | Rows | Purpose |
|-------|------|---------|
| referral_tiers | 4 | Bronze/Silver/Gold/Diamond |
| referral_codes | 2 | User referral codes |
| referral_shares | 4 | Social sharing tracking |
| referral_waitlist | 2 | Waitlist positions |
| referral_achievements | 2 | Unlocked achievements |
| referral_leaderboard | 0 | Rankings |
| referrals | 0 | Referral relationships |
| referral_rewards | 0 | Reward definitions |
| user_tier_status | 0 | User tier progress |
| user_rewards | 0 | Earned rewards |

---

### 9. Billing

#### `billing_settings` (1 row)
- Subscription info, Stripe IDs
- Payment method details

#### `billing_invoices` (0 rows)
- Invoice history

---

### 10. MCP System

#### `mcps` (2 rows)
- MCP server registrations
- URL, name, trust_level, status

#### `mcp_audit_logs` (0 rows)
- FK to `mcps(id)`
- Tool usage logging

#### `security_scans` (2 rows)
- FK to `mcps(id)`
- Security scan results

---

### 11. Knowledge Base

#### `firm_users_knowledge_base` (6 rows)
- User-uploaded documents
- File info, extracted text
- Processing status

---

### 12. Team

#### `team_members` (1 row)
- Team member invitations
- Role, status, avatar

---

## Foreign Key Relationships

```
profiles
├── assistant_personalizations (user_id)
├── user_onboarding (user_id)
├── onboarding_company_details (user_id)
└── onboarding_sessions (user_id)

agents
└── agent_conversations (agent_id)

chat_history
├── history_content_repurposer (chat_history_id)
└── history_newsletters (chat_history_id)

history_content_repurposer
└── content_repurposer_images (history_content_repurposer_id)

leads
└── lead_information (lead_id)

mcps
├── mcp_audit_logs (mcp_id)
└── security_scans (mcp_id)

referral_tiers
└── referral_rewards (tier_id)
```

---

## Issues Identified

### 1. Missing Foreign Keys
- `business_details` - No FK to profiles
- `business_settings` - No FK to profiles
- `solar_setup` - No FK to profiles
- `calendar_setup` - No FK to profiles
- `notification_preferences` - No FK to profiles
- `website_analysis` - No FK to profiles
- `leads` - No FK to profiles
- `billing_settings` - No FK to profiles
- `team_members` - No FK to profiles

### 2. Missing Primary Keys
- `business_details` - No PK constraint
- `solar_setup` - No PK constraint
- `calendar_setup` - No PK constraint
- `notification_preferences` - No PK constraint
- `website_analysis` - No PK constraint
- `ghl_subaccounts` - No PK constraint
- `facebook_integrations` - No PK constraint

### 3. Duplicate/Redundant Tables
- `assistant_personalizations` vs `assistant_customization` - Similar purpose
- `business_details` vs `business_settings` - Similar purpose
- `chat_history` vs `agent_conversations` - Chat storage

### 4. Inconsistent Naming
- `firm_user_id` vs `user_id` - Inconsistent user reference
- `last_updated_timestamp` vs `updated_at` vs `last_updated` - Timestamp naming

### 5. Missing Tables (vs planned schema)
- `workspaces` - Team workspace management
- `workspace_members` - Workspace membership
- `projects` - Project organization
- `agent_runs` - Agent execution tracking
- `content` - Content management
- `usage` - Usage tracking for billing
- `subscriptions` - Subscription management
- `api_keys` - API key management
- `platform_pricing` - Pricing tiers

---

## Recommendations for Multi-Platform Migration

### Phase 1: Schema Cleanup
1. Add missing PKs to all tables
2. Add missing FKs for data integrity
3. Consolidate duplicate tables:
   - Keep `assistant_personalizations`, migrate data from `assistant_customization`
   - Keep `business_details`, migrate data from `business_settings`
   - Decide on `chat_history` vs `agent_conversations`

### Phase 2: Standardize Naming
1. Use `user_id` consistently (not `firm_user_id`)
2. Use `updated_at` consistently for timestamps
3. Add `created_at` to all tables

### Phase 3: Add Missing Tables
1. Add `platform_pricing` for pricing tiers
2. Add `workspaces` and `workspace_members` if needed
3. Add `usage` for billing tracking
4. Add `api_keys` for MCP server access

### Phase 4: Multi-Platform Deployment
1. Export cleaned schema
2. Create new Supabase projects for each platform
3. Run schema on each project
4. Configure platform-specific email templates
5. Update environment variables

---

## Tables to Include in Multi-Platform Schema

### Core (Must Have)
- profiles
- user_onboarding
- assistant_personalizations
- onboarding_company_details
- business_details
- solar_setup
- calendar_setup
- notification_preferences
- website_analysis
- leads
- lead_information
- notifications
- billing_settings
- billing_invoices
- platform_pricing

### Chat/Content
- chat_history
- history_content_repurposer
- content_repurposer_images
- history_newsletters
- newsletter_documents
- website_documents
- firm_users_knowledge_base

### Integrations
- facebook_integrations
- ghl_subaccounts

### Referral System
- referral_tiers
- referral_codes
- referral_shares
- referral_waitlist
- referral_achievements
- referral_leaderboard
- referrals
- referral_rewards
- user_tier_status
- user_rewards

### MCP System
- mcps
- mcp_audit_logs
- security_scans

### Team
- team_members

### Agents
- agents
- agent_conversations (if using)

---

## Data Migration Notes

When migrating to new platform instances:

1. **User data stays with platform** - Each platform gets its own users
2. **No cross-platform data sharing** - Complete isolation
3. **Referral system per platform** - Users can only refer within same platform
4. **Billing per platform** - Separate Stripe accounts recommended

---

## Additional Findings from Query Results

### Storage Buckets (10 Total)

| Bucket | Public | Created |
|--------|--------|---------|
| agentkbs | true | 2025-05-24 |
| avatars | true | 2025-05-11 |
| company | true | 2025-10-28 |
| content_repurposer | true | 2025-11-01 |
| invoices | true | 2025-10-29 |
| newsletter | true | 2025-10-13 |
| newsletter-images | true | 2025-11-03 |
| profiles | true | 2025-05-09 |
| Squidgy | true | 2025-12-17 |
| static | true | 2025-05-09 |

### RLS Status

**All tables have RLS DISABLED** - Only one policy exists:
- `profiles` table: "Allow anonymous email existence check" (SELECT for anon role)

### Triggers (19 Total)

| Table | Trigger | Event | Function |
|-------|---------|-------|----------|
| assistant_personalizations | trigger_update_personalization_timestamp | UPDATE | update_personalization_timestamp() |
| content_repurposer_images | update_content_repurposer_images_updated_date | UPDATE | update_updated_date_column() |
| firm_users_knowledge_base | trigger_update_firm_users_knowledge_base_updated_at | UPDATE | update_firm_users_knowledge_base_updated_at() |
| history_content_repurposer | after_history_content_repurposer_content_change | INSERT/UPDATE | trigger_content_repurpose_questions_async() |
| history_content_repurposer | update_history_content_repurposer_updated_at | UPDATE | update_updated_at_column() |
| history_newsletters | after_history_newsletters_content_change | INSERT/UPDATE | trigger_content_repurpose_questions_async() |
| history_newsletters | update_history_newsletters_updated_at | UPDATE | update_updated_at_column() |
| mcps | update_mcps_updated_at | UPDATE | update_updated_at_column() |
| newsletter_documents | newsletter_documents_newsletter_id | INSERT | set_newsletter_id_from_metadata() |
| newsletter_documents | newsletter_documents_user_id | INSERT | set_user_id_from_metadata() |
| notifications | set_conversation_id_trigger | INSERT | generate_conversation_id() |
| notifications | trigger_update_notifications_timestamp | UPDATE | update_notifications_timestamp() |
| onboarding_company_details | trigger_update_company_details_onboarding_timestamp | UPDATE | update_company_details_onboarding_timestamp() |
| user_onboarding | trigger_update_onboarding_timestamp | UPDATE | update_onboarding_timestamp() |
| website_analysis | after_website_analysis_content_change | INSERT/UPDATE | trigger_newsletter_questions_async() |
| website_documents | website_documents_user_id | INSERT | set_user_id_from_metadata() |

### Key Functions

**Business Logic:**
- `activate_referral(p_referee_id)` - Activates referral, awards credits
- `get_or_create_referral_code(p_user_id)` - Generates referral codes
- `get_onboarding_progress(p_user_id)` - Returns onboarding status
- `is_onboarding_completed(p_user_id)` - Checks onboarding completion
- `handle_new_user()` - Trigger function for new user signup
- `create_invitation_with_profile()` - Team invitation system
- `generate_conversation_id()` - Creates GHL conversation IDs

**Vector/Embedding Functions (pgvector):**
- `cosine_distance()`, `inner_product()`, `l1_distance()`, `l2_distance()`
- `array_to_vector()`, `array_to_halfvec()`, `array_to_sparsevec()`
- `get_agent_expertise_score()` - RAG similarity scoring
- `get_agent_knowledge_smart()` - Smart knowledge retrieval
- `get_client_context_similarity()` - Client context matching

**HTTP Functions:**
- `http_get()`, `http_post()`, `http_put()`, `http_delete()`, `http_patch()`

### Table Size Analysis

**Largest Tables by Total Size:**
| Table | Total Size | Data | Indexes |
|-------|------------|------|---------|
| business_settings | 3008 kB | 8 kB | 3000 kB |
| chat_history | 616 kB | 360 kB | 256 kB |
| website_documents | 344 kB | 24 kB | 320 kB |
| content_repurposer_images | 288 kB | 88 kB | 200 kB |
| history_newsletters | 272 kB | 24 kB | 248 kB |

### Views Detected (from Query 13)

- `client_agent_knowledge_base_view` - Aggregates user knowledge base data
- `lead_activities` - Lead activity view
- `lead_communications` - Lead communication view
- `mcp_stats` - MCP statistics view
- `recent_mcp_activity` - Recent MCP activity view

---

## Tables Missing from Original Schema Script

The following tables exist in your database but were not in the original `platform_complete_schema.sql`:

1. **chat_history** - Main conversation storage (741 rows)
2. **chat_history_old_backup** - Backup table
3. **facebook_integrations** - Facebook/Meta integration
4. **firm_users_knowledge_base** - User document uploads
5. **history_content_repurposer** - Content repurposing history
6. **history_newsletters** - Newsletter history
7. **content_repurposer_images** - Generated images
8. **newsletter_documents** - Newsletter RAG documents (with embeddings)
9. **website_documents** - Website RAG documents (with embeddings)
10. **mcps** - MCP server registry
11. **mcp_audit_logs** - MCP usage logs
12. **security_scans** - MCP security scans
13. **assistant_customization** - Alternative assistant config
14. **business_settings** - Alternative business config
15. **team_members** - Team member management
16. **referral_rewards** - Reward definitions

---

## Index Summary

**Total Indexes: 100+**

Well-indexed tables:
- `chat_history` - session, timestamp, user_agent indexes
- `content_repurposer_images` - 8 indexes including composite
- `notifications` - 8 indexes including partial index for unread
- `leads` - 8 indexes for common queries
- `history_content_repurposer` - 6 indexes

Tables with unique constraints via indexes:
- `business_details` - unique(firm_user_id, agent_id)
- `calendar_setup` - unique(firm_user_id, agent_id)
- `notification_preferences` - unique(firm_user_id, agent_id)
- `ghl_subaccounts` - unique(firm_user_id, agent_id)
- `facebook_integrations` - unique(firm_user_id)
