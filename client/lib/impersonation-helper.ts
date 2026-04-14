/**
 * Helper functions for handling user impersonation
 * These ensure that the correct user ID is used throughout the app
 */

/**
 * Get the effective user ID - returns impersonated user ID if in impersonation mode,
 * otherwise returns the authenticated user's ID
 */
export function getEffectiveUserId(): string | null {
  const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
  const storedUserId = localStorage.getItem('squidgy_user_id');
  
  if (isImpersonating && storedUserId) {
    return storedUserId;
  }
  
  return storedUserId;
}

/**
 * Check if currently in impersonation mode
 */
export function isInImpersonationMode(): boolean {
  return localStorage.getItem('is_impersonating') === 'true';
}

/**
 * Get the original admin user ID (only available during impersonation)
 */
export function getOriginalAdminId(): string | null {
  return localStorage.getItem('original_admin_id');
}
