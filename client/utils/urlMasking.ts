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
  return `<div style="margin: 8px 0; display: inline-block;"><a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer"><img src="${trimmedUrl}" alt="${alt}" style="${IMAGE_STYLE}" /></a>${caption ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${caption}</div>` : ''}</div>`;
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
 * Creates an image placeholder for loading state
 */
const createImagePlaceholder = (): string => {
  // Gray placeholder with image icon
  return `<div style="margin: 8px 0; width: 200px; height: 150px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
};

/**
 * Converts $IMG:url$ or $$IMG:url$$ format to HTML images
 * Handles both single and double dollar patterns
 */
const convertDollarImages = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Handle complete $$IMG:url$$ patterns (double dollar)
  result = result.replace(/\$\$IMG:(https?:\/\/[^$\s]+)\$\$/g, (_, url) => {
    return createImageHtml(url.trim(), 'Image preview');
  });
  
  // Handle complete $IMG:url$ patterns (single dollar) 
  result = result.replace(/\$IMG:(https?:\/\/[^$\s]+)\$/g, (_, url) => {
    return createImageHtml(url.trim(), 'Image preview');
  });
  
  // Handle incomplete patterns during streaming - show placeholder
  // $$IMG: or $IMG: followed by partial/no URL
  result = result.replace(/\$\$?IMG:(?:https?:\/\/[^\s]*)?(?!\$)/g, () => {
    return createImagePlaceholder();
  });
  
  // Clean up orphaned $$ or $
  result = result.replace(/^\$\$?$/gm, '');
  
  return result;
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
 * Checks if a URL points to an image based on extension or known image hosting patterns
 */
const isImageUrl = (url: string): boolean => {
  // Check standard image extensions
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) {
    return true;
  }
  // Check for Supabase storage image URLs (media-library bucket or image paths)
  if (url.includes('.supabase.co') && (url.includes('media-library') || url.includes('/image') || url.includes('newsletter'))) {
    return true;
  }
  // Check for GHL/LeadConnector storage URLs
  if (url.includes('storage.googleapis.com') || url.includes('leadconnectorhq.com')) {
    return true;
  }
  // Check for common image CDN patterns
  if (url.includes('/images/') || url.includes('/media/') || url.includes('/uploads/')) {
    return true;
  }
  return false;
};

/**
 * Converts markdown links [text](url) to HTML
 * If the URL is an image, renders it as an image instead of a link
 */
const convertMarkdownLinks = (text: string): string => {
  if (!text) return text;
  
  // Complete links [text](url) - check if URL is an image
  let result = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, linkText, url) => {
    // If URL is an image, render as image with the link text as caption
    if (isImageUrl(url)) {
      return createImageHtml(url, linkText, linkText !== 'View Image' ? linkText : undefined);
    }
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
 * Converts markdown headers (## text) to HTML
 */
const convertMarkdownHeaders = (text: string): string => {
  if (!text) return text;
  let result = text;
  // H2: ## text - compact margins
  result = result.replace(/^##\s+(.+)$/gm, '<h2 style="font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0.25rem 0;">$1</h2>');
  // H3: ### text
  result = result.replace(/^###\s+(.+)$/gm, '<h3 style="font-size: 1rem; font-weight: 600; margin: 0.25rem 0 0.15rem 0;">$1</h3>');
  return result;
};

/**
 * Converts markdown horizontal rules (---) to HTML
 */
const convertMarkdownHorizontalRule = (text: string): string => {
  if (!text) return text;
  return text.replace(/^---+$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0.5rem 0;" />');
};

/**
 * Converts raw URLs to clickable links or image previews
 */
const convertRawUrls = (text: string): string => {
  if (!text) return text;
  
  // Image URLs - show as images (no caption for raw URLs)
  let result = text.replace(
    /(?<!href=")(?<!src=")(?<!\]\()https?:\/\/[^\s<>"'\)]+\.(jpg|jpeg|png|gif|webp)(?:\?[^\s<>"'\)]*)?/gi,
    (url) => createImageHtml(url, 'Image', undefined)
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
 * Handles: $$IMG:url$$, **bold**, ![images](url), [links](url), ## headers, ---, and raw URLs
 */
export const maskStorageUrlsInText = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Process in order: $$IMG:url$$ first, then markdown images, links, headers, hr, bold, raw URLs
  result = convertDollarImages(result);
  result = convertMarkdownImages(result);
  result = convertMarkdownLinks(result);
  result = convertMarkdownHeaders(result);
  result = convertMarkdownHorizontalRule(result);
  result = convertMarkdownBold(result);
  result = convertRawUrls(result);
  
  // Clean up excessive whitespace (2+ newlines become 1)
  result = result.replace(/\n{2,}/g, '\n');
  // Remove whitespace before/after headers
  result = result.replace(/\n+(<h[23])/g, '\n$1');
  result = result.replace(/(<\/h[23]>)\n+/g, '$1\n');
  // Remove whitespace before/after hr
  result = result.replace(/\n+(<hr)/g, '\n$1');
  result = result.replace(/(\/>\s*)\n+/g, '$1\n');
  // Remove whitespace before image divs
  result = result.replace(/\n+(<div style="margin: 8px 0;)/g, '\n$1');
  // Remove whitespace after image divs
  result = result.replace(/(<\/div>)\n+/g, '$1\n');
  
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
