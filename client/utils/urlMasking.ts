/**
 * URL masking and markdown rendering utilities
 */

// Shared styles
const LINK_STYLE = 'color: #7c3aed; text-decoration: underline;';
const IMAGE_STYLE = `max-width: 400px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;`;

/**
 * Creates an HTML image element with consistent styling
 */
const createImageHtml = (url: string, alt: string, caption?: string): string => {
  const trimmedUrl = url.trim();
  return `<div style="margin: 8px 0;">
    <a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">
      <img src="${trimmedUrl}" alt="${alt}" style="${IMAGE_STYLE}" />
    </a>
    ${caption ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${caption}</div>` : ''}
  </div>`;
};

/**
 * Creates an HTML link element with consistent styling
 */
const createLinkHtml = (url: string, text: string): string => {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="${LINK_STYLE}">${text}</a>`;
};

/**
 * Checks if a URL is a Supabase storage URL
 */
export const isSupabaseUrl = (url: string): boolean => {
  return url.includes('.supabase.co');
};

/**
 * Creates a proxy URL for Supabase storage
 */
export const createProxyUrl = (originalUrl: string, resourceType: 'avatar' | 'image' | 'file' = 'image'): string => {
  if (!originalUrl || originalUrl.startsWith('/api/storage/') || !isSupabaseUrl(originalUrl)) {
    return originalUrl;
  }

  const urlParts = originalUrl.split('/storage/v1/object/public/');
  if (urlParts.length > 1) {
    const [pathOnly, queryString] = urlParts[1].split('?');
    const encodedPath = pathOnly.includes('%') ? pathOnly : encodeURIComponent(pathOnly);
    return `/api/storage/${resourceType}/${encodedPath}${queryString ? '?' + queryString : ''}`;
  }

  return `/api/storage/${resourceType}/${encodeURIComponent(btoa(originalUrl))}`;
};

/**
 * Converts markdown images ![alt](url) to HTML
 */
const convertMarkdownImages = (text: string): string => {
  if (!text) return text;
  
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return createImageHtml(url, alt || 'Image', alt || undefined);
  });
};

/**
 * Converts markdown links [text](url) to HTML
 */
const convertMarkdownLinks = (text: string): string => {
  if (!text) return text;
  
  // Complete links [text](url)
  let result = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, linkText, url) => {
    return createLinkHtml(url, linkText);
  });
  
  // Incomplete links [text]() - just return the text
  result = result.replace(/\[([^\]]+)\]\(\s*\)/g, '$1');
  
  return result;
};

/**
 * Converts markdown bold **text** to HTML
 */
const convertMarkdownBold = (text: string): string => {
  if (!text) return text;
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};

/**
 * Converts raw URLs to clickable links or image previews
 */
const convertRawUrls = (text: string): string => {
  if (!text) return text;
  
  // Image URLs - show as images
  let result = text.replace(
    /(?<!href=")(?<!src=")(?<!\]\()https?:\/\/[^\s<>"'\)]+\.(jpg|jpeg|png|gif|webp)(?:\?[^\s<>"'\)]*)?/gi,
    (url) => createImageHtml(url, 'Image')
  );
  
  // Other URLs - show as links
  result = result.replace(
    /(?<!href=")(?<!src=")(?<!\]\()(?<!<a[^>]*>)(https?:\/\/[^\s<>"'\)]+)(?![^<]*<\/a>)/gi,
    (url) => createLinkHtml(url, 'View Link')
  );
  
  return result;
};

/**
 * Main function: processes text with markdown and URLs
 * Handles: **bold**, ![images](url), [links](url), and raw URLs
 */
export const maskStorageUrlsInText = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Process in order: images first, then links, then bold, then raw URLs
  result = convertMarkdownImages(result);
  result = convertMarkdownLinks(result);
  result = convertMarkdownBold(result);
  result = convertRawUrls(result);
  
  return result;
};

/**
 * Creates a download link that masks the original URL
 */
export const createMaskedDownloadLink = (originalUrl: string, filename?: string): { url: string; displayName: string } => {
  if (!originalUrl || !isSupabaseUrl(originalUrl)) {
    return { url: originalUrl, displayName: filename || 'Download' };
  }
  return { url: createProxyUrl(originalUrl, 'file'), displayName: filename || 'Download File' };
};