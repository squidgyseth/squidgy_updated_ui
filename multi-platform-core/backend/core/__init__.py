"""
Core module for platform and database utilities.
"""

from .platform import (
    PlatformMiddleware,
    PlatformContext,
    get_platform_id,
    get_current_platform,
    get_platform_context,
    require_agent_access,
)

from .database import (
    SupabaseClientFactory,
    get_supabase_factory,
    get_supabase,
    get_supabase_admin,
    get_database_context,
    DatabaseContext,
    get_client,
    get_admin,
)

__all__ = [
    # Platform
    "PlatformMiddleware",
    "PlatformContext",
    "get_platform_id",
    "get_current_platform",
    "get_platform_context",
    "require_agent_access",
    # Database
    "SupabaseClientFactory",
    "get_supabase_factory",
    "get_supabase",
    "get_supabase_admin",
    "get_database_context",
    "DatabaseContext",
    "get_client",
    "get_admin",
]
