import React, { useEffect } from 'react';
import { googleCalendarService } from '../../lib/googleCalendar';
import { toast } from 'sonner';
import AgentMappingService from '../../services/agentMappingService';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';

interface InteractiveMessageButtonsProps {
  content: string;
  onButtonClick: (text: string) => void;
}

interface ButtonOption {
  emoji: string;
  text: string;
  description: string;
  fullText: string;
}

export default function InteractiveMessageButtons({ content, onButtonClick }: InteractiveMessageButtonsProps) {
  const agentMappingService = AgentMappingService.getInstance();

  // Load agent mappings on component mount
  useEffect(() => {
    agentMappingService.loadAgentMappings();
  }, []);
  // Parse the content to find button patterns - flexible detection
  const parseButtonOptions = (text: string): ButtonOption[] => {
    console.log('🔍 InteractiveMessageButtons: Parsing content:', text);
    const options: ButtonOption[] = [];
    
    // Handle multiple formats:
    // 1. $$emoji Text - Description$$ (current format from screenshot)
    // 2. $$**TEXT**$$ (bold format)
    // 3. $****TEXT****$ (old format)
    
    // Pattern for $$content$$ - captures everything between $$ markers
    const dollarPattern = /\$\$([^$]+)\$\$/g;
    
    let match;
    while ((match = dollarPattern.exec(text)) !== null) {
      const [fullMatch, innerContent] = match;
      
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
    }
    
    console.log('🔍 InteractiveMessageButtons: Found button options:', options);
    return options;
  };

  // Remove button patterns from content to show clean text
  const cleanContent = (text: string): string => {
    // Remove both formats: $$**TEXT**$$ and $**TEXT**$
    let cleaned = text
      .replace(/\$\$([^$]+)\$\$/g, '') // New format
      .replace(/\$\$\*\*[^*]+\*\*\$\$/g, '') // New format
      .replace(/\$\*\*\*\*[^*]+\*\*\*\*\$/g, ''); // Old format
    
    // Clean up extra whitespace and empty lines
    return cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ newlines with double
      .replace(/^\s+|\s+$/g, '') // Trim start/end whitespace
      .trim();
  };

  const buttonOptions = parseButtonOptions(content);
  const textContent = cleanContent(content);
  
  console.log('🔍 InteractiveMessageButtons: Clean text content:', textContent);
  console.log('🔍 InteractiveMessageButtons: Button options count:', buttonOptions.length);

  const handleButtonClick = async (option: ButtonOption) => {
    // Check for special button types that need real functionality
    const buttonText = option.text.toLowerCase();

    // Start Chat with Agent - try navigation first, fallback to message
    if (buttonText.includes('start chat with')) {
      // Extract agent name from button text: "Start Chat with Newsletter Agent Multi" -> "newsletter agent multi"
      const chatMatch = buttonText.match(/start chat with (.+)/);
      if (chatMatch) {
        const agentName = chatMatch[1].trim();

        // Try to get agent ID for navigation
        const agentId = agentMappingService.getAgentId(agentName);

        if (agentId) {
          console.log(`🔗 Navigating to chat with agent: ${agentName} -> ${agentId}`);
          // Navigate to chat page
          window.location.href = `/chat/${agentId}`;
          return;
        } else {
          console.warn(`⚠️ No agent ID found for: "${agentName}", sending message to AI instead`);
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
      
      {/* Display interactive buttons */}
      {buttonOptions.length > 0 && (
        <div className="space-y-2 mt-4">
          {buttonOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleButtonClick(option)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left group"
            >
              <span className="text-lg flex-shrink-0">{option.emoji}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}