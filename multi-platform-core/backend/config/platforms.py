"""
Platform Configuration

Central registry for all platforms. Add or remove platforms here.
This is the single source of truth for platform definitions.
"""

import os
from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel
from functools import lru_cache


class PlatformTheme(BaseModel):
    """Visual theme configuration for a platform"""
    primary_color: str
    secondary_color: str
    logo: str
    favicon: str


class PlatformFeatures(BaseModel):
    """Feature flags for a platform"""
    workspaces: bool = True          # Team/org support
    token_billing: bool = False      # Token-based usage
    per_agent_billing: bool = False  # Per-agent pricing
    per_user_billing: bool = False   # Per-seat pricing


class SupabaseConfig(BaseModel):
    """Supabase connection configuration"""
    url: str
    anon_key: str
    service_key: str


class PlatformConfig(BaseModel):
    """Complete platform configuration"""
    id: str
    name: str
    display_name: str
    domains: List[str]
    supabase: SupabaseConfig
    theme: PlatformTheme
    agents: Union[Literal["all"], List[str]]
    features: PlatformFeatures


def _get_env(key: str, default: str = "") -> str:
    """Get environment variable with default"""
    return os.getenv(key, default)


def _build_platform_configs() -> Dict[str, PlatformConfig]:
    """
    Build platform configurations from environment variables.
    
    Environment variables pattern:
    - {PLATFORM_ID}_SUPABASE_URL
    - {PLATFORM_ID}_SUPABASE_ANON_KEY
    - {PLATFORM_ID}_SUPABASE_SERVICE_KEY
    """
    
    platforms = {
        "squidgy": PlatformConfig(
            id="squidgy",
            name="squidgy",
            display_name="Squidgy",
            domains=["squidgy.com", "www.squidgy.com"],
            supabase=SupabaseConfig(
                url=_get_env("SQUIDGY_SUPABASE_URL"),
                anon_key=_get_env("SQUIDGY_SUPABASE_ANON_KEY"),
                service_key=_get_env("SQUIDGY_SUPABASE_SERVICE_KEY"),
            ),
            theme=PlatformTheme(
                primary_color="#6366f1",
                secondary_color="#4f46e5",
                logo="/logos/squidgy.svg",
                favicon="/favicons/squidgy.ico",
            ),
            agents="all",
            features=PlatformFeatures(
                workspaces=True,
                token_billing=False,
                per_agent_billing=False,
                per_user_billing=False,
            ),
        ),
        
        "yeaa": PlatformConfig(
            id="yeaa",
            name="yeaa",
            display_name="YEAA",
            domains=["yeaa.com", "www.yeaa.com"],
            supabase=SupabaseConfig(
                url=_get_env("YEAA_SUPABASE_URL"),
                anon_key=_get_env("YEAA_SUPABASE_ANON_KEY"),
                service_key=_get_env("YEAA_SUPABASE_SERVICE_KEY"),
            ),
            theme=PlatformTheme(
                primary_color="#f59e0b",
                secondary_color="#d97706",
                logo="/logos/yeaa.svg",
                favicon="/favicons/yeaa.ico",
            ),
            agents=[
                "content-creator",
                "visual-designer",
                "graham",
                "engagement-manager",
                "analytics-expert",
                "strategy-advisor",
                "lead-generator",
                "outreach-agent",
                "landing-page-builder",
                "funnel-tracker",
                "competitor-spy",
                "launch-manager",
            ],
            features=PlatformFeatures(
                workspaces=True,
                token_billing=False,
                per_agent_billing=True,
                per_user_billing=False,
            ),
        ),
        
        "fanatiq": PlatformConfig(
            id="fanatiq",
            name="fanatiq",
            display_name="FanatiQ",
            domains=["fanatiq.com", "www.fanatiq.com"],
            supabase=SupabaseConfig(
                url=_get_env("FANATIQ_SUPABASE_URL"),
                anon_key=_get_env("FANATIQ_SUPABASE_ANON_KEY"),
                service_key=_get_env("FANATIQ_SUPABASE_SERVICE_KEY"),
            ),
            theme=PlatformTheme(
                primary_color="#ef4444",
                secondary_color="#dc2626",
                logo="/logos/fanatiq.svg",
                favicon="/favicons/fanatiq.ico",
            ),
            agents=[
                "content-creator",
                "visual-designer",
                "graham",
                "engagement-manager",
                "analytics-expert",
                "strategy-advisor",
                "match-day-agent",
                "fan-pulse",
                "merch-promoter",
                "ticket-agent",
                "player-spotlight",
                "chant-culture-keeper",
                "live-commentator",
            ],
            features=PlatformFeatures(
                workspaces=True,
                token_billing=True,
                per_agent_billing=False,
                per_user_billing=True,
            ),
        ),
        
        "trades": PlatformConfig(
            id="trades",
            name="trades",
            display_name="Trades",
            domains=["trades.com", "www.trades.com"],
            supabase=SupabaseConfig(
                url=_get_env("TRADES_SUPABASE_URL"),
                anon_key=_get_env("TRADES_SUPABASE_ANON_KEY"),
                service_key=_get_env("TRADES_SUPABASE_SERVICE_KEY"),
            ),
            theme=PlatformTheme(
                primary_color="#f97316",
                secondary_color="#ea580c",
                logo="/logos/trades.svg",
                favicon="/favicons/trades.ico",
            ),
            agents=[
                "content-creator",
                "visual-designer",
                "graham",
                "engagement-manager",
                "analytics-expert",
                "strategy-advisor",
                "quote-builder",
                "job-scheduler",
                "review-chaser",
                "local-seo-agent",
                "before-after-agent",
                "invoice-agent",
                "emergency-response",
            ],
            features=PlatformFeatures(
                workspaces=True,
                token_billing=False,
                per_agent_billing=True,
                per_user_billing=False,
            ),
        ),
        
        "finance": PlatformConfig(
            id="finance",
            name="finance",
            display_name="Finance",
            domains=["finance.com", "www.finance.com"],
            supabase=SupabaseConfig(
                url=_get_env("FINANCE_SUPABASE_URL"),
                anon_key=_get_env("FINANCE_SUPABASE_ANON_KEY"),
                service_key=_get_env("FINANCE_SUPABASE_SERVICE_KEY"),
            ),
            theme=PlatformTheme(
                primary_color="#0ea5e9",
                secondary_color="#0284c7",
                logo="/logos/finance.svg",
                favicon="/favicons/finance.ico",
            ),
            agents=[
                "content-creator",
                "visual-designer",
                "graham",
                "engagement-manager",
                "analytics-expert",
                "strategy-advisor",
                "compliance-checker",
                "market-update-agent",
                "client-onboarder",
                "report-generator",
                "regulatory-radar",
                "jargon-translator",
                "renewal-agent",
            ],
            features=PlatformFeatures(
                workspaces=True,
                token_billing=False,
                per_agent_billing=True,
                per_user_billing=False,
            ),
        ),
    }
    
    return platforms


