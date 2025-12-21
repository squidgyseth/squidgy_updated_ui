import React from 'react';

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
    const options: ButtonOption[] = [];
    
    // Multiple patterns to catch various button formats:
    
    // Pattern 1: emoji **Text** - description (main format)
    const pattern1 = /^(.{1,4})\s*\*\*([^*]+)\*\*\s*-\s*(.+)$/gmu;
    
    // Pattern 2: emoji **Text** (without description)
    const pattern2 = /^(.{1,4})\s*\*\*([^*]+)\*\*\s*$/gmu;
    
    const patterns = [pattern1, pattern2];
    
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

  const handleButtonClick = (option: ButtonOption) => {
    // Send the option text directly - let the assistant handle the context
    // This is more flexible and works with various conversation flows
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