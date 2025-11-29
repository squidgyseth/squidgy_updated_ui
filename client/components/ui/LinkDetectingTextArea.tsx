import React from 'react';
import { maskStorageUrlsInText } from '../../utils/urlMasking';

interface LinkDetectingTextAreaProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A reusable component that detects and renders links in text content
 * Handles markdown links, raw URLs, and Supabase storage URLs
 */
export function LinkDetectingTextArea({ 
  content, 
  className = "text-sm leading-relaxed whitespace-pre-line",
  style = {}
}: LinkDetectingTextAreaProps) {
  if (!content) return null;

  // Process the content to convert all types of links to HTML
  const processedContent = maskStorageUrlsInText(content);

  return (
    <div 
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

export default LinkDetectingTextArea;