import React, { useState } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';
import { createProxyUrl } from '../../utils/urlMasking';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import StreamingChatMessage from './StreamingChatMessage';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'demo_stream' | 'regular';
  isStreaming?: boolean;
}

interface AgentInfo {
  name: string;
  avatar?: string;
  tagline?: string;
  introMessage?: string;
}

interface CleanChatInterfaceProps {
  agent: AgentInfo;
  suggestions?: string[];
  onSendMessage?: (message: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

import { useEffect, useRef } from 'react';

export default function CleanChatInterface({
  agent,
  suggestions = [],
  onSendMessage,
  onSuggestionClick
}: CleanChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    const initialMessages: Message[] = [];

    // Add demo message ONLY with ?demo=1 flag
    const isDemoMode = new URLSearchParams(window.location.search).has('demo');
    if (isDemoMode) {
      initialMessages.push({
        id: 'demo-streaming-msg',
        content: '',
        sender: 'agent',
        type: 'demo_stream',
        timestamp: new Date()
      });
    }

    if (agent.introMessage) {
      initialMessages.push({
        id: '1',
        content: agent.introMessage,
        sender: 'agent',
        timestamp: new Date()
      });
    }

    return initialMessages;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced auto-scroll for streaming content using ResizeObserver
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const isAnyMessageStreaming = messages.some(m => m.isStreaming);
      if (isAnyMessageStreaming) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    });

    const scrollContent = scrollAreaRef.current.firstElementChild;
    if (scrollContent) {
      resizeObserver.observe(scrollContent);
    }

    return () => resizeObserver.disconnect();
  }, [messages]);

  const handleStreamComplete = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isStreaming: false } : msg
    ));
  };

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
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-2xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {msg.sender === 'agent' && (
                  <img
                    src={agent.avatar ? createProxyUrl(agent.avatar, 'avatar') : agent.avatar}
                    alt={agent.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                {msg.type === 'demo_stream' ? (
                  <div className="flex-1">
                    <StreamingChatMessage />
                    <span className="text-xs mt-1 block text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ) : (
                  <div className={`px-4 py-2 rounded-lg ${msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}>
                    <LinkDetectingTextArea
                      content={msg.content}
                      className="text-sm leading-relaxed"
                      shouldStream={msg.isStreaming}
                      onStreamComplete={() => handleStreamComplete(msg.id)}
                    />
                    <span className={`text-xs mt-1 block ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
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
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-squidgy-primary focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button className="p-1.5 text-squidgy-primary hover:text-squidgy-primary/80 rounded-full hover:bg-squidgy-primary/10 transition">
                <Paperclip size={16} />
              </button>
              <button className="p-1.5 text-squidgy-primary hover:text-squidgy-primary/80 rounded-full hover:bg-squidgy-primary/10 transition">
                <Mic size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`p-2.5 rounded-full transition ${message.trim()
              ? 'bg-squidgy-primary text-white hover:bg-squidgy-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 text-sm bg-squidgy-primary/10 text-squidgy-primary rounded-full hover:bg-squidgy-primary/20 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
