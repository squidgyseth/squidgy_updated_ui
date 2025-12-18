"""
Platform Middleware

FastAPI middleware and dependencies for platform detection and context.
"""

from typing import Optional
from fastapi import Request, HTTPException, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from functools import lru_cache

from config.platforms import (
    get_platform,
    get_platform_by_domain,
    DEFAULT_PLATFORM_ID,
    PlatformConfig,
    is_agent_available,
)


class PlatformMiddleware(BaseHTTPMiddleware):
    """
    Middleware that detects platform from request and adds to state.
    
    Detection order:
    1. X-Platform-ID header (set by frontend/proxy)
    2. Origin/Referer header domain lookup
    3. Query parameter ?platform=xxx (dev only)
    4. Default platform
    
    Usage:
    ```python
    from fastapi import FastAPI
    from core.platform import PlatformMiddleware
    
    app = FastAPI()
    app.add_middleware(PlatformMiddleware)
    ```
    """
    
    async def dispatch(self, request: Request, call_next):
        platform_id = self._detect_platform(request)
        
        # Validate platform exists
        platform = get_platform(platform_id)
        if not platform:
            platform_id = DEFAULT_PLATFORM_ID
            platform = get_platform(platform_id)
        
        # Add to request state
        request.state.platform_id = platform_id
        request.state.platform = platform
        
        response = await call_next(request)
        
        # Add platform header to response for debugging
        response.headers["X-Platform-ID"] = platform_id
        
        return response
    
    def _detect_platform(self, request: Request) -> str:
        """Detect platform from request"""
        
        # 1. Check explicit header (from frontend)
        header_platform = request.headers.get("X-Platform-ID")
        if header_platform and get_platform(header_platform):
            return header_platform
        
        # 2. Check Origin header
        origin = request.headers.get("Origin")
        if origin:
            # Extract domain from origin (https://example.com -> example.com)
            domain = origin.replace("https://", "").replace("http://", "").split("/")[0]
            platform = get_platform_by_domain(domain)
            if platform:
                return platform.id
        
        # 3. Check Referer header
        referer = request.headers.get("Referer")
        if referer:
            domain = referer.replace("https://", "").replace("http://", "").split("/")[0]
            platform = get_platform_by_domain(domain)
            if platform:
                return platform.id
        
        # 4. Check query param (dev/testing only)
        query_platform = request.query_params.get("platform")
        if query_platform and get_platform(query_platform):
            return query_platform
        
        # 5. Default
        return DEFAULT_PLATFORM_ID


def get_platform_id(request: Request) -> str:
    """
    Dependency to get current platform ID.
    
    Usage:
    ```python
    @app.get("/api/agents")
    async def list_agents(platform_id: str = Depends(get_platform_id)):
        return {"platform": platform_id}
    ```
    """
    return getattr(request.state, "platform_id", DEFAULT_PLATFORM_ID)


def get_current_platform(request: Request) -> PlatformConfig:
    """
    Dependency to get current platform configuration.
    
    Usage:
    ```python
    @app.get("/api/config")
    async def get_config(platform: PlatformConfig = Depends(get_current_platform)):
        return {
            "name": platform.display_name,
            "agents": platform.agents,
        }
    ```
    """
    platform = getattr(request.state, "platform", None)
    if not platform:
        platform = get_platform(DEFAULT_PLATFORM_ID)
    return platform


def require_agent_access(agent_id: str):
    """
    Dependency factory to require access to a specific agent.
    
    Usage:
    ```python
    @app.post("/api/agents/lead-generator/run")
    async def run_lead_generator(
        platform_id: str = Depends(require_agent_access("lead-generator"))
    ):
        # Only runs if platform has access to lead-generator
        return {"status": "running"}
    ```
    """
    def dependency(request: Request) -> str:
        platform_id = getattr(request.state, "platform_id", DEFAULT_PLATFORM_ID)
        
        if not is_agent_available(platform_id, agent_id):
            raise HTTPException(
                status_code=403,
                detail=f"Agent '{agent_id}' is not available on this platform"
            )
        
        return platform_id
    
    return Depends(dependency)


class PlatformContext:
    """
    Context object holding platform information.
    Useful when you need both platform_id and config together.
    
    Usage:
    ```python
    @app.get("/api/info")
    async def get_info(ctx: PlatformContext = Depends(get_platform_context)):
        return {
            "platform_id": ctx.platform_id,
            "display_name": ctx.platform.display_name,
            "features": ctx.platform.features.dict(),
        }
    ```
    """
    def __init__(self, platform_id: str, platform: PlatformConfig):
        self.platform_id = platform_id
        self.platform = platform
    
    def has_feature(self, feature: str) -> bool:
        """Check if platform has a feature enabled"""
        return getattr(self.platform.features, feature, False)
    
    def can_access_agent(self, agent_id: str) -> bool:
        """Check if platform can access an agent"""
        return is_agent_available(self.platform_id, agent_id)


def get_platform_context(request: Request) -> PlatformContext:
    """Dependency to get platform context object"""
    platform_id = getattr(request.state, "platform_id", DEFAULT_PLATFORM_ID)
    platform = getattr(request.state, "platform", None) or get_platform(platform_id)
    
    return PlatformContext(platform_id, platform)
