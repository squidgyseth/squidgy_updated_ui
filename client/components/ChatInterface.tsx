import { useState } from "react";
import { sendToSethAgent } from "../lib/n8nService";
import LinkDetectingTextArea from "./ui/LinkDetectingTextArea";

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  agentName?: string;
  agentDescription?: string;
  context?: string;
}

/**
 * Generate a unique user ID for demo purposes
 * In a real application, this would come from authentication
 */
const generateUserId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


export function ChatInterface({ 
  agentName = "Seth agent", 
  agentDescription = "Business Setup Assistant",
  context = "business_setup" 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: '👋 Hey, I\'m Seth, your AI assistant! I\'m here to help you set up your business details. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateUserId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleWebsiteAnalysis = async (url: string) => {
    try {
      // Show detailed analysis steps with realistic timing
      const steps = [
        { message: '🔍 Finding website...', delay: 500 },
        { message: '🌐 Accessing home page...', delay: 1500 },
        { message: '📄 Scanning page content...', delay: 2000 },
        { message: '🏗️ Analyzing site structure...', delay: 1200 },
        { message: '📸 Taking screenshot...', delay: 2500 },
        { message: '🎨 Capturing favicon...', delay: 800 },
        { message: '🔎 Extracting business information...', delay: 2000 },
        { message: '🧠 Processing with AI analysis...', delay: 3000 }
      ];

      // Add step messages with realistic delays
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, steps[i].delay));
        const stepMessage: Message = {
          type: 'bot',
          content: steps[i].message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, stepMessage]);
      }

      // Get user ID
      let userId = localStorage.getItem('dev_user_id') || localStorage.getItem('user_id');
      if (!userId) {
        userId = generateUserId();
      }

      // Force regenerate user ID if it's in old format
      if (userId && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        localStorage.removeItem('dev_user_id');
        localStorage.removeItem('squidgy_user_id');
        userId = generateUserId();
        localStorage.setItem('dev_user_id', userId);
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Call the real backend analysis (this will hit your actual backend)
      const response = await fetch('/api/website/full-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          user_id: userId,
          session_id: sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message
        const successMessage: Message = {
          type: 'bot',
          content: `✅ Analysis complete! I've analyzed ${formattedUrl} and extracted the business information. You can now review and edit the details in the form.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, successMessage]);

        // Trigger form update via custom event
        window.dispatchEvent(new CustomEvent('websiteAnalysisComplete', {
          detail: {
            url: formattedUrl,
            result: result
          }
        }));
      } else {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: `❌ Sorry, I couldn't analyze the website. ${error instanceof Error ? error.message : 'Please try again or enter the details manually.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if message contains a URL
      const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch && urlMatch[0]) {
        console.log('🔍 Website URL detected:', urlMatch[0]);
        
        // Show website analysis loading indicators
        const loadingMessage: Message = {
          type: 'bot',
          content: '🔍 I detected a website URL! Let me analyze it for you...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // Trigger website analysis
        await handleWebsiteAnalysis(urlMatch[0]);
        return;
      }

      // Get user ID from development auth or generate one
      let userId = localStorage.getItem('dev_user_id') || localStorage.getItem('user_id');
      if (!userId) {
        userId = generateUserId();
      }
      
      // Generate session ID based on context and timestamp
      const sessionId = `${userId}_PersonalAssistant_${Date.now()}`;
      
      // Use the updated N8N service with proper payload format
      const result = await sendToSethAgent(
        userId,
        messageContent,
        sessionId
      );

      // console.log('N8N Service result:', result);
      
      // Handle N8N response - check for various possible response formats
      if (result) {
        let botContent = null;
        
        // Check for different possible response properties
        if (result.agent_response) {
          botContent = result.agent_response;
        } else if (result.response) {
          botContent = result.response;
        } else if (result.message) {
          botContent = result.message;
        } else if (result.reply) {
          botContent = result.reply;
        } else if (result.text) {
          botContent = result.text;
        } else if (result.content) {
          botContent = result.content;
        } else if (result.output) {
          botContent = result.output;
        } else if (typeof result === 'string') {
          botContent = result;
        } else {
          // If no recognized response property, show a default message and log the structure
          console.log('N8N response structure:', Object.keys(result));
          botContent = 'I received your message and I\'m processing it. The response format is being configured.';
        }
        
        if (botContent) {
          const botMessage: Message = {
            type: 'bot',
            content: botContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        // No response from N8N
        const botMessage: Message = {
          type: 'bot',
          content: 'I\'m processing your request. Please make sure the N8N webhook is configured and running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('N8N service error:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: 'I\'m having trouble connecting right now. Please continue with the setup form, and I\'ll be back to help soon!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-96 bg-white border border-grey-700 rounded-modal h-[793px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-grey-700">
        <h3 className="text-2xl font-semibold text-text-primary text-center">Set up your AI agent</h3>
      </div>

      {/* Agent Header */}
      <div className="p-4 border-b border-grey-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
            <span className="text-white font-semibold">☀️</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">{agentName}</h4>
            <p className="text-text-subtle text-sm">{agentDescription}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-squidgy-purple" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.49969 15.0003L11.1515 8.34853C11.4485 8.05152 11.597 7.90301 11.7682 7.84737C11.9189 7.79842 12.0811 7.79842 12.2318 7.84737C12.403 7.90301 12.5515 8.05152 12.8485 8.34853L16.0539 11.5539M7.875 6.375C7.875 7.20343 7.20343 7.875 6.375 7.875C5.54657 7.875 4.875 7.20343 4.875 6.375C4.875 5.54657 5.54657 4.875 6.375 4.875C7.20343 4.875 7.875 5.54657 7.875 6.375ZM16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-squidgy-purple" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6.69853C16.5 6.24417 16.5 6.01699 16.4102 5.91179C16.3322 5.82051 16.2152 5.77207 16.0956 5.78149C15.9577 5.79234 15.797 5.95298 15.4757 6.27426L12.75 9L15.4757 11.7257C15.797 12.047 15.9577 12.2077 16.0956 12.2185C16.2152 12.2279 16.3322 12.1795 16.4102 12.0882C16.5 11.983 16.5 11.7558 16.5 11.3015V6.69853ZM1.5 7.35C1.5 6.08988 1.5 5.45982 1.74524 4.97852C1.96095 4.55516 2.30516 4.21095 2.72852 3.99524C3.20982 3.75 3.83988 3.75 5.1 3.75H9.15C10.4101 3.75 11.0402 3.75 11.5215 3.99524C11.9448 4.21095 12.289 4.55516 12.5048 4.97852C12.75 5.45982 12.75 6.08988 12.75 7.35V10.65C12.75 11.9101 12.75 12.5402 12.5048 13.0215C12.289 13.4448 11.9448 13.789 11.5215 14.0048C11.0402 14.25 10.4101 14.25 9.15 14.25H5.1C3.83988 14.25 3.20982 14.25 2.72852 14.0048C2.30516 13.789 1.96095 13.4448 1.74524 13.0215C1.5 12.5402 1.5 11.9101 1.5 10.65V7.35Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`${
              message.type === 'user' ? 'ml-8 flex flex-col items-end' : 'mr-8'
            }`}>
              <div className={`${
                message.type === 'user' 
                  ? 'bg-gray-100 rounded-xl p-3 max-w-[80%]' 
                  : 'bg-gray-50 rounded-lg p-3'
              }`}>
                <LinkDetectingTextArea 
                  content={message.content}
                  className="text-text-primary text-sm leading-relaxed whitespace-pre-line"
                />
              </div>
              <p className={`text-text-subtle text-xs mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-grey-700">
        <div className="flex items-center gap-2 border border-grey-500 rounded-xl p-2">
          <input 
            type="text"
            placeholder="Your message..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder-text-subtle text-sm"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="p-2 rounded-lg bg-squidgy-purple hover:bg-squidgy-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 16 16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.25 5.75L5.75 12.25M12.25 5.75L8.5 5.75M12.25 5.75L12.25 9.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
