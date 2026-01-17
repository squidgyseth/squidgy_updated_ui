import React from 'react';
import type { PreviewComponentProps } from './index';
import SocialMediaPreview from '../SocialMediaPreview';

/**
 * Social Media Preview Component
 * Wraps SocialMediaPreview for social media content
 */
export default function SocialMediaPreviewWrapper({ data, content, historyId }: PreviewComponentProps) {
  if (!content) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">No social media content to preview</p>
      </div>
    );
  }

  return (
    <div className="social-media-preview">
      {/* Preview metadata if available */}
      {data.platforms && (
        <div className="mb-3 flex flex-wrap gap-2">
          {(data.platforms as string[]).map((platform, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
            >
              {platform}
            </span>
          ))}
        </div>
      )}

      {/* Social media content preview */}
      <SocialMediaPreview content={content} historyId={historyId || ''} />
    </div>
  );
}
