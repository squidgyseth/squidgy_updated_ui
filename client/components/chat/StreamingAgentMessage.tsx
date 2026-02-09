import React, { useEffect, useState } from 'react';
import { useStreamingText } from '../../lib/streaming';
import type { N8nResponse } from '../../types/n8n.types';
import HTMLPreview from './HTMLPreview';
import SocialMediaPreview from './SocialMediaPreview';
import SocialMediaLink from './SocialMediaLink';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import EnableContentRepurposerButton from './EnableContentRepurposerButton';
import InteractiveMessageButtons from './InteractiveMessageButtons';
import { maskStorageUrlsInText } from '../../utils/urlMasking';

interface StreamingAgentMessageProps {
  response: N8nResponse;
  className?: string;
  enableStreaming?: boolean; // Allow disabling streaming for specific cases
  streamingSpeed?: number; // Configurable streaming speed (ms per character)
  onButtonClick?: (text: string) => void; // Handler for button clicks
}

/**
 * Component that handles agent responses with optional streaming animation.
 * For plain text/markdown responses, streams character-by-character.
 * For HTML/structured content, shows immediately (no streaming).
 */
export default function StreamingAgentMessage({
  response,
  className = '',
  enableStreaming = true,
  streamingSpeed = 15,
  onButtonClick
}: StreamingAgentMessageProps) {
  // Ensure agent_response is always a string to prevent undefined errors
  const safeAgentResponse = response.agent_response ?? response.response ?? '';
  
  const [shouldStream, setShouldStream] = useState(false);
  const [displayContent, setDisplayContent] = useState(safeAgentResponse);

  // Helper to detect if content contains interactive buttons
  // Check for both $$....$$ and $...$ patterns
  const hasInteractiveButtons = (text: string): boolean => {
    return /\$\$[^$]+\$\$/.test(text) || /\$[^$]+\$/.test(text);
  };

  // Helper function to detect numbered list options (e.g., "1. Option Text|Description")
  const hasNumberedOptions = (content: string): boolean => {
    const lines = content.split('\n');
    let count = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
        count++;
      }
    }
    return count >= 2;
  };

  // Helper function to extract numbered options with pipe separator (e.g., "Title|Description")
  const extractNumberedOptionsWithDescription = (content: string): { title: string; description: string }[] => {
    const options: { title: string; description: string }[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^\d+\.\s+(.+)$/);
      if (match && /^[A-Z]/.test(match[1])) {
        const optionText = match[1].trim();
        if (optionText.includes('|')) {
          const [title, ...descParts] = optionText.split('|');
          options.push({ title: title.trim(), description: descParts.join('|').trim() });
        } else {
          options.push({ title: optionText, description: '' });
        }
      }
    }
    return options;
  };

  // Helper function to get content without numbered options (intro text only)
  const getContentWithoutNumberedOptions = (content: string): string => {
    const lines = content.split('\n');
    const introLines: string[] = [];
    for (const line of lines) {
      if (/^\d+\.\s+[A-Z]/.test(line.trim())) {
        break;
      }
      introLines.push(line);
    }
    return introLines.join('\n').trim();
  };

  // Helper to extract text-only content (remove buttons) for streaming
  // KEEP $$IMG:url$$ patterns - they will render as images inline after streaming
  const extractTextContent = (text: string): string => {
    let cleaned = text;
    
    // Step 1: Temporarily replace $IMG:url$ and $$IMG:url$$ with placeholders to protect them
    const imgPatterns: string[] = [];
    // Double dollar pattern
    cleaned = cleaned.replace(/\$\$IMG:(https?:\/\/[^$\s]*?)\$\$/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });
    // Single dollar pattern
    cleaned = cleaned.replace(/\$IMG:(https?:\/\/[^$\s]*?)\$/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });
    // Incomplete patterns (during streaming) - also protect these
    cleaned = cleaned.replace(/\$\$?IMG:(?:https?:\/\/[^\s]*)?/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });
    
    // Step 2: Remove all button patterns ($$...$$)
    cleaned = cleaned.replace(/\$\$[^$]+\$\$/g, '');
    
    // Step 3: Remove single dollar patterns
    cleaned = cleaned.replace(/(?<!\$)\$(?!\$)([^$]+)\$(?!\$)/g, '');
    
    // Step 4: Restore $$IMG:url$$ patterns
    imgPatterns.forEach((pattern, index) => {
      cleaned = cleaned.replace(`__IMG_PLACEHOLDER_${index}__`, pattern);
    });

    // Remove stray empty list bullets that often remain
    cleaned = cleaned
      .split('\n')
      .filter((line) => !/^\s*[-*•]\s*$/.test(line))
      .join('\n');

    // Clean up extra whitespace
    return cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  // Check if response is social media content
  const isSocialMediaContent = () => {
    try {
      const parsed = JSON.parse(safeAgentResponse);

      // Handle error structure with raw JSON content
      if (parsed && parsed.error && parsed.raw) {
        try {
          const rawContent = parsed.raw.replace(/```json\n|\n```/g, '');
          const innerParsed = JSON.parse(rawContent);
          if (innerParsed && (innerParsed.LinkedIn || innerParsed.InstagramFacebook || innerParsed.TikTokReels || innerParsed.GeneralAssets)) {
            return true;
          }
        } catch {
          // If inner parsing fails, continue with outer checks
        }
      }

      // Check for ContentRepurposerPosts structure
      if (Array.isArray(parsed) && parsed[0] && parsed[0].ContentRepurposerPosts) {
        return true;
      }
      if (parsed && parsed.ContentRepurposerPosts) {
        return true;
      }
      // Also check for direct social media keys
      if (parsed && (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels || parsed.GeneralAssets)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Determine if this content should be streamed
  useEffect(() => {
    if (!enableStreaming) {
      setShouldStream(false);
      return;
    }

    // Don't stream full HTML documents or social media content
    // Simple inline HTML like <br>, <strong> should still stream as text
    const isFullHtmlDocument = (
      /<!DOCTYPE/i.test(safeAgentResponse) ||
      /<html[\s>]/i.test(safeAgentResponse) ||
      /<body[\s>]/i.test(safeAgentResponse) ||
      /<table[\s>]/i.test(safeAgentResponse) ||
      /<style[\s>]/i.test(safeAgentResponse)
    );
    const isSocial = isSocialMediaContent();
    const isContentRepurposer = response.agent_name === 'content_repurposer';
    const isNewsletter = response.agent_name === 'newsletter';

    // Only stream plain text/markdown for Ready, Waiting states, or when status is undefined
    // Don't stream for 'Nothing' status (agent is idle)
    // When content has buttons, we still stream the text part (InteractiveMessageButtons handles separation)
    const shouldStreamContent =
      !isFullHtmlDocument &&
      !isSocial &&
      !isContentRepurposer &&
      !isNewsletter &&
      (response.agent_status === 'Ready' ||
       response.agent_status === 'Waiting' ||
       !response.agent_status); // Also stream when status is undefined

    setShouldStream(shouldStreamContent);
  }, [safeAgentResponse, response.agent_status, response.agent_name, enableStreaming]);

  // Determine content to stream: if buttons present, stream only text part
  const contentToStream = React.useMemo(() => {
    if (!shouldStream) return '';

    const hasButtons = hasInteractiveButtons(safeAgentResponse);
    if (hasButtons) {
      // Stream only the text content (buttons will render separately)
      return extractTextContent(safeAgentResponse);
    }

    // Stream full content
    return safeAgentResponse;
  }, [shouldStream, safeAgentResponse]);

  // Use streaming hook for text content
  const { streamedText, isStreaming } = useStreamingText(
    contentToStream,
    {
      speed: streamingSpeed,
      autoStart: shouldStream,
      onComplete: () => {
      }
    }
  );

  // Update display content based on streaming state
  useEffect(() => {
    if (shouldStream) {
      setDisplayContent(streamedText);
    } else {
      setDisplayContent(safeAgentResponse);
    }
  }, [shouldStream, streamedText, safeAgentResponse]);

  // Render different content types based on agent_status and content type
  const renderContent = () => {
    switch (response.agent_status) {
      case 'Ready':
        // Always show SocialMediaPreview for content_repurposer agent
        if (response.agent_name === 'content_repurposer') {
          return (
            <SocialMediaPreview
              content={displayContent}
              historyId={response.request_id}
            />
          );
        }

        // Always use HTMLPreview for newsletter agent
        if (response.agent_name === 'newsletter') {
          return (
            <>
              <HTMLPreview content={displayContent} />
              <EnableContentRepurposerButton />
            </>
          );
        }

        // Check if it's legacy social media content
        if (isSocialMediaContent()) {
          return <SocialMediaLink content={displayContent} />;
        }

        // Check if content is a full HTML document (not just simple inline formatting)
        // Only use HTMLPreview for actual HTML documents with structural tags
        const isFullHtmlDocument = (
          /<!DOCTYPE/i.test(safeAgentResponse) ||
          /<html[\s>]/i.test(safeAgentResponse) ||
          /<body[\s>]/i.test(safeAgentResponse) ||
          /<table[\s>]/i.test(safeAgentResponse) ||
          /<style[\s>]/i.test(safeAgentResponse)
        );

        if (isFullHtmlDocument) {
          return <HTMLPreview content={displayContent} agentName={response.agent_name} />;
        }

        // Check if content has interactive buttons
        const hasButtons = hasInteractiveButtons(safeAgentResponse);

        // For content with interactive buttons - use InteractiveMessageButtons
        // Pass full content for button parsing + streaming text for display
        if (hasButtons && onButtonClick) {
          return (
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <InteractiveMessageButtons
                content={safeAgentResponse}
                streamingText={displayContent}
                onButtonClick={onButtonClick}
                isStreaming={isStreaming}
              />
              {/* Show streaming cursor while text is streaming */}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle">
                  ▍
                </span>
              )}
            </div>
          );
        }

        // For personal_assistant, check for numbered options with pipe separator (Title|Description)
        if (response.agent_name === 'personal_assistant' && hasNumberedOptions(safeAgentResponse)) {
          const introText = getContentWithoutNumberedOptions(safeAgentResponse);
          const options = extractNumberedOptionsWithDescription(safeAgentResponse);
          return (
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              {introText && (
                <div 
                  className="text-text-primary mb-3"
                  dangerouslySetInnerHTML={{ __html: maskStorageUrlsInText(introText) }}
                />
              )}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle">
                  ▍
                </span>
              )}
              {!isStreaming && (
                <div className="space-y-2">
                  {options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => onButtonClick?.(option.title)}
                      className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                    >
                      <span className="text-purple-700 font-medium">{idx + 1}. {option.title}</span>
                      {option.description && (
                        <span className="text-purple-600 text-sm ml-1">- {option.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // For plain text/markdown content (with streaming)
        return (
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <LinkDetectingTextArea
              content={displayContent}
              className="text-text-primary whitespace-pre-wrap"
            />
            {/* Show streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle">
                ▍
              </span>
            )}
          </div>
        );

      case 'Waiting':
        // For Waiting status, display with streaming
        return (
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <LinkDetectingTextArea
              content={displayContent}
              className="text-text-primary whitespace-pre-wrap"
            />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle">
                ▍
              </span>
            )}
          </div>
        );

      case 'Nothing':
        return (
          <div className="text-gray-500 text-sm italic">
            Agent is idle. Send a message to start.
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <LinkDetectingTextArea
              content={displayContent}
              className="text-gray-700"
            />
          </div>
        );
    }
  };

  return (
    <div className={`agent-response ${response.agent_status?.toLowerCase()}-state ${className}`}>
      {renderContent()}
    </div>
  );
}
