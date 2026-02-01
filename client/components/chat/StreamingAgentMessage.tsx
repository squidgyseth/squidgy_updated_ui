import React, { useEffect, useState } from 'react';
import { useStreamingText } from '../../lib/streaming';
import type { N8nResponse } from '../../types/n8n.types';
import HTMLPreview from './HTMLPreview';
import SocialMediaPreview from './SocialMediaPreview';
import SocialMediaLink from './SocialMediaLink';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import EnableContentRepurposerButton from './EnableContentRepurposerButton';
import InteractiveMessageButtons from './InteractiveMessageButtons';

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
  const [shouldStream, setShouldStream] = useState(false);
  const [displayContent, setDisplayContent] = useState(response.agent_response);

  // Helper to detect if content contains interactive buttons
  // Check for both $$....$$ and $...$ patterns
  const hasInteractiveButtons = (text: string): boolean => {
    return /\$\$[^$]+\$\$/.test(text) || /\$[^$]+\$/.test(text);
  };

  // Helper to extract text-only content (remove buttons) for streaming
  // Remove both $$...$$ and $...$ patterns
  const extractTextContent = (text: string): string => {
    let cleaned = text
      .replace(/\$\$([^$]+)\$\$/g, '') // Remove double dollar patterns
      .replace(/\$([^$]+)\$/g, '');     // Remove single dollar patterns

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
      const parsed = JSON.parse(response.agent_response);

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
      /<!DOCTYPE/i.test(response.agent_response) ||
      /<html[\s>]/i.test(response.agent_response) ||
      /<body[\s>]/i.test(response.agent_response) ||
      /<table[\s>]/i.test(response.agent_response) ||
      /<style[\s>]/i.test(response.agent_response)
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
  }, [response.agent_response, response.agent_status, response.agent_name, enableStreaming]);

  // Determine content to stream: if buttons present, stream only text part
  const contentToStream = React.useMemo(() => {
    if (!shouldStream) return '';

    const hasButtons = hasInteractiveButtons(response.agent_response);
    if (hasButtons) {
      // Stream only the text content (buttons will render separately)
      return extractTextContent(response.agent_response);
    }

    // Stream full content
    return response.agent_response;
  }, [shouldStream, response.agent_response]);

  // Use streaming hook for text content
  const { streamedText, isStreaming } = useStreamingText(
    contentToStream,
    {
      speed: streamingSpeed,
      autoStart: shouldStream,
      onComplete: () => {
        console.log('✅ Streaming complete for message:', response.request_id);
      }
    }
  );

  // Update display content based on streaming state
  useEffect(() => {
    if (shouldStream) {
      setDisplayContent(streamedText);
    } else {
      setDisplayContent(response.agent_response);
    }
  }, [shouldStream, streamedText, response.agent_response]);

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
          /<!DOCTYPE/i.test(response.agent_response) ||
          /<html[\s>]/i.test(response.agent_response) ||
          /<body[\s>]/i.test(response.agent_response) ||
          /<table[\s>]/i.test(response.agent_response) ||
          /<style[\s>]/i.test(response.agent_response)
        );

        if (isFullHtmlDocument) {
          return <HTMLPreview content={displayContent} agentName={response.agent_name} />;
        }

        // Check if content has interactive buttons
        const hasButtons = hasInteractiveButtons(response.agent_response);

        // For content with interactive buttons - use InteractiveMessageButtons
        // Pass full content for button parsing + streaming text for display
        if (hasButtons && onButtonClick) {
          return (
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <InteractiveMessageButtons
                content={response.agent_response}
                streamingText={displayContent}
                onButtonClick={onButtonClick}
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
