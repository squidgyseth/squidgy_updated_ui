/**
 * Environment Configuration Module
 * Dynamically loads environment-specific credentials based on current environment
 * Mirrors the Backend env_config.py pattern
 */

export type Environment = 'production' | 'staging' | 'dev';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  schema: string;
}

export interface BackendConfig {
  url: string;
}

export interface FrontendConfig {
  url: string;
}

export interface AutomationConfig {
  url: string;
}

export interface NeonConfig {
  apiUrl: string;
  apiKey: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  schema: string;
}

export interface PostHogConfig {
  key: string;
  host: string;
  embedUrl: string;
}

/**
 * Detect environment based on current URL
 *
 * Returns: 'production', 'staging', or 'dev'
 */
export function getEnvironment(): Environment {
  // Check explicit environment variable first
  const envVar = import.meta.env.VITE_APP_ENV?.toLowerCase();
  if (envVar === 'production' || envVar === 'prod') {
    return 'production';
  } else if (envVar === 'staging' || envVar === 'stage') {
    return 'staging';
  } else if (envVar === 'development' || envVar === 'dev') {
    return 'dev';
  }

  // Fallback to URL detection (for Vercel/hosted deployments)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname === 'app.squidgy.ai') {
      return 'production';
    } else if (hostname === 'staging.squidgy.ai') {
      return 'staging';
    } else if (hostname === 'dev.squidgy.ai') {
      return 'dev';
    }
  }

  // Default to dev for local development (localhost)
  return 'dev';
}

/**
 * Get Supabase configuration based on current environment
 *
 * Returns: Object with url, anonKey, schema
 */
export function getSupabaseConfig(): SupabaseConfig {
  const env = getEnvironment();

  if (env === 'production') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public'
    };
  } else if (env === 'staging') {
    return {
      url: import.meta.env.VITE_STAGING_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_STAGING_SUPABASE_ANON_KEY || '',
      schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public'
    };
  } else { // dev
    return {
      url: import.meta.env.VITE_DEV_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || '',
      schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public'
    };
  }
}

/**
 * Get Backend API URL based on current environment
 *
 * Returns: Backend API URL string
 */
export function getBackendUrl(): string {
  const env = getEnvironment();

  if (env === 'production') {
    return import.meta.env.VITE_BACKEND_URL || 'https://prod-squidgy-backend.onrender.com';
  } else if (env === 'staging') {
    return import.meta.env.VITE_STAGING_BACKEND_URL || 'https://staging-squidgy-backend.onrender.com';
  } else { // dev
    return import.meta.env.VITE_DEV_BACKEND_URL || 'https://dev-squidgy-backend.onrender.com';
  }
}

/**
 * Get Frontend URL based on current environment (for redirects, etc.)
 *
 * Returns: Frontend URL string
 */
export function getFrontendUrl(): string {
  const env = getEnvironment();

  if (env === 'production') {
    return import.meta.env.VITE_FRONTEND_URL || 'https://app.squidgy.ai';
  } else if (env === 'staging') {
    return import.meta.env.VITE_FRONTEND_STAGING_URL || 'https://staging.squidgy.ai';
  } else { // dev
    return import.meta.env.VITE_DEV_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || 'https://dev.squidgy.ai';
  }
}

/**
 * Get Automation Service URL based on current environment
 *
 * Returns: Automation service URL string
 */
export function getAutomationServiceUrl(): string {
  const env = getEnvironment();

  if (env === 'production') {
    return import.meta.env.AUTOMATION_PROD_SERVICE_URL || import.meta.env.AUTOMATION_USER1_SERVICE_URL || 'https://prod-squidgy-browser-automation.onrender.com';
  } else if (env === 'staging') {
    return import.meta.env.AUTOMATION_STAGING_SERVICE_URL || 'https://staging-squidgy-browser-automation.onrender.com';
  } else { // dev
    return import.meta.env.AUTOMATION_DEV_SERVICE_URL || 'https://staging-squidgy-browser-automation.onrender.com';
  }
}

/**
 * Get N8N webhook URL
 *
 * Returns: N8N webhook URL string
 */
export function getN8nWebhookUrl(): string {
  return import.meta.env.VITE_N8N_WEBHOOK_URL || '';
}

/**
 * Get PostHog analytics configuration
 *
 * Returns: Object with PostHog key, host, and embed URL
 */
export function getPostHogConfig(): PostHogConfig {
  return {
    key: import.meta.env.VITE_POSTHOG_KEY || '',
    host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    embedUrl: import.meta.env.VITE_POSTHOG_EMBED_URL || ''
  };
}

/**
 * Get Microsoft Teams client ID for OAuth
 *
 * Returns: Teams client ID string
 */
export function getTeamsClientId(): string {
  return import.meta.env.VITE_TEAMS_CLIENT_ID || '';
}

/**
 * Get Google OAuth client ID
 *
 * Returns: Google client ID string
 */
export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

/**
 * Get Neon database configuration based on current environment
 *
 * Returns: Object with Neon database config
 */
export function getNeonConfig(): NeonConfig {
  const env = getEnvironment();

  // Base configuration (same for all environments)
  const config: NeonConfig = {
    apiUrl: import.meta.env.NEON_API_URL || '',
    apiKey: import.meta.env.NEON_API_KEY || '',
    host: import.meta.env.NEON_DB_HOST || '',
    port: import.meta.env.NEON_DB_PORT || '5432',
    user: import.meta.env.NEON_DB_USER || '',
    password: import.meta.env.NEON_DB_PASSWORD || '',
    database: import.meta.env.NEON_DB_NAME || '',
    schema: 'public' // default
  };

  // Environment-specific schema
  if (env === 'production') {
    config.schema = import.meta.env.NEON_PROD_SCHEMA || 'public'; // Production uses default schema (configurable)
  } else if (env === 'staging') {
    config.schema = import.meta.env.NEON_STAGING_SCHEMA || 'staging_public';
  } else { // dev
    config.schema = import.meta.env.NEON_DEV_SCHEMA || 'dev_public';
  }

  return config;
}

/**
 * Print current environment configuration (for debugging)
 * Use in browser console: console.log(printEnvironmentInfo())
 */
export function printEnvironmentInfo(): string {
  const env = getEnvironment();
  const supabaseConfig = getSupabaseConfig();
  const neonConfig = getNeonConfig();
  const backendUrl = getBackendUrl();
  const frontendUrl = getFrontendUrl();
  const automationUrl = getAutomationServiceUrl();
  const n8nWebhookUrl = getN8nWebhookUrl();
  const postHogConfig = getPostHogConfig();
  const teamsClientId = getTeamsClientId();
  const googleClientId = getGoogleClientId();

  return `
================================================================================
🌍 ENVIRONMENT: ${env.toUpperCase()}
================================================================================

📦 SUPABASE:
   URL: ${supabaseConfig.url}
   Schema: ${supabaseConfig.schema}

🗄️  NEON DATABASE:
   Host: ${neonConfig.host}
   Database: ${neonConfig.database}
   Schema: ${neonConfig.schema}

🔗 URLS:
   Frontend: ${frontendUrl}
   Backend: ${backendUrl}
   Automation: ${automationUrl}
   N8N Webhook: ${n8nWebhookUrl}

📊 ANALYTICS:
   PostHog Key: ${postHogConfig.key ? '✓ Configured' : '✗ Not configured'}
   PostHog Host: ${postHogConfig.host}
   PostHog Embed URL: ${postHogConfig.embedUrl ? '✓ Configured' : '✗ Not configured'}

🔐 OAUTH:
   Teams Client ID: ${teamsClientId ? '✓ Configured' : '✗ Not configured'}
   Google Client ID: ${googleClientId ? '✓ Configured' : '✗ Not configured'}

🔑 Using ${env.toUpperCase()} credentials
================================================================================
  `;
}

// Export environment for direct access if needed
export const currentEnvironment = getEnvironment();
