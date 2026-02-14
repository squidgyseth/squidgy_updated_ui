import React, { useEffect } from 'react';
import { googleCalendarService } from '../../lib/googleCalendar';
import { toast } from 'sonner';
import AgentMappingService from '../../services/agentMappingService';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import ImageCarousel from './ImageCarousel';

interface InteractiveMessageButtonsProps {
  content: string;
  onButtonClick: (text: string) => void;
  streamingText?: string; // Optional: use this for text display while content is used for button parsing
  isStreaming?: boolean; // When true, hide buttons until streaming completes
}

interface ButtonOption {
  emoji: string;
  text: string;
  description: string;
  fullText: string;
  imageUrl?: string; // For image preview buttons
}

interface ImagePreview {
  url: string;
  index: number;
}

export default function InteractiveMessageButtons({ content, onButtonClick, streamingText, isStreaming = false }: InteractiveMessageButtonsProps) {
  const agentMappingService = AgentMappingService.getInstance();

  // Load agent mappings on component mount
  useEffect(() => {
    agentMappingService.loadAgentMappings();
  }, []);

  // Parse image previews from markdown ![alt](url) format and legacy $$IMG:url$$ format
  const parseImagePreviews = (text: string): ImagePreview[] => {
    const images: ImagePreview[] = [];
    let index = 1;

    // Pattern 1: Standard markdown images ![alt](url)
    const markdownImgPattern = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = markdownImgPattern.exec(text)) !== null) {
      // Extract image number from alt text if present (e.g., "Image 1 - Description")
      const altText = match[1];
      const numMatch = altText.match(/Image\s*(\d+)/i);
      const imgIndex = numMatch ? parseInt(numMatch[1], 10) : index;
      images.push({ url: match[2].trim(), index: imgIndex });
      if (!numMatch) index++;
    }

    // Pattern 2: Non-standard markdown ![url] (URL inside brackets) - what the agent returns
    const nonStandardPattern = /!\[(https?:\/\/[^\]]+)\]/g;
    while ((match = nonStandardPattern.exec(text)) !== null) {
      // Only add if not already added from standard pattern
      const url = match[1].trim();
      if (!images.find(img => img.url === url)) {
        images.push({ url, index });
        index++;
      }
    }

    // Pattern 3: Legacy $$IMG:url$$ format (fallback)
    const legacyImgPattern = /\$\$IMG:(https?:\/\/[^$]+)\$\$/g;
    while ((match = legacyImgPattern.exec(text)) !== null) {
      const url = match[1].trim();
      if (!images.find(img => img.url === url)) {
        images.push({ url, index });
        index++;
      }
    }

    return images;
  };

  // Parse the content to find button patterns - flexible detection
  const parseButtonOptions = (text: string): ButtonOption[] => {
    const options: ButtonOption[] = [];

    // Button format: $**emoji Text - Description**$ (standard format)
    // Also supports: $emoji Text - Description$ (single dollar, no bold)
    const singleDollarPattern = /\$([^$]+)\$/g;

    const processMatch = (fullMatch: string, innerContent: string) => {
      // Skip IMG: patterns - these are image previews, not buttons
      if (innerContent.trim().startsWith('IMG:')) {
        return;
      }

      // Parse inner content - may have emoji at start, may have description after dash
      let emoji = '';
      let buttonText = innerContent.trim();
      let description = '';

      // Remove bold markers if present: **text** -> text
      buttonText = buttonText.replace(/\*\*([^*]+)\*\*/g, '$1');

      // Check if starts with emoji (first 1-4 chars could be emoji)
      const emojiMatch = buttonText.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]+)\s*/u);
      if (emojiMatch) {
        emoji = emojiMatch[1];
        buttonText = buttonText.slice(emojiMatch[0].length);
      }

      // Check for description after dash: "Text - Description"
      const dashIndex = buttonText.indexOf(' - ');
      if (dashIndex > 0) {
        description = buttonText.slice(dashIndex + 3).trim();
        buttonText = buttonText.slice(0, dashIndex).trim();
      }

      // Avoid duplicates
      if (buttonText && !options.find(o => o.text === buttonText)) {
        options.push({
          emoji,
          text: buttonText,
          description,
          fullText: fullMatch
        });
      }
    };

    // Parse single dollar patterns: $**text**$
    let match;
    while ((match = singleDollarPattern.exec(text)) !== null) {
      processMatch(match[0], match[1]);
    }

    return options;
  };

  // Remove button patterns from content to show clean text
  // KEEP image patterns (markdown and legacy) - carousel will render them
  const cleanContent = (text: string): string => {
    let cleaned = text;

    // Step 1: Temporarily replace all image patterns with placeholders to protect them
    const imgPatterns: string[] = [];

    // Standard markdown images ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });

    // Non-standard markdown ![url]
    cleaned = cleaned.replace(/!\[(https?:\/\/[^\]]+)\]/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });

    // Double dollar pattern $$IMG:url$$
    cleaned = cleaned.replace(/\$\$IMG:(https?:\/\/[^$\s]*?)\$\$/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });

    // Single dollar pattern $IMG:url$
    cleaned = cleaned.replace(/\$IMG:(https?:\/\/[^$\s]*?)\$/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });

    // Incomplete patterns (during streaming)
    cleaned = cleaned.replace(/\$\$?IMG:(?:https?:\/\/[^\s]*)?/g, (match) => {
      imgPatterns.push(match);
      return `__IMG_PLACEHOLDER_${imgPatterns.length - 1}__`;
    });

    // Step 2: Remove button format: $content$
    cleaned = cleaned.replace(/\$([^$]+)\$/g, '');

    // Step 2b: Remove orphaned $$ or $ (incomplete button patterns)
    cleaned = cleaned.replace(/\$\$+/g, '');

    // Step 3: Restore all image patterns
    imgPatterns.forEach((pattern, index) => {
      cleaned = cleaned.replace(`__IMG_PLACEHOLDER_${index}__`, pattern);
    });

    // Step 4: Remove markdown image patterns from text (they'll be shown in carousel)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, '');
    cleaned = cleaned.replace(/!\[(https?:\/\/[^\]]+)\]/g, '');

    // Remove stray empty list bullets that often remain after stripping $buttons$
    // e.g. lines that are only '-', '•', or '*' (optionally with whitespace)
    cleaned = cleaned
      .split('\n')
      .filter((line) => !/^\s*[-*•]\s*$/.test(line))
      .join('\n');

    // Clean up extra whitespace and empty lines
    return cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ newlines with double
      .replace(/^\s+|\s+$/g, '') // Trim start/end whitespace
      .trim();
  };

  const buttonOptions = parseButtonOptions(content);
  const imagePreviews = parseImagePreviews(content);
  // Use streamingText if provided, otherwise clean the content
  const textContent = streamingText || cleanContent(content);

  // Debug logging
  if (imagePreviews.length > 0) {
    console.log('🖼️ Images detected:', imagePreviews.length, imagePreviews);
  }


  // Check if a button corresponds to an image (e.g., "Image 1", "Select Image 1", "Image 2")
  const getImageForButton = (buttonText: string): string | undefined => {
    // Match patterns like "Image 1", "Select Image 1", "Choose Image 2"
    const match = buttonText.match(/(?:Select\s+)?Image\s+(\d+)$/i);
    if (match) {
      const imageIndex = parseInt(match[1], 10);
      const preview = imagePreviews.find(img => img.index === imageIndex);
      return preview?.url;
    }
    return undefined;
  };

  const handleButtonClick = async (option: ButtonOption) => {
    // Check for special button types that need real functionality
    const buttonText = option.text.toLowerCase();

    // Start Chat with Agent - try navigation first, fallback to message
    if (buttonText.includes('start chat with')) {
      // Extract agent name from button text: "Start Chat with Newsletter Agent Multi" -> "newsletter agent multi"
      const chatMatch = buttonText.match(/start chat with (.+)/);
      if (chatMatch) {
        const agentName = chatMatch[1].trim();

        // Ensure mappings are loaded before resolving
        await agentMappingService.loadAgentMappings();

        // Try to get agent ID for navigation
        const agentId = agentMappingService.getAgentId(agentName);

        if (agentId) {
          // Navigate to chat page
          window.location.href = `/chat/${agentId}`;
          return;
        } else {
          // Fallback: send message to AI - it will respond with sidebar instructions
          onButtonClick(option.text);
          return;
        }
      }
      // If regex didn't match, send as message
      onButtonClick(option.text);
      return;
    }

    // Add Another Assistant - trigger onboarding flow
    if (buttonText.includes('add another assistant') || buttonText.includes('add assistant')) {
      onButtonClick('Add Another Assistant');
      return;
    }

    // Google Calendar connection
    if (buttonText.includes('google calendar') || buttonText === 'connect calendar') {
      try {
        const authUrl = googleCalendarService.getAuthUrl();
        const urlWithState = `${authUrl}&state=google_calendar_auth`;
        window.location.href = urlWithState;
        return; // Don't send to chat, handle the redirect
      } catch (error) {
        console.error('Calendar connection error:', error);
        toast.error('Failed to connect to Google Calendar');
        onButtonClick('There was an error connecting to Google Calendar. Please try again.');
        return;
      }
    }

    // Outlook Calendar connection
    if (buttonText.includes('outlook calendar')) {
      toast.info('Outlook Calendar integration coming soon!');
      onButtonClick('Outlook Calendar integration is coming soon. For now, you can use Google Calendar.');
      return;
    }

    // Apple Calendar connection
    if (buttonText.includes('apple calendar')) {
      toast.info('Apple Calendar integration coming soon!');
      onButtonClick('Apple Calendar integration is coming soon. For now, you can use Google Calendar.');
      return;
    }

    // Enable Notifications
    if (buttonText.includes('enable notifications')) {
      try {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            toast.success('Notifications enabled successfully!');
            onButtonClick('Great! Notifications have been enabled. You\'ll receive updates about leads, meetings, and important tasks.');
          } else {
            toast.error('Notifications were denied. Please enable them in your browser settings.');
            onButtonClick('Notifications were not enabled. You can enable them later in your browser settings.');
          }
        } else {
          toast.error('Notifications are not supported in this browser.');
          onButtonClick('Notifications are not supported in this browser.');
        }
        return;
      } catch (error) {
        console.error('Notification error:', error);
        onButtonClick('There was an error enabling notifications.');
        return;
      }
    }

    // Connect Calendar (generic)
    if (buttonText === 'connect calendar') {
      // Show calendar options or default to Google
      onButtonClick('I\'d like to connect my calendar. Please show me the available options.');
      return;
    }

    // For all other buttons, send the option text directly to continue conversation
    onButtonClick(option.text);
  };

  return (
    <div className="space-y-3">
      {/* Display the cleaned text content with markdown rendering */}
      {textContent && (
        <LinkDetectingTextArea
          content={textContent}
          className="whitespace-pre-wrap text-gray-800"
        />
      )}

      {/* Display image carousel if there are images */}
      {imagePreviews.length > 0 && (
        <ImageCarousel
          images={imagePreviews.map(img => ({
            url: img.url,
            index: img.index,
            alt: `Post preview ${img.index}`
          }))}
          className="my-4"
        />
      )}

      {/* Display interactive buttons - only after streaming completes, with staggered animation */}
      {buttonOptions.length > 0 && !isStreaming && (
        <div className="space-y-2 mt-4">
          {buttonOptions.map((option, index) => {
            return (
              <button
                key={index}
                onClick={() => handleButtonClick(option)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all text-left group opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                {option.emoji && <span className="text-lg flex-shrink-0">{option.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 group-hover:text-purple-700">
                      {option.text}
                    </span>
                    {option.description && (
                      <>
                        <span className="text-gray-500">-</span>
                        <span className="text-gray-600 text-sm">
                          {option.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}