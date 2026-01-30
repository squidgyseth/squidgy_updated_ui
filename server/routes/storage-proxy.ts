import express from 'express';

const router = express.Router();

/**
 * Proxy route to serve Supabase storage files without exposing the original URLs
 * This route masks the underlying Supabase storage URLs for security and branding
 */
router.get('/:type/:filePath', async (req, res) => {
  try {
    const { type, filePath } = req.params;
    
    // Validate resource type
    const validTypes = ['avatar', 'image', 'file'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    // Decode the file path
    const decodedFilePath = decodeURIComponent(filePath);
    
    // Check if it's a base64 encoded URL (fallback case)
    let actualUrl;
    try {
      // Try to decode as base64 first (fallback case)
      actualUrl = Buffer.from(decodedFilePath, 'base64').toString('utf-8');
    } catch {
      // If not base64, treat as direct file path
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return res.status(500).json({ error: 'Supabase URL not configured' });
      }
      actualUrl = `${supabaseUrl}/storage/v1/object/public/${decodedFilePath}`;
    }

    // Validate that it's a Supabase URL for security
    if (!actualUrl.includes('.supabase.co')) {
      return res.status(400).json({ error: 'Invalid storage URL' });
    }

    // Fetch the file from Supabase
    const response = await fetch(actualUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'File not found' });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'X-Robots-Tag': 'noindex', // Don't index these proxy URLs
    });

    // Stream the file data
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Storage proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
