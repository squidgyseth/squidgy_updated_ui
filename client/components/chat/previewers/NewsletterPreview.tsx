import React from 'react';
import type { PreviewComponentProps } from './index';
import HTMLPreview from '../HTMLPreview';

/**
 * Newsletter Preview Component
 * Wraps HTMLPreview for newsletter content
 */
export default function NewsletterPreview({ data, content }: PreviewComponentProps) {
  if (!content) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">No newsletter content to preview</p>
      </div>
    );
  }

  return (
    <div className="newsletter-preview">
      {/* Preview metadata if available */}
      {data.subject && (
        <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-xs text-purple-600 font-medium">Subject</div>
          <div className="text-sm text-purple-900">{data.subject as string}</div>
          {data.sections && (
            <div className="text-xs text-purple-500 mt-1">
              {data.sections as number} sections · {data.word_count as number || '~'} words
            </div>
          )}
        </div>
      )}

      {/* HTML content preview */}
      <HTMLPreview content={content} />
    </div>
  );
}
