import React, { useRef, useEffect, useState } from 'react';
import { ExternalLink, Copy, Download, Maximize2, Edit, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HTMLPreviewProps {
  content: string;
  className?: string;
}

/**
 * Safely previews HTML content in a sandboxed iframe
 * Used when agent_status is "Ready" (e.g., newsletter HTML generation)
 */
export default function HTMLPreview({ content, className = '' }: HTMLPreviewProps) {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSocialMedia, setIsSocialMedia] = useState(false);

  useEffect(() => {
    // Check if content is social media data
    try {
      const parsed = JSON.parse(content);
      
      // Direct social media content
      if (parsed && (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels)) {
        setIsSocialMedia(true);
        return;
      }
      
      // Array with social media content
      if (Array.isArray(parsed) && parsed[0] && (parsed[0].LinkedIn || parsed[0].InstagramFacebook || parsed[0].TikTokReels)) {
        setIsSocialMedia(true);
        return;
      }
      
      // Agent response format: check if there's an object with agent metadata and social media content
      if (parsed && typeof parsed === 'object') {
        // Look for social media content in any property that's not metadata
        const socialMediaKeys = ['LinkedIn', 'InstagramFacebook', 'TikTokReels', 'GeneralAssets'];
        const hasSocialContent = socialMediaKeys.some(key => parsed[key]);
        
        if (hasSocialContent) {
          setIsSocialMedia(true);
          return;
        }
        
        // Check if any property contains an object with social media keys
        for (const [key, value] of Object.entries(parsed)) {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const hasNestedSocialContent = socialMediaKeys.some(socialKey => value[socialKey]);
            if (hasNestedSocialContent) {
              setIsSocialMedia(true);
              return;
            }
          }
        }
      }
    } catch (e) {
      // Not JSON, continue with HTML preview
    }
    setIsSocialMedia(false);

    if (iframeRef.current) {
      // Set iframe content with proper HTML structure
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 20px;
              }
              * {
                max-width: 100%;
                word-wrap: break-word;
              }
              img {
                height: auto;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
      
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-content-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: URL will be revoked when the tab is closed
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEdit = () => {
    if (isSocialMedia) {
      // Save content to localStorage for social media preview
      localStorage.setItem('socialMediaContent', content);
      // Navigate to social media preview
      navigate('/social-preview');
    } else {
      // Save content to localStorage for the newsletter editor
      localStorage.setItem('newsletterContent', content);
      // Navigate to the React newsletter editor component
      navigate('/newsletter-editor');
    }
  };

  return (
    <div className={`html-preview-container ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {isSocialMedia ? 'Social Media Content' : 'Newsletter Preview'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title={isSocialMedia ? "Preview Social Posts" : "Edit Newsletter"}
          >
            {isSocialMedia ? <Share2 size={16} className="text-gray-600" /> : <Edit size={16} className="text-gray-600" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Copy HTML"
          >
            <Copy size={16} className={isCopied ? 'text-green-500' : 'text-gray-600'} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Download HTML"
          >
            <Download size={16} className="text-gray-600" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={16} className="text-gray-600" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className={`relative bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {isSocialMedia ? (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Media Content Generated</h3>
              <p className="text-gray-600 mb-4">
                Your content has been repurposed for LinkedIn, Instagram, and TikTok. 
                Click the preview button to see all posts in a social media feed layout.
              </p>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Preview Social Posts
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className={`w-full border-0 ${isFullscreen ? 'h-screen' : 'h-96'}`}
            title="HTML Content Preview"
            sandbox="allow-same-origin"
            style={{ backgroundColor: 'white' }}
          />
        )}
        
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-white shadow-lg rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm">Close</span>
          </button>
        )}
      </div>

      {isCopied && (
        <div className="absolute top-16 right-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm">
          Copied!
        </div>
      )}
    </div>
  );
}
