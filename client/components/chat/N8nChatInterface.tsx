import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Paperclip, Mic } from 'lucide-react';
import type { N8nResponse, ChatMessage } from '../../types/n8n.types';
import AgentResponseHandler from './AgentResponseHandler';
import FileMessage from './FileMessage';
import { sendToN8nWorkflow, generateRequestId, generateSessionId } from '../../lib/n8nService';
import { ChatHistoryService } from '../../services/chatHistoryService';
import { FileUploadService } from '../../services/fileUploadService';
import { chatSessionService } from '../../services/chatSessionService';
import { supabase } from '../../lib/supabase';
import { createProxyUrl } from '../../utils/urlMasking';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import NewsletterSelector from './NewsletterSelector';
import InteractiveMessageButtons from './InteractiveMessageButtons';
import { googleCalendarService } from '../../lib/googleCalendar';
import { toast } from 'sonner';

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
  showAddNewMessage?: boolean; // Flag to show Add Another Assistant message
}

export default function N8nChatInterface({
  agent,
  userId,
  sessionId: initialSessionId,
  className = '',
  webhookUrl,
  showAddNewMessage = false
}: N8nChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(initialSessionId || generateSessionId(userId, agent.id));
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; status: string }>>(new Map());
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [showNewsletterSelector, setShowNewsletterSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryService = ChatHistoryService.getInstance();
  const fileUploadService = FileUploadService.getInstance();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages for the current session
  useEffect(() => {
    console.log(`📨 N8nChatInterface: sessionId changed to: ${sessionId}`);
    console.log(`📨 N8nChatInterface: agentId: ${agent.id}, userId: ${userId}`);
    loadSessionMessages();
  }, [sessionId]);

  // Set input text when showAddNewMessage is true
  useEffect(() => {
    if (showAddNewMessage) {
      setInputValue("➕ Add Another Assistant");
    }
  }, [showAddNewMessage]);

  // Show newsletter selector for content_repurposer and handle OAuth callback
  useEffect(() => {
    // Show newsletter selector for content_repurposer agent
    if (agent.id === 'content_repurposer') {
      setShowNewsletterSelector(true);
    }
    
    // Handle Google Calendar OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'google_calendar_auth') {
      handleCalendarAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [agent.id]);

  const loadSessionMessages = async () => {
    console.log(`🔍 loadSessionMessages called with sessionId: ${sessionId}`);
    if (!sessionId) {
      console.log('❌ No sessionId provided, returning early');
      return;
    }

    try {
      console.log(`🔄 Fetching messages for session: ${sessionId}`);
      // Load existing messages for this session
      const existingMessages = await chatSessionService.getSessionMessages(sessionId);
      console.log(`📊 Found ${existingMessages.length} existing messages`);
      
      if (existingMessages.length > 0) {
        // Convert database messages to ChatMessage format
        const chatMessages: ChatMessage[] = existingMessages.map(msg => ({
          id: msg.id,
          content: msg.message,
          sender: msg.sender.toLowerCase() as 'user' | 'agent',
          timestamp: new Date(msg.timestamp)
        }));
        
        console.log(`✅ Setting ${chatMessages.length} messages in state`);
        setMessages(chatMessages);
        console.log(`✅ Loaded ${chatMessages.length} messages for session ${sessionId}`);
      } else {
        console.log(`📝 No existing messages, showing intro message (not saving to DB)`);
        // New session - show intro message in UI but DON'T save to database
        if (agent.introMessage) {
          const introMessage: ChatMessage = {
            id: generateRequestId(),
            content: agent.introMessage,
            sender: 'agent',
            timestamp: new Date()
          };
          setMessages([introMessage]);
          // NOTE: Not saving intro message to database - only save real conversations
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading session messages:', error);
      // Fallback to intro message for new sessions (but don't save to DB)
      if (agent.introMessage) {
        setMessages([{
          id: generateRequestId(),
          content: agent.introMessage,
          sender: 'agent',
          timestamp: new Date()
        }]);
      } else {
        setMessages([]);
      }
    }
  };

  // Handle Google Calendar OAuth callback
  const handleCalendarAuthCallback = async (code: string) => {
    try {
      const success = await googleCalendarService.handleAuthCallback(code);
      if (success) {
        toast.success('Successfully connected to Google Calendar!');
        // Add a message to the chat about successful connection
        const successMessage: ChatMessage = {
          id: generateRequestId(),
          content: '✅ Google Calendar connected successfully! Your assistant can now manage your schedule, create meetings, and check availability.',
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        toast.error('Failed to connect to Google Calendar');
        const errorMessage: ChatMessage = {
          id: generateRequestId(),
          content: '❌ Failed to connect to Google Calendar. Please try again.',
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Calendar auth callback error:', error);
      toast.error('Failed to connect to Google Calendar');
      const errorMessage: ChatMessage = {
        id: generateRequestId(),
        content: '❌ There was an error connecting to Google Calendar. Please try again.',
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Helper function to save messages to database
  const saveMessageToHistory = async (
    message: string,
    sender: 'User' | 'Agent',
    timestamp?: Date,
    agentStatus?: string
  ) => {
    try {
      const savedRecord = await chatHistoryService.saveMessage({
        user_id: userId,
        session_id: sessionId,
        sender,
        message,
        timestamp: (timestamp || new Date()).toISOString(),
        agent_name: agent.name,
        agent_id: agent.id,
        agent_status: agentStatus
      });
      return savedRecord;
    } catch (error) {
      console.error('Error saving message to history:', error);
      return null;
    }
  };

  const handleSendMessage = async (message: string, fileUrl?: string, fileName?: string) => {
    if (!message.trim() || isLoading) return;

    // For content_repurposer agent, enforce newsletter selection
    if (agent.id === 'content_repurposer' && !selectedNewsletterId) {
      alert('📰 Please select a newsletter from the dropdown above before sending a message.');
      return;
    }

    // If there's a file URL, include it in the message content
    const messageContent = fileUrl ? `${message}\n\nFile: ${fileName}\nURL: ${fileUrl}` : message;

    const messageId = generateRequestId();
    const userMessage: ChatMessage = {
      id: messageId,
      content: message,
      sender: 'user',
      timestamp: new Date(),
      fileUpload: fileUrl ? {
        fileName: fileName || 'file',
        fileUrl,
        fileId: `file_${messageId}`, // Use message ID with prefix to ensure uniqueness
        status: 'completed',
        agentId: agent.id,
        agentName: agent.name
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Save user message to database (with file info if present)
    await saveMessageToHistory(messageContent, 'User', userMessage.timestamp);

    try {
      // Send to n8n workflow with agent-specific webhook URL and newsletter_id if applicable
      const response = await sendToN8nWorkflow(
        userId,
        messageContent, // Send the full message content including file info
        agent.id,
        sessionId,
        userMessage.id,
        webhookUrl, // Pass the webhook URL from agent config
        agent.id === 'content_repurposer' ? selectedNewsletterId || undefined : undefined // Include newsletter_id for content_repurposer
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

        // Save agent response to database and get back the saved record
        const savedRecord = await saveMessageToHistory(
          response.agent_response, 
          'Agent', 
          new Date(response.timestamp_of_call_made),
          response.agent_status  // Pass agent_status
        );

        // Update agentMessage with content_repurposer_history_id if available
        if (savedRecord?.content_repurposer_history_id) {
          agentMessage.content_repurposer_history_id = savedRecord.content_repurposer_history_id;
        }

        setMessages(prev => [...prev, agentMessage]);
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

  const handleButtonClick = (text: string) => {
    handleSendMessage(text);
  };

  // Helper function to detect if message contains interactive buttons
  const hasInteractiveButtons = (content: string): boolean => {
    // Look for the flexible button patterns
    const pattern1 = /^(.{1,4})\s*\*\*([^*]+)\*\*\s*-\s*(.+)$/gmu;
    const pattern2 = /^(.{1,4})\s*\*\*([^*]+)\*\*\s*$/gmu;
    
    return pattern1.test(content) || pattern2.test(content);
  };

  const handleAttachmentClick = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.txt,.docx';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, TXT, and DOCX files are supported');
        return;
      }
      
      try {
        await uploadFileToSupabase(file);
      } catch (error) {
        console.error('File upload error:', error);
        console.error('Full error object:', error);
        alert(`Failed to upload file. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  const uploadFileToSupabase = async (file: File) => {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}_${file.name}`;
      
      console.log('Uploading file to Supabase...', fileName);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      
      // Step 1: Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('newsletter')
        .upload(fileName, file);
      
      if (error) {
        console.error('Supabase upload error:', error);
        console.error('Error details:', { message: error.message, statusCode: error.statusCode });
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      console.log('File uploaded successfully:', data);
    
    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from('newsletter')
      .getPublicUrl(data.path);
    
    const fileUrl = urlData.publicUrl;
    console.log('File URL:', fileUrl);
    
      // Step 3: Call backend processing endpoint
      await callBackendProcessing(file.name, fileUrl);
    } catch (error) {
      console.error('Error in uploadFileToSupabase:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  const callBackendProcessing = async (fileName: string, fileUrl: string) => {
    try {
      const formData = new FormData();
      formData.append('firm_user_id', userId);
      formData.append('file_name', fileName);
      formData.append('file_url', fileUrl);
      formData.append('agent_id', agent.id);
      formData.append('agent_name', agent.name);
      
      console.log('Calling backend processing...', {
        firm_user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        agent_id: agent.id,
        agent_name: agent.name
      });
      
      // Use the backend URL from environment variables, default to localhost for development
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/file/process`, {
        method: 'POST',
        body: formData
      });
      
      console.log('Backend response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend processing failed: ${response.statusText} - ${errorText}`);
      }
    
    const result = await response.json();
    console.log('Backend response:', result);
    
    // Track the file upload for status monitoring
    const fileId = result.data?.file_id;
    if (fileId) {
      setUploadingFiles(prev => new Map(prev.set(fileId, { name: fileName, status: 'processing' })));
      
      // Start monitoring file status
      monitorFileStatus(fileId, fileName);
    }
    
      // Automatically send a message with the file URL
      await handleSendMessage(`I've uploaded a file: ${fileName}`, fileUrl, fileName);
    } catch (error) {
      console.error('Error in callBackendProcessing:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  const monitorFileStatus = async (fileId: string, fileName: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Monitor for 5 minutes (30 attempts * 10 seconds)
    
    const checkStatus = async () => {
      try {
        const file = await fileUploadService.getFileStatus(fileId);
        
        if (file) {
          // Update the file message status
          setMessages(prev => prev.map(msg => {
            if (msg.fileUpload?.fileId === fileId) {
              return {
                ...msg,
                fileUpload: {
                  ...msg.fileUpload,
                  status: file.processing_status,
                  extractedText: file.extracted_text,
                  errorMessage: file.error_message
                }
              };
            }
            return msg;
          }));
          
          if (file.processing_status === 'completed') {
            // Show completion message
            const completionMessage: ChatMessage = {
              id: generateRequestId(),
              content: `🎉 File "${fileName}" has been processed successfully! Click to preview the extracted text.`,
              sender: 'agent',
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, completionMessage]);
            await saveMessageToHistory(completionMessage.content, 'Agent', completionMessage.timestamp);
            
            // Remove from monitoring
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
            return;
          } else if (file.processing_status === 'failed') {
            // Show error message
            const errorMessage: ChatMessage = {
              id: generateRequestId(),
              content: `❌ File "${fileName}" processing failed: ${file.error_message || 'Unknown error'}`,
              sender: 'agent',
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
            await saveMessageToHistory(errorMessage.content, 'Agent', errorMessage.timestamp);
            
            // Remove from monitoring
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
            return;
          }
        }
        
        // Continue monitoring if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          // Timeout - remove from monitoring
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
        }
      } catch (error) {
        console.error('Error checking file status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      }
    };
    
    // Start monitoring after 5 seconds
    setTimeout(checkStatus, 5000);
  };

  const handleMicrophoneClick = () => {
    // TODO: Implement voice input functionality
    console.log('Microphone button clicked');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Newsletter Selector for content_repurposer agent */}
      {showNewsletterSelector && agent.id === 'content_repurposer' && (
        <div className="p-4 border-b">
          <NewsletterSelector
            onNewsletterSelect={(newsletterId) => {
              setSelectedNewsletterId(newsletterId);
              if (newsletterId) {
                console.log('Newsletter selected:', newsletterId);
              }
            }}
            selectedNewsletterId={selectedNewsletterId}
          />
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'agent' ? (
                <div className="flex items-start gap-3">
                  {agent.avatar && (
                    <img
                      src={agent.avatar ? createProxyUrl(agent.avatar, 'avatar') : agent.avatar}
                      alt={agent.name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    {message.status ? (
                      // Use AgentResponseHandler for agent messages with status
                      <AgentResponseHandler
                        response={{
                          user_id: userId,
                          session_id: sessionId,
                          agent_name: agent.id,
                          timestamp_of_call_made: message.timestamp.toISOString(),
                          request_id: message.content_repurposer_history_id || message.id,
                          agent_response: message.content,
                          agent_status: message.status
                        }}
                        onAnswerQuestion={handleAnswerQuestion}
                      />
                    ) : (
                      // Regular message display with interactive buttons support
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        {hasInteractiveButtons(message.content) ? (
                          <InteractiveMessageButtons
                            content={message.content}
                            onButtonClick={handleButtonClick}
                          />
                        ) : (
                          <LinkDetectingTextArea 
                            content={message.content}
                            className="text-text-primary whitespace-pre-wrap"
                          />
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-500 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                // User message display
                <div>
                  {message.fileUpload ? (
                    // File upload message
                    <FileMessage 
                      fileInfo={message.fileUpload} 
                      timestamp={message.timestamp}
                    />
                  ) : (
                    // Regular text message
                    <>
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              )}
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

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-3 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${agent.name}...`}
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-gray-800 resize-none min-h-[48px] max-h-[120px] overflow-y-auto"
            style={{
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  handleSendMessage(inputValue);
                }
              }
            }}
          />
          
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-xl transition-colors flex items-center justify-center"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicrophoneClick}
            className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-xl transition-colors flex items-center justify-center"
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

      {/* Suggestion Buttons - Below Input Area */}
      {agent.suggestionButtons && agent.suggestionButtons.length > 0 && messages.length <= 1 && (
        <div className="px-4 pb-4">
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
    </div>
  );
}