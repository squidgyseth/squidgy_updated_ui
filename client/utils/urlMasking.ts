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
  if (!originalUrl) {
    return originalUrl;
  }

  // If it's already a proxy URL, return as-is to prevent double encoding
  if (originalUrl.startsWith('/api/storage/')) {
    return originalUrl;
  }

  // If it's not a Supabase URL, return as-is
  if (!isSupabaseUrl(originalUrl)) {
    return originalUrl;
  }

  // Extract the file path from the Supabase URL
  const urlParts = originalUrl.split('/storage/v1/object/public/');
  if (urlParts.length > 1) {
    let filePath = urlParts[1];
    
    // Remove any query parameters and handle them separately
    const [pathOnly, queryString] = filePath.split('?');
    filePath = pathOnly;
    
    // Create a masked URL that goes through your backend
    // Don't double-encode if it's already encoded
    const encodedPath = filePath.includes('%') ? filePath : encodeURIComponent(filePath);
    return `/api/storage/${resourceType}/${encodedPath}${queryString ? '?' + queryString : ''}`;
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
 * Checks if a URL points to an image file
 */
export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  const imageHosts = /(unsplash\.com|pexels\.com|pixabay\.com|imgur\.com|cloudinary\.com|imagekit\.io)/i;
  return imageExtensions.test(url) || imageHosts.test(url);
};

/**
 * Converts markdown formatting to HTML
 * Handles bold (**text**), italic (*text*), and links
 * Special handling for image links - renders them as clickable image previews
 */
export const convertMarkdownLinksToHtml = (text: string): string => {
  if (!text) return text;

  let result = text;

  // Handle bold text **text** - must be done before italic to avoid conflicts
  result = result.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  // Handle italic text *text* (single asterisk, but not part of bold)
  result = result.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g,
    '<em>$1</em>'
  );

  // First handle markdown image links ![alt](url) - render as actual images
  result = result.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (match, altText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-block my-2">
        <img src="${url}" alt="${altText || 'Image'}" class="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow" style="max-height: 200px; object-fit: contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'color: #7c3aed; text-decoration: underline;\\'>${altText || 'View Image'}</span>';" />
      </a>`;
    }
  );

  // Handle markdown links that look like image links [!Image X](url) - common pattern from AI
  result = result.replace(
    /\[(!?Image\s*\d*[^\]]*)\]\(([^)\s]+)\)/gi,
    (match, linkText, url) => {
      if (isImageUrl(url)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-block my-2">
          <img src="${url}" alt="${linkText}" class="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow" style="max-height: 200px; object-fit: contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'color: #7c3aed; text-decoration: underline;\\'>${linkText}</span>';" />
        </a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">${linkText}</a>`;
    }
  );

  // Handle complete markdown links [text](url) - check if URL is an image
  result = result.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (match, linkText, url) => {
      // If URL is an image and link text suggests it's an image, show preview
      if (isImageUrl(url) && /image|photo|picture|img|pic/i.test(linkText)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-block my-2">
          <img src="${url}" alt="${linkText}" class="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow" style="max-height: 200px; object-fit: contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'color: #7c3aed; text-decoration: underline;\\'>${linkText}</span>';" />
        </a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">${linkText}</a>`;
    }
  );

  // Then handle incomplete markdown links [text]() - just return the text without brackets
  result = result.replace(
    /\[([^\]]+)\]\(\s*\)/g,
    (match, linkText) => {
      return linkText;
    }
  );

  return result;
};

/**
 * Replaces any storage URLs in text with appropriate clickable link text
 */
export const maskStorageUrlsInText = (text: string): string => {
  if (!text) return text;

  // First, handle markdown-style links
  let maskedText = convertMarkdownLinksToHtml(text);
  
  // Replace different types of storage URLs with appropriate clickable labels
  // Handle both full URLs (with https://) and partial URLs (without protocol)
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/avatars[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Profile Image</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/screenshots[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Screenshot</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/images[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Image</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/documents[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download Document</a>`;
    }
  );
  
  // Handle favicon URLs specifically (they may be in /static/favicons/ folder)
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/static\/favicons\/[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Logo</a>`;
    }
  );
  
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co\/storage\/v1\/object\/public\/[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">Download File</a>`;
    }
  );
  
  // General Supabase URL masking with clickable links
  maskedText = maskedText.replace(
    /(?:https?:\/\/)?([^\s]*\.supabase\.co[^\s]*)/g,
    (match, urlPart) => {
      const fullUrl = match.startsWith('http') ? match : `https://${urlPart}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: underline;">View Link</a>`;
    }
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