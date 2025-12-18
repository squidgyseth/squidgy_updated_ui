"""
Platform-Aware Database Client

Provides Supabase clients that connect to the correct database
based on platform context.
"""

from typing import Optional, Dict, Any
from functools import lru_cache
from supabase import create_client, Client
from fastapi import Depends, Request, HTTPException

from config.platforms import (
    get_platform,
    DEFAULT_PLATFORM_ID,
    PlatformConfig,
)
from core.platform import get_platform_id, get_current_platform


class SupabaseClientFactory:
    """
    Factory for creating platform-specific Supabase clients.
    
    Caches clients per platform to avoid recreating connections.
    
    Usage:
    ```python
    factory = SupabaseClientFactory()
    
    # Get client for specific platform
    client = factory.get_client("yeaa")
    
    # Get admin client (with service key)
    admin = factory.get_admin_client("yeaa")
    ```
    """
    
    def __init__(self):
        self._clients: Dict[str, Client] = {}
        self._admin_clients: Dict[str, Client] = {}
    
    def get_client(self, platform_id: str) -> Client:
        """
        Get Supabase client for platform using anon key.
        
        Use this for user-context operations where RLS applies.
        """
        if platform_id not in self._clients:
            platform = get_platform(platform_id)
            if not platform:
                raise ValueError(f"Unknown platform: {platform_id}")
            
            if not platform.supabase.url or not platform.supabase.anon_key:
                raise ValueError(
                    f"Supabase not configured for platform '{platform_id}'. "
                    f"Set {platform_id.upper()}_SUPABASE_URL and "
                    f"{platform_id.upper()}_SUPABASE_ANON_KEY environment variables."
                )
            
            self._clients[platform_id] = create_client(
                platform.supabase.url,
                platform.supabase.anon_key
            )
        
        return self._clients[platform_id]
    
    def get_admin_client(self, platform_id: str) -> Client:
        """
        Get Supabase client for platform using service key.
        
        Use this for admin operations that bypass RLS.
        WARNING: Be careful with admin clients - they have full access.
        """
        if platform_id not in self._admin_clients:
            platform = get_platform(platform_id)
            if not platform:
                raise ValueError(f"Unknown platform: {platform_id}")
            
            if not platform.supabase.url or not platform.supabase.service_key:
                raise ValueError(
                    f"Supabase admin not configured for platform '{platform_id}'. "
                    f"Set {platform_id.upper()}_SUPABASE_URL and "
                    f"{platform_id.upper()}_SUPABASE_SERVICE_KEY environment variables."
                )
            
            self._admin_clients[platform_id] = create_client(
                platform.supabase.url,
                platform.supabase.service_key
            )
        
        return self._admin_clients[platform_id]
    
    def clear_cache(self, platform_id: Optional[str] = None):
        """Clear cached clients. Useful for testing."""
        if platform_id:
            self._clients.pop(platform_id, None)
            self._admin_clients.pop(platform_id, None)
        else:
            self._clients.clear()
            self._admin_clients.clear()


# Global factory instance
_factory = SupabaseClientFactory()


def get_supabase_factory() -> SupabaseClientFactory:
    """Get the global Supabase client factory"""
    return _factory


# FastAPI Dependencies

def get_supabase(
    platform_id: str = Depends(get_platform_id)
) -> Client:
    """
    Dependency to get Supabase client for current platform.
    
    Usage:
    ```python
    @app.get("/api/profiles")
    async def list_profiles(supabase: Client = Depends(get_supabase)):
        result = supabase.table("profiles").select("*").execute()
        return result.data
    ```
    """
    return _factory.get_client(platform_id)


def get_supabase_admin(
    platform_id: str = Depends(get_platform_id)
) -> Client:
    """
    Dependency to get admin Supabase client for current platform.
    
    Usage:
    ```python
    @app.delete("/api/admin/users/{user_id}")
    async def delete_user(
        user_id: str,
        supabase: Client = Depends(get_supabase_admin)
    ):
        # Bypasses RLS - use with caution
        result = supabase.table("profiles").delete().eq("id", user_id).execute()
        return {"deleted": True}
    ```
    """
    return _factory.get_admin_client(platform_id)


class DatabaseContext:
    """
    Context object with both platform info and database client.
    
    Usage:
    ```python
    @app.post("/api/agents/{agent_id}/run")
    async def run_agent(
        agent_id: str,
        ctx: DatabaseContext = Depends(get_database_context)
    ):
        # Check agent access
        if not ctx.can_access_agent(agent_id):
            raise HTTPException(403, "Agent not available")
        
        # Create run record
        result = ctx.supabase.table("agent_runs").insert({
            "agent_id": agent_id,
            "status": "pending",
        }).execute()
        
        return {"run_id": result.data[0]["id"]}
    ```
    """
    
    def __init__(
        self,
        platform_id: str,
        platform: PlatformConfig,
        supabase: Client,
        supabase_admin: Client
    ):
        self.platform_id = platform_id
        self.platform = platform
        self.supabase = supabase
        self.supabase_admin = supabase_admin
    
    def can_access_agent(self, agent_id: str) -> bool:
        """Check if current platform can access an agent"""
        if self.platform.agents == "all":
            return True
        return agent_id in self.platform.agents
    
    def has_feature(self, feature: str) -> bool:
        """Check if platform has a feature enabled"""
        return getattr(self.platform.features, feature, False)


def get_database_context(
    request: Request,
    platform_id: str = Depends(get_platform_id),
    platform: PlatformConfig = Depends(get_current_platform),
) -> DatabaseContext:
    """Dependency to get full database context"""
    return DatabaseContext(
        platform_id=platform_id,
        platform=platform,
        supabase=_factory.get_client(platform_id),
        supabase_admin=_factory.get_admin_client(platform_id),
    )


# Convenience functions for direct use (non-dependency)

def get_client(platform_id: str) -> Client:
    """Get Supabase client for platform (direct call, not dependency)"""
    return _factory.get_client(platform_id)


def get_admin(platform_id: str) -> Client:
    """Get admin Supabase client for platform (direct call, not dependency)"""
    return _factory.get_admin_client(platform_id)
