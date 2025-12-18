"""
Config module for platform configuration.
"""

from .platforms import (
    PLATFORMS,
    DEFAULT_PLATFORM_ID,
    PlatformConfig,
    PlatformTheme,
    PlatformFeatures,
    SupabaseConfig,
    get_platform,
    get_platform_by_domain,
    get_all_platform_ids,
    is_agent_available,
    get_available_agents,
)

__all__ = [
    "PLATFORMS",
    "DEFAULT_PLATFORM_ID",
    "PlatformConfig",
    "PlatformTheme",
    "PlatformFeatures",
    "SupabaseConfig",
    "get_platform",
    "get_platform_by_domain",
    "get_all_platform_ids",
    "is_agent_available",
    "get_available_agents",
]
