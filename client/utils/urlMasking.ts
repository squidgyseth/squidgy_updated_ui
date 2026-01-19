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
 * Converts any Unsplash image URLs to HTML img tags
 * Detects https://images.unsplash.com/photo-* URLs and displays them as images
 */
export const convertUnsplashUrlsToImages = (text: string): string => {
  if (!text) return text;

  console.log('[Unsplash Images] Checking for Unsplash URLs...');
  
  // Match any Unsplash image URL (with or without query parameters)
  const result = text.replace(
    /https:\/\/images\.unsplash\.com\/photo-[^\s\)\"\'<>]*/g,
    (imageUrl) => {
      console.log('[Unsplash Images] Found URL:', imageUrl);
      return `<div style="margin: 12px 0;">
        <img src="${imageUrl}" 
             alt="Unsplash Image" 
             style="max-width: 400px; 
                    width: 100%; 
                    height: auto; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s;"
             onclick="window.open('${imageUrl}', '_blank')"
             onmouseover="this.style.transform='scale(1.02)'"
             onmouseout="this.style.transform='scale(1)'" />
      </div>`;
    }
  );
  
  return result;
};

/**
 * Converts JSON image arrays with {name, url} structure to HTML img tags
 * Handles: {"images": [{"name": "...", "url": "..."}]}
 */
export const convertJsonImagesToHtml = (text: string): string => {
  if (!text) return text;

  try {
    console.log('[JSON Images] Processing text for JSON images...');
    
    // Try to find JSON image arrays in the text, including markdown code blocks
    // Match ```json ... ``` or ``` ... ``` (with or without json tag)
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    console.log('[JSON Images] Code block found:', !!codeBlockMatch);
    
    if (!codeBlockMatch) return text;
    
    let jsonText = codeBlockMatch[1];
    
    // Try to find the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*?"images"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/);
    console.log('[JSON Images] JSON match found:', !!jsonMatch);
    if (!jsonMatch) return text;

    // Unescape the quotes if they're escaped
    let jsonString = jsonMatch[0].replace(/\\"/g, '"');
    console.log('[JSON Images] Attempting to parse JSON...');
    
    const parsed = JSON.parse(jsonString);
    console.log('[JSON Images] Parsed successfully! Images count:', parsed.images?.length);
    if (!parsed.images || !Array.isArray(parsed.images)) return text;

    // Generate HTML for all images with names
    const imagesHtml = parsed.images.map((img: { name: string; url: string }) => {
      return `<div style="margin: 16px 0;">
        <div style="font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 14px;">${img.name}</div>
        <img src="${img.url}" 
             alt="${img.name}" 
             style="max-width: 400px; 
                    width: 100%; 
                    height: auto; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s;"
             onclick="window.open('${img.url}', '_blank')"
             onmouseover="this.style.transform='scale(1.02)'"
             onmouseout="this.style.transform='scale(1)'" />
      </div>`;
    }).join('');

    // Replace the entire code block with just the images
    console.log('[JSON Images] Replacing code block with images HTML');
    return text.replace(codeBlockMatch[0], imagesHtml);
  } catch (error) {
    // If parsing fails, return original text
    console.error('Failed to parse JSON images:', error);
    return text;
  }
};

/**
 * Converts markdown-style images to HTML img tags
 * Handles ![alt text](image_url) format with numbered list names
 */
export const convertMarkdownImagesToHtml = (text: string): string => {
  if (!text) return text;

  console.log('[Markdown Images] Processing markdown images...');
  
  // Pattern to match: number. name - ![Image](url)
  // This captures the name before the dash and the image markdown
  const pattern = /(\d+\.\s*\n?)([^\n]+?)\s*\n?-\s*\n?!\[([^\]]*)\]\(([^)]+)\)/g;
  
  let result = text.replace(pattern, (match, number, imageName, altText, imageUrl) => {
    console.log('[Markdown Images] Found image:', imageName.trim());
    return `<div style="margin: 16px 0;">
      <div style="font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 14px;">${imageName.trim()}</div>
      <img src="${imageUrl.trim()}" 
           alt="${imageName.trim()}" 
           style="max-width: 400px; 
                  width: 100%; 
                  height: auto; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  cursor: pointer;
                  transition: transform 0.2s;"
           onclick="window.open('${imageUrl.trim()}', '_blank')"
           onmouseover="this.style.transform='scale(1.02)'"
           onmouseout="this.style.transform='scale(1)'" />
    </div>`;
  });
  
  // Remove the duplicate numbered list at the end (just numbers and names without images)
  // This matches patterns like "1.\nImage Name" that appear after all the images
  result = result.replace(/\n+(\d+\.\s*\n?[^\n]+\n?)+$/g, '');
  
  return result;
};

/**
 * Converts markdown-style links to HTML anchor tags
 * Handles both complete [text](url) and incomplete [text]() formats
 */
export const convertMarkdownLinksToHtml = (text: string): string => {
  if (!text) return text;

  let result = text;

  // First handle complete markdown links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (match, linkText, url) => {
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

  // First, try to handle JSON image arrays
  let maskedText = convertJsonImagesToHtml(text);
  
  // Then, handle markdown-style images (must be before Unsplash URLs to avoid conflicts)
  maskedText = convertMarkdownImagesToHtml(maskedText);
  
  // Then, convert any remaining Unsplash URLs to images
  maskedText = convertUnsplashUrlsToImages(maskedText);
  
  // Then, handle markdown-style links
  maskedText = convertMarkdownLinksToHtml(maskedText);
  
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