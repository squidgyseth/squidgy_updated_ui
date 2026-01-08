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
    const options: ButtonOption[] = [];
    
    // Handle both formats: $$**TEXT**$$ (new) and $**TEXT**$ (old)
    const newFormatPattern = /\$\$\*\*([^*]+)\*\*\$\$/g;
    const oldFormatPattern = /\$\*\*([^*]+)\*\*\$/g;
    
    // Try new format first
    let match;
    while ((match = newFormatPattern.exec(text)) !== null) {
      const [fullMatch, buttonText] = match;
      
      // Avoid duplicates
      if (!options.find(o => o.text === buttonText.trim())) {
        options.push({
          emoji: '', // No emoji needed
          text: buttonText.trim(),
          description: '',
          fullText: fullMatch
        });
      }
    }
    
    // If no buttons found with new format, try old format
    if (options.length === 0) {
      while ((match = oldFormatPattern.exec(text)) !== null) {
        const [fullMatch, buttonText] = match;
        
        // Avoid duplicates
        if (!options.find(o => o.text === buttonText.trim())) {
          options.push({
            emoji: '', // No emoji needed
            text: buttonText.trim(),
            description: '',
            fullText: fullMatch
          });
        }
      }
    }
    
    console.log('🔍 InteractiveMessageButtons: Found button options:', options);
    return options;
  };

  // Remove button patterns from content to show clean text
  const cleanContent = (text: string): string => {
    // Remove both formats: $$**TEXT**$$ and $**TEXT**$
    let cleaned = text
      .replace(/\$\$\*\*[^*]+\*\*\$\$/g, '') // New format
      .replace(/\$\*\*[^*]+\*\*\$/g, ''); // Old format
    
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