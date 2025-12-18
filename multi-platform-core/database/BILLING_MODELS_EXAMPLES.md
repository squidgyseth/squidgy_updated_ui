# Multi-Platform Billing Models

This document shows how to configure different billing strategies for each platform using the flexible billing schema (`04_flexible_billing.sql`).

---

## Billing Model Comparison

| Model | Description | Example Platform | Use Case |
|-------|-------------|------------------|----------|
| **All-Access** | Pay monthly, get all agents | Netflix, Spotify | Simple, predictable |
| **Per-Agent** | Buy agents individually | App Store | Maximum flexibility |
| **Bundle** | Buy groups of related agents | Adobe CC | Discounted packages |
| **Usage-Based** | Pay per use | AWS, OpenAI | Variable workloads |
| **Hybrid** | Subscription + add-ons | Slack, Notion | Best of both |

---

## Example 1: Squidgy (All-Access + Teams)

**Model:** All agents included in subscription, team support

```sql
-- Platform config
INSERT INTO platform_billing_config (platform_id, billing_model, supports_teams, max_team_size, trial_days)
VALUES ('squidgy', 'all_access', true, 25, 14);

-- Plans
INSERT INTO subscription_plans (platform_id, plan_code, plan_name, price_monthly, price_yearly, included_seats, limits, features) VALUES
('squidgy', 'free', 'Free', 0, 0, 1, 
 '{"runs_per_month": 100, "agents": 2}',
 '{"solar": false, "ghl": false}'),
 
('squidgy', 'pro', 'Pro', 49, 490, 1,
 '{"runs_per_month": 1000, "agents": -1}',
 '{"solar": true, "ghl": true, "priority_support": false}'),
 
('squidgy', 'team', 'Team', 99, 990, 5,
 '{"runs_per_month": 5000, "agents": -1}',
 '{"solar": true, "ghl": true, "priority_support": true}'),
 
('squidgy', 'enterprise', 'Enterprise', 299, 2990, 25,
 '{"runs_per_month": -1, "agents": -1}',
 '{"solar": true, "ghl": true, "priority_support": true, "white_label": true, "api_access": true}');
```

**User Flow:**
1. User signs up → Free plan (2 agents, 100 runs)
2. Upgrade to Pro → All agents, 1000 runs
3. Invite team → Team plan with 5 seats

---

## Example 2: YEAA (Per-Agent Purchases)

**Model:** Buy individual agents, no subscription required

```sql
-- Platform config
INSERT INTO platform_billing_config (platform_id, billing_model, supports_teams, free_tier_runs)
VALUES ('yeaa', 'per_agent', false, 50);

-- Individual agent pricing
INSERT INTO agent_pricing (platform_id, agent_id, price_one_time, price_monthly, free_runs_per_month) VALUES
('yeaa', 'content-creator', 29, 9, 10),
('yeaa', 'social-scheduler', 19, 5, 5),
('yeaa', 'analytics-pro', 49, 15, 0),
('yeaa', 'video-editor', 79, 25, 0),
('yeaa', 'thumbnail-maker', 15, NULL, 20);  -- One-time only
```

**User Flow:**
1. User signs up → Access to free tier (50 runs total)
2. Buy Content Creator → $29 one-time or $9/mo
3. Buy more agents as needed

---

## Example 3: FanatiQ (Bundle Model)

**Model:** Buy bundles of related agents at discount

```sql
-- Platform config
INSERT INTO platform_billing_config (platform_id, billing_model, supports_teams)
VALUES ('fanatiq', 'bundle', true);

-- Bundles
INSERT INTO agent_bundles (platform_id, bundle_code, bundle_name, agent_ids, price_monthly, price_yearly, discount_percent) VALUES
('fanatiq', 'fan-starter', 'Fan Starter Pack', 
 ARRAY['fan-engagement', 'poll-creator', 'trivia-bot'],
 19, 190, 20),

('fanatiq', 'content-pro', 'Content Pro Bundle',
 ARRAY['highlight-maker', 'stats-analyzer', 'post-generator', 'meme-creator'],
 39, 390, 25),

('fanatiq', 'ultimate', 'Ultimate Fan Bundle',
 ARRAY['fan-engagement', 'poll-creator', 'trivia-bot', 'highlight-maker', 'stats-analyzer', 'post-generator', 'meme-creator', 'live-commentator'],
 59, 590, 40);

-- Individual pricing (for comparison)
INSERT INTO agent_pricing (platform_id, agent_id, price_monthly) VALUES
('fanatiq', 'fan-engagement', 9),
('fanatiq', 'poll-creator', 5),
('fanatiq', 'trivia-bot', 7),
('fanatiq', 'highlight-maker', 15),
('fanatiq', 'stats-analyzer', 12),
('fanatiq', 'post-generator', 9),
('fanatiq', 'meme-creator', 7),
('fanatiq', 'live-commentator', 19);
```

**User Flow:**
1. User browses bundles → Sees 40% savings on Ultimate
2. Buys Fan Starter Pack → Gets 3 agents for $19/mo
3. Later upgrades to Ultimate → All 8 agents for $59/mo

---

## Example 4: Trades (Usage-Based)

**Model:** Pay per agent run, no subscription

```sql
-- Platform config
INSERT INTO platform_billing_config (platform_id, billing_model, free_tier_runs, free_tier_tokens)
VALUES ('trades', 'usage_based', 25, 5000);

-- Usage pricing per agent
INSERT INTO agent_pricing (platform_id, agent_id, price_per_run, price_per_1k_tokens, free_runs_per_month) VALUES
('trades', 'quote-generator', 0.10, 0.002, 10),
('trades', 'invoice-creator', 0.15, 0.002, 5),
('trades', 'job-scheduler', 0.05, 0.001, 10),
('trades', 'material-estimator', 0.25, 0.005, 5),
('trades', 'client-communicator', 0.08, 0.002, 10);

-- Optional: Volume discount plans
INSERT INTO subscription_plans (platform_id, plan_code, plan_name, price_monthly, limits) VALUES
('trades', 'starter', 'Starter Credits', 20,
 '{"prepaid_runs": 250, "bonus_runs": 25}'),
('trades', 'growth', 'Growth Credits', 50,
 '{"prepaid_runs": 700, "bonus_runs": 100}'),
('trades', 'unlimited', 'Unlimited', 150,
 '{"runs_per_month": -1}');
```

**User Flow:**
1. User signs up → 25 free runs
2. Uses Quote Generator → $0.10 per quote
3. Buys Starter Credits → 275 runs for $20 (save 20%)

---

## Example 5: Finance (Hybrid Model)

**Model:** Base subscription + premium add-ons

```sql
-- Platform config
INSERT INTO platform_billing_config (platform_id, billing_model, supports_teams, max_team_size)
VALUES ('finance', 'hybrid', true, 10);

-- Base subscription plans
INSERT INTO subscription_plans (platform_id, plan_code, plan_name, price_monthly, included_agents, limits) VALUES
('finance', 'advisor', 'Advisor', 79,
 ARRAY['portfolio-analyzer', 'report-generator', 'client-portal'],
 '{"clients": 50, "reports_per_month": 100}'),

('finance', 'firm', 'Firm', 199,
 ARRAY['portfolio-analyzer', 'report-generator', 'client-portal', 'compliance-checker', 'meeting-scheduler'],
 '{"clients": 200, "reports_per_month": 500, "team_seats": 5}'),

('finance', 'enterprise', 'Enterprise', 499,
 ARRAY['*'],  -- All agents
 '{"clients": -1, "reports_per_month": -1, "team_seats": 25}');

-- Premium add-ons (buy separately)
INSERT INTO agent_pricing (platform_id, agent_id, price_monthly, is_premium) VALUES
('finance', 'tax-optimizer', 49, true),
('finance', 'estate-planner', 79, true),
('finance', 'crypto-tracker', 29, true),
('finance', 'ai-advisor-copilot', 99, true);
```

**User Flow:**
1. User subscribes to Advisor plan → 3 core agents, $79/mo
2. Adds Tax Optimizer → +$49/mo
3. Upgrades to Firm → 5 agents + keeps Tax Optimizer

---

## Checking Agent Access (Backend)

```python
# Python example
async def check_agent_access(user_id: str, platform_id: str, agent_id: str) -> bool:
    """Check if user can use an agent"""
    result = await supabase.rpc(
        'check_agent_access',
        {'_user_id': user_id, '_platform_id': platform_id, '_agent_id': agent_id}
    ).execute()
    return result.data

# Get all available agents for user
async def get_user_agents(user_id: str, platform_id: str) -> list[str]:
    """Get list of agents user has access to"""
    result = await supabase.rpc(
        'get_user_agents',
        {'_user_id': user_id, '_platform_id': platform_id}
    ).execute()
    agents = result.data
    if '*' in agents:
        return get_all_platform_agents(platform_id)  # All-access
    return agents
```

---

## Frontend Integration

```typescript
// Check access before showing agent
const canUseAgent = await checkAgentAccess(userId, platformId, agentId);

if (!canUseAgent) {
  // Show upgrade/purchase modal
  const pricing = await getAgentPricing(platformId, agentId);
  showPurchaseModal(pricing);
}

// Get available agents for sidebar
const availableAgents = await getUserAgents(userId, platformId);
const allAgents = getPlatformAgents(platformId);

// Filter to show only accessible agents (or show locked state)
const agentList = allAgents.map(agent => ({
  ...agent,
  isLocked: !availableAgents.includes(agent.id) && !availableAgents.includes('*')
}));
```

---

## Summary

| Platform | Model | Subscription | Per-Agent | Teams |
|----------|-------|--------------|-----------|-------|
| Squidgy | All-Access | ✅ $0-299/mo | ❌ | ✅ Up to 25 |
| YEAA | Per-Agent | ❌ | ✅ $5-79 | ❌ |
| FanatiQ | Bundle | ✅ Bundles | ✅ Individual | ✅ |
| Trades | Usage-Based | ✅ Credits | ✅ Pay-per-use | ❌ |
| Finance | Hybrid | ✅ $79-499/mo | ✅ Add-ons | ✅ Up to 25 |
