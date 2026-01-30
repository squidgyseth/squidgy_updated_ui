import React from 'react';
import { maskStorageUrlsInText } from '../../utils/urlMasking';
import StreamingText from '../chat/StreamingText';

interface LinkDetectingTextAreaProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  shouldStream?: boolean;
  onStreamComplete?: () => void;
}

/**
 * A reusable component that detects and renders links in text content
 * Handles markdown links, raw URLs, and Supabase storage URLs
 */
export function LinkDetectingTextArea({
  content,
  className = "text-sm leading-relaxed whitespace-pre-line",
  style = {},
  shouldStream = false,
  onStreamComplete
}: LinkDetectingTextAreaProps) {
  if (!content) return null;

  // Process the content to convert all types of links to HTML
  const processedContent = maskStorageUrlsInText(content);

  if (shouldStream) {
    return (
      <StreamingText
        content={content} // We use raw content for streaming to avoid tag cutting issues
        className={className}
        onComplete={onStreamComplete}
        shouldStream={true}
      />
    );
  }

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

export default LinkDetectingTextArea;
