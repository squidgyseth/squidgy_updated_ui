import React, { useEffect } from 'react';
import {
  registerPreview,
  getPreviewComponent,
  hasPreviewComponent,
  detectPreviewType,
  type PreviewData
} from './previewers';

// Import preview components
import NewsletterPreview from './previewers/NewsletterPreview';
import SocialMediaPreviewWrapper from './previewers/SocialMediaPreviewWrapper';
import HTMLPreview from './HTMLPreview';

// Register built-in preview components
const registerBuiltInPreviews = () => {
  if (!hasPreviewComponent('newsletter')) {
    registerPreview('newsletter', NewsletterPreview);
  }
  if (!hasPreviewComponent('social_media')) {
    registerPreview('social_media', SocialMediaPreviewWrapper);
  }
  if (!hasPreviewComponent('html')) {
    // For generic HTML, use a simple wrapper
    registerPreview('html', ({ content }) => (
      <HTMLPreview content={content || ''} />
    ));
  }
};

interface ContentPreviewProps {
  preview?: PreviewData;
  content: string;
  historyId?: string;
  className?: string;
}

/**
 * ContentPreview Component
 *
 * Automatically selects the appropriate preview component based on:
 * 1. Explicit preview.type from response
 * 2. Auto-detection from content
 *
 * Usage:
 * ```tsx
 * <ContentPreview
 *   preview={response.preview}
 *   content={response.agent_response}
 *   historyId={response.request_id}
 * />
 * ```
 */
export default function ContentPreview({
  preview,
  content,
  historyId,
  className = ''
}: ContentPreviewProps) {
  // Register built-in previews on first render
  useEffect(() => {
    registerBuiltInPreviews();
  }, []);

  // Determine preview type
  let previewType = preview?.type;

  // If no explicit type, try to detect from content
  if (!previewType) {
    previewType = detectPreviewType(content) || undefined;
  }

  // Get the preview component
  const PreviewComponent = previewType ? getPreviewComponent(previewType) : undefined;

  // If we have a registered component, use it
  if (PreviewComponent) {
    return (
      <div className={`content-preview ${className}`}>
        <PreviewComponent
          data={preview || { type: previewType }}
          content={content}
          historyId={historyId}
        />
      </div>
    );
  }

  // Fallback: render content as-is
  return (
    <div className={`content-preview fallback ${className}`}>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
          {content}
        </pre>
      </div>
    </div>
  );
}

// Export utilities for external use
export { registerPreview, hasPreviewComponent, detectPreviewType };