# Build and cache platform configs
PLATFORMS: Dict[str, PlatformConfig] = _build_platform_configs()

# Default platform for fallback
DEFAULT_PLATFORM_ID = "squidgy"


@lru_cache()
def get_platform(platform_id: str) -> Optional[PlatformConfig]:
    """Get platform configuration by ID"""
    return PLATFORMS.get(platform_id)


def get_platform_by_domain(domain: str) -> Optional[PlatformConfig]:
    """Get platform configuration by domain"""
    # Normalize domain (lowercase, remove port)
    normalized = domain.lower().split(":")[0]
    
    for platform in PLATFORMS.values():
        if normalized in platform.domains:
            return platform
    
    return None


def get_all_platform_ids() -> List[str]:
    """Get list of all platform IDs"""
    return list(PLATFORMS.keys())


def is_agent_available(platform_id: str, agent_id: str) -> bool:
    """Check if agent is available on platform"""
    platform = get_platform(platform_id)
    if not platform:
        return False
    
    if platform.agents == "all":
        return True
    
    return agent_id in platform.agents


def get_available_agents(platform_id: str) -> List[str]:
    """Get list of available agents for platform"""
    platform = get_platform(platform_id)
    if not platform:
        return []
    
    if platform.agents == "all":
        # Return all possible agents
        all_agents = set()
        for p in PLATFORMS.values():
            if isinstance(p.agents, list):
                all_agents.update(p.agents)
        return list(all_agents)
    
    return platform.agents
