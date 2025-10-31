import React, { useRef, useEffect, useState } from 'react';
import { ExternalLink, Copy, Download, Maximize2, Edit } from 'lucide-react';

interface HTMLPreviewProps {
  content: string;
  className?: string;
}

/**
 * Safely previews HTML content in a sandboxed iframe
 * Used when agent_status is "Ready" (e.g., newsletter HTML generation)
 */
export default function HTMLPreview({ content, className = '' }: HTMLPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
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
    // Save content to localStorage for the editor to access
    localStorage.setItem('newsletterContent', content);
    
    // Open newsletter-editor.html in a new tab
    window.open('/newsletter-editor.html', '_blank');
  };

  return (
    <div className={`html-preview-container ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Newsletter Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Edit Newsletter"
          >
            <Edit size={16} className="text-gray-600" />
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
        <iframe
          ref={iframeRef}
          className={`w-full border-0 ${isFullscreen ? 'h-screen' : 'h-96'}`}
          title="HTML Content Preview"
          sandbox="allow-same-origin"
          style={{ backgroundColor: 'white' }}
        />
        
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