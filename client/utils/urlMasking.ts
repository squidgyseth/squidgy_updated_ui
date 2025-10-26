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

  // Replace Supabase URLs with clickable generic links
  return text.replace(
    /https?:\/\/[^\s]*\.supabase\.co[^\s]*/g,
    '<a href="$&" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Link</a>'
  );
};

/**
 * Replaces any storage URLs in text with appropriate clickable link text
 */
export const maskStorageUrlsInText = (text: string): string => {
  if (!text) return text;

  let maskedText = text;
  
  // Replace different types of storage URLs with appropriate clickable labels
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/avatars[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Profile Image</a>'
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/screenshots[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Screenshot</a>'
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/images[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Image</a>'
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/documents[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download Document</a>'
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download File</a>'
  );
  
  // General Supabase URL masking with clickable links
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co[^\s]*)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Link</a>'
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

/**
 * Alternative function that uses proxy URLs in the links for maximum security
 * This version hides the original URLs completely by routing through our backend
 */
export const maskStorageUrlsWithProxy = (text: string): string => {
  if (!text) return text;

  let maskedText = text;
  
  // Replace different types of storage URLs with proxy links
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/(avatars[^\s]*))/g,
    (match, fullUrl, filePath) => {
      const proxyUrl = createProxyUrl(fullUrl, 'avatar');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Profile Image</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/(screenshots[^\s]*))/g,
    (match, fullUrl, filePath) => {
      const proxyUrl = createProxyUrl(fullUrl, 'image');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Screenshot</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/(images[^\s]*))/g,
    (match, fullUrl, filePath) => {
      const proxyUrl = createProxyUrl(fullUrl, 'image');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Image</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/(documents[^\s]*))/g,
    (match, fullUrl, filePath) => {
      const proxyUrl = createProxyUrl(fullUrl, 'file');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download Document</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co\/storage\/v1\/object\/public\/([^\s]*))/g,
    (match, fullUrl, filePath) => {
      const proxyUrl = createProxyUrl(fullUrl, 'file');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download File</a>`;
    }
  );
  
  // General Supabase URL masking with proxy links
  maskedText = maskedText.replace(
    /(https?:\/\/[^\s]*\.supabase\.co[^\s]*)/g,
    (match, fullUrl) => {
      const proxyUrl = createProxyUrl(fullUrl, 'file');
      return `<a href="${proxyUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Link</a>`;
    }
  );

  return maskedText;
};