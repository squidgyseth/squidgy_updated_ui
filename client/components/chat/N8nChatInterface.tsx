import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Paperclip, Mic } from 'lucide-react';
import type { N8nResponse, ChatMessage } from '../../types/n8n.types';
import AgentResponseHandler from './AgentResponseHandler';
import { sendToN8nWorkflow, generateRequestId, generateSessionId } from '../../lib/n8nService';
import { ChatHistoryService } from '../../services/chatHistoryService';

interface N8nChatInterfaceProps {
  agent: {
    id: string;
    name: string;
    avatar?: string;
    tagline?: string;
    introMessage?: string;
    suggestionButtons?: string[];
  };
  userId: string;
  sessionId?: string;
  className?: string;
  webhookUrl?: string; // Add webhook URL from agent config
}

export default function N8nChatInterface({
  agent,
  userId,
  sessionId: initialSessionId,
  className = '',
  webhookUrl
}: N8nChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(initialSessionId || generateSessionId(userId, agent.id));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryService = ChatHistoryService.getInstance();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add intro message on mount
  useEffect(() => {
    if (agent.introMessage) {
      setMessages([{
        id: generateRequestId(),
        content: agent.introMessage,
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [agent.introMessage]);

  // Helper function to save messages to database
  const saveMessageToHistory = async (
    message: string,
    sender: 'User' | 'Agent',
    timestamp?: Date
  ) => {
    try {
      await chatHistoryService.saveMessage({
        user_id: userId,
        session_id: sessionId,
        sender,
        message,
        timestamp: (timestamp || new Date()).toISOString(),
        agent_name: agent.name,
        agent_id: agent.id
      });
    } catch (error) {
      console.error('Error saving message to history:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateRequestId(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Save user message to database
    await saveMessageToHistory(message, 'User', userMessage.timestamp);

    try {
      // Send to n8n workflow with agent-specific webhook URL
      const response = await sendToN8nWorkflow(
        userId,
        message,
        agent.id,
        sessionId,
        userMessage.id,
        webhookUrl // Pass the webhook URL from agent config
      );

      if (response) {
        const agentMessage: ChatMessage = {
          id: response.request_id,
          content: response.agent_response,
          sender: 'agent',
          timestamp: new Date(response.timestamp_of_call_made),
          status: response.agent_status,
          isHtml: response.agent_status === 'Ready'
        };

        setMessages(prev => [...prev, agentMessage]);
        
        // Save agent response to database
        await saveMessageToHistory(
          response.agent_response, 
          'Agent', 
          new Date(response.timestamp_of_call_made)
        );
      } else {
        // Handle error case
        const errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
        setMessages(prev => [...prev, {
          id: generateRequestId(),
          content: errorMessage,
          sender: 'agent',
          timestamp: new Date()
        }]);
        
        // Save error message to database
        await saveMessageToHistory(errorMessage, 'Agent');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Failed to connect to the service. Please check your connection and try again.';
      setMessages(prev => [...prev, {
        id: generateRequestId(),
        content: errorMessage,
        sender: 'agent',
        timestamp: new Date()
      }]);
      
      // Save error message to database
      await saveMessageToHistory(errorMessage, 'Agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleAnswerQuestion = (answer: string) => {
    handleSendMessage(answer);
  };

  const handleAttachmentClick = () => {
    // TODO: Implement file attachment functionality
    console.log('Attachment button clicked');
  };

  const handleMicrophoneClick = () => {
    // TODO: Implement voice input functionality
    console.log('Microphone button clicked');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'agent' && (
                <div className="flex items-start gap-3 mb-2">
                  {agent.avatar && (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-600 font-medium">{agent.name}</span>
                </div>
              )}
              
              {message.sender === 'agent' && message.status ? (
                // Use AgentResponseHandler for agent messages with status
                <AgentResponseHandler
                  response={{
                    user_id: userId,
                    session_id: sessionId,
                    agent_name: agent.id,
                    timestamp_of_call_made: message.timestamp.toISOString(),
                    request_id: message.id,
                    agent_response: message.content,
                    agent_status: message.status
                  }}
                  onAnswerQuestion={handleAnswerQuestion}
                />
              ) : (
                // Regular message display
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
              
              <span className="text-xs text-gray-500 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-gray-600">Agent is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Buttons */}
      {agent.suggestionButtons && agent.suggestionButtons.length > 0 && messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {agent.suggestionButtons.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${agent.name}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-gray-800"
          />
          
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors flex items-center justify-center"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicrophoneClick}
            className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors flex items-center justify-center"
            title="Voice input"
          >
            <Mic size={20} />
          </button>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Send message"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}