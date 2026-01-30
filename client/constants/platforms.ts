/**
 * Platform Constants
 * 
 * This file defines standardized platform names and mappings to eliminate confusion
 * across the application. All components should use these constants.
 */

// Standard platform display names used throughout the UI
export const PLATFORM_NAMES = {
  LINKEDIN: 'LinkedIn',
  INSTAGRAM_FACEBOOK: 'Instagram/Facebook', 
  TIKTOK_REELS: 'TikTok/Reels',
  GENERAL: 'General',
  ADDITIONAL_ASSETS: 'Additional Assets'
} as const;

// Database platform names (lowercase, as stored in content_repurposer_images table)
export const DATABASE_PLATFORM_NAMES = {
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  GENERAL: 'general'
} as const;

// Legacy platform names from webhook service and old data formats
export const LEGACY_PLATFORM_NAMES = {
  TIKTOK_SLASH_REELS: 'TikTok/Reels',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  TIKTOKREELS: 'TikTokReels',
  TIKTOK_LOWERCASE_SLASH: 'tiktok/reels',
  TIKTOKREELS_LOWERCASE: 'tiktokreels'
} as const;

/**
 * Maps any platform name variation to the standard display name
 */
export function mapToStandardPlatformName(platformName: string): string {
  const normalized = platformName.toLowerCase().trim();
  
  switch (normalized) {
    case DATABASE_PLATFORM_NAMES.LINKEDIN:
    case 'linkedin':
      return PLATFORM_NAMES.LINKEDIN;
      
    case DATABASE_PLATFORM_NAMES.INSTAGRAM:
    case 'instagram':
    case 'instagram/facebook':
    case 'instagramfacebook':
      return PLATFORM_NAMES.INSTAGRAM_FACEBOOK;
      
    case DATABASE_PLATFORM_NAMES.TIKTOK:
    case 'tiktok':
    case 'tiktok/reels':
    case 'tiktokreels':
    case 'tiktok_reels':
      return PLATFORM_NAMES.TIKTOK_REELS;
      
    case DATABASE_PLATFORM_NAMES.GENERAL:
    case 'general':
      return PLATFORM_NAMES.GENERAL;
      
    case 'additional assets':
    case 'additionalassets':
    case 'additional_assets':
      return PLATFORM_NAMES.ADDITIONAL_ASSETS;
      
    default:
      // If it contains 'tiktok' anywhere, map to TikTok/Reels
      if (normalized.includes('tiktok')) {
        return PLATFORM_NAMES.TIKTOK_REELS;
      }
      
      // If it contains 'instagram', map to Instagram/Facebook
      if (normalized.includes('instagram')) {
        return PLATFORM_NAMES.INSTAGRAM_FACEBOOK;
      }
      
      // If it contains 'linkedin', map to LinkedIn
      if (normalized.includes('linkedin')) {
        return PLATFORM_NAMES.LINKEDIN;
      }
      
      // Fallback: capitalize first letter
      return platformName.charAt(0).toUpperCase() + platformName.slice(1);
  }
}

/**
 * Platform colors for UI elements
 */
export const PLATFORM_COLORS = {
  [PLATFORM_NAMES.LINKEDIN]: 'bg-blue-600',
  [PLATFORM_NAMES.INSTAGRAM_FACEBOOK]: 'bg-gradient-to-r from-purple-500 to-pink-500',
  [PLATFORM_NAMES.TIKTOK_REELS]: 'bg-black',
  [PLATFORM_NAMES.GENERAL]: 'bg-squidgy-gradient',
  [PLATFORM_NAMES.ADDITIONAL_ASSETS]: 'bg-orange-500'
} as const;

/**
 * Platform active tab colors (border and text)
 */
export const PLATFORM_ACTIVE_COLORS = {
  [PLATFORM_NAMES.LINKEDIN]: {
    border: 'border-blue-500',
    text: 'text-blue-600'
  },
  [PLATFORM_NAMES.INSTAGRAM_FACEBOOK]: {
    border: 'border-pink-500', 
    text: 'text-pink-600'
  },
  [PLATFORM_NAMES.TIKTOK_REELS]: {
    border: 'border-black',
    text: 'text-black'
  },
  [PLATFORM_NAMES.GENERAL]: {
    border: 'border-squidgy-purple',
    text: 'text-squidgy-purple'
  },
  [PLATFORM_NAMES.ADDITIONAL_ASSETS]: {
    border: 'border-orange-500',
    text: 'text-orange-600'
  }
} as const;

/**
 * Gets platform color class
 */
export function getPlatformColor(platform: string): string {
  const standardName = mapToStandardPlatformName(platform);
  return PLATFORM_COLORS[standardName as keyof typeof PLATFORM_COLORS] || 'bg-gray-600';
}

/**
 * Gets platform active state colors
 */
export function getPlatformActiveColors(platform: string): { border: string; text: string } {
  const standardName = mapToStandardPlatformName(platform);
  return PLATFORM_ACTIVE_COLORS[standardName as keyof typeof PLATFORM_ACTIVE_COLORS] || {
    border: 'border-gray-500',
    text: 'text-gray-600'
  };
}