import React, { useState } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface AgentInfo {
  id: string;
  name: string;
  avatar?: string;
  tagline?: string;
  introMessage: string;
  suggestionButtons: string[];
}

interface CleanChatInterfaceProps {
  agent: AgentInfo;
  onSendMessage?: (message: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function CleanChatInterface({ 
  agent, 
  onSendMessage, 
  onSuggestionClick 
}: CleanChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: agent.introMessage,
      sender: 'agent',
      timestamp: new Date()
    }
  ]);

  const handleSend = () => {
    if (message.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      onSendMessage?.(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick?.(suggestion);
    // Optionally auto-send the suggestion
    const userMessage: Message = {
      id: Date.now().toString(),
      content: suggestion,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-2xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {msg.sender === 'agent' && (
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
              <div className={`px-4 py-2 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className={`text-xs mt-1 block ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {/* Message Input */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent.name}...`}
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                <Paperclip size={16} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                <Mic size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`p-2.5 rounded-full transition ${
              message.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap gap-2">
          {agent.suggestionButtons.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}