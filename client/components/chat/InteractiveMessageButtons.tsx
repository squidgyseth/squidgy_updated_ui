import React from 'react';
import { googleCalendarService } from '../../lib/googleCalendar';
import { toast } from 'sonner';

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
  // Parse the content to find button patterns - flexible detection
  const parseButtonOptions = (text: string): ButtonOption[] => {
    console.log('🔍 InteractiveMessageButtons: Parsing content:', text);
    console.log('🔍 InteractiveMessageButtons: Content lines:', text.split('\n'));
    const options: ButtonOption[] = [];
    
    // Multiple patterns to catch various button formats:
    
    // Pattern 1: Optional "- " + emoji $$**Text**$$ - description (main format)
    const pattern1 = /^-?\s*(.{1,4})\s*\$\$\*\*([^*]+)\*\*\$\$\s*-\s*(.+)$/gmu;
    
    // Pattern 2: Optional "- " + emoji $$**Text**$$ (without description)
    const pattern2 = /^-?\s*(.{1,4})\s*\$\$\*\*([^*]+)\*\*\$\$\s*$/gmu;
    
    // Pattern 3: Handle single $ + $$**Text**$$ format (fallback for malformed buttons)
    const pattern3 = /^-?\s*(.{1,4})\s*\$\*\*([^*]+)\*\*\$\$\s*$/gmu;
    
    const patterns = [pattern1, pattern2, pattern3];
    
    patterns.forEach(pattern => {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, emoji, optionText, description] = match;
        
        // Check if this is likely an emoji (not just any character)
        const cleanEmoji = emoji.trim();
        if (cleanEmoji && !options.find(o => o.fullText === fullMatch.trim())) {
          options.push({
            emoji: cleanEmoji,
            text: optionText.trim(),
            description: description ? description.trim() : '',
            fullText: fullMatch.trim()
          });
        }
      }
    });
    
    console.log('🔍 InteractiveMessageButtons: Found button options:', options);
    return options;
  };

  // Remove button patterns from content to show clean text
  const cleanContent = (text: string, options: ButtonOption[]): string => {
    let cleaned = text;
    options.forEach(option => {
      cleaned = cleaned.replace(option.fullText, '');
    });
    
    // Clean up extra newlines and whitespace
    return cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ newlines with double
      .replace(/^\s+|\s+$/g, '') // Trim start/end whitespace
      .trim();
  };

  const buttonOptions = parseButtonOptions(content);
  const textContent = cleanContent(content, buttonOptions);
  
  console.log('🔍 InteractiveMessageButtons: Clean text content:', textContent);
  console.log('🔍 InteractiveMessageButtons: Button options count:', buttonOptions.length);

  const handleButtonClick = async (option: ButtonOption) => {
    // Check for special button types that need real functionality
    const buttonText = option.text.toLowerCase();
    
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
      {/* Display the cleaned text content */}
      {textContent && (
        <div className="whitespace-pre-wrap text-gray-800">
          {textContent}
        </div>
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