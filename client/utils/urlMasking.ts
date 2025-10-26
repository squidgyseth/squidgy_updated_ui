/**
 * Utility functions to mask/hide Supabase URLs for security and branding purposes
 */

/**
 * Checks if a URL is a Supabase storage URL
 */
export const isSupabaseUrl = (url: string): boolean => {
  return url.includes('.supabase.co') || url.includes('supabase');
};

/**
 * Creates a proxy URL for Supabase storage that hides the original URL
 * This would typically go through your backend to serve the image
 */
export const createProxyUrl = (originalUrl: string, resourceType: 'avatar' | 'image' | 'file' = 'image'): string => {
  if (!originalUrl || !isSupabaseUrl(originalUrl)) {
    return originalUrl;
  }

  // Extract the file path from the Supabase URL
  const urlParts = originalUrl.split('/storage/v1/object/public/');
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    // Create a masked URL that goes through your backend
    return `/api/storage/${resourceType}/${encodeURIComponent(filePath)}`;
  }

  // Fallback - return a generic endpoint
  return `/api/storage/${resourceType}/${encodeURIComponent(btoa(originalUrl))}`;
};

/**
 * Replaces Supabase URLs in text with generic link text
 */
export const maskUrlsInText = (text: string): string => {
  if (!text) return text;

  // Replace Supabase URLs with generic link text
  return text.replace(
    /https?:\/\/[^\s]*\.supabase\.co[^\s]*/g,
    '[Link]'
  );
};

/**
 * Replaces any storage URLs in text with appropriate link text
 */
export const maskStorageUrlsInText = (text: string): string => {
  if (!text) return text;

  let maskedText = text;
  
  // Replace different types of storage URLs with appropriate labels
  maskedText = maskedText.replace(
    /https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/avatars[^\s]*/g,
    '[Profile Image]'
  );
  
  maskedText = maskedText.replace(
    /https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/images[^\s]*/g,
    '[Image]'
  );
  
  maskedText = maskedText.replace(
    /https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/documents[^\s]*/g,
    '[Document]'
  );
  
  maskedText = maskedText.replace(
    /https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/[^\s]*/g,
    '[File]'
  );
  
  // General Supabase URL masking
  maskedText = maskedText.replace(
    /https?:\/\/[^\s]*\.supabase\.co[^\s]*/g,
    '[Link]'
  );

  return maskedText;
};

/**
 * Creates a download link that masks the original URL
 */
export const createMaskedDownloadLink = (originalUrl: string, filename?: string): { url: string; displayName: string } => {
  if (!originalUrl || !isSupabaseUrl(originalUrl)) {
    return { url: originalUrl, displayName: filename || 'Download' };
  }

  const proxyUrl = createProxyUrl(originalUrl, 'file');
  const displayName = filename || 'Download File';
  
  return { url: proxyUrl, displayName };
};