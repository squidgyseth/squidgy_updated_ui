import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Paperclip, Mic } from 'lucide-react';
import type { N8nResponse, ChatMessage } from '../../types/n8n.types';
import StreamingAgentMessage from './StreamingAgentMessage';
import HTMLPreview from './HTMLPreview';
import SocialMediaPreview from './SocialMediaPreview';
import EnableContentRepurposerButton from './EnableContentRepurposerButton';
import FileMessage from './FileMessage';
import ChatMessageBubble from './ChatMessageBubble';
import { sendToN8nWorkflowStreaming, generateRequestId, generateSessionId } from '../../lib/n8nService';
import { ChatHistoryService } from '../../services/chatHistoryService';
import { FileUploadService } from '../../services/fileUploadService';
import { chatSessionService } from '../../services/chatSessionService';
import { conversationStateService } from '../../services/conversationStateService';
import { supabase } from '../../lib/supabase';
import { createProxyUrl, maskStorageUrlsInText } from '../../utils/urlMasking';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import NewsletterSelector from './NewsletterSelector';
import InteractiveMessageButtons from './InteractiveMessageButtons';
import { googleCalendarService } from '../../lib/googleCalendar';
import { toast } from 'sonner';
import { useThinkingMessage } from '../../hooks/useThinkingMessage';
import { getBackendUrl } from '@/lib/envConfig';

interface N8nChatInterfaceProps {
  agent: {
    id: string;
    name: string;
    avatar?: string;
    tagline?: string;
    introMessage?: string;
    suggestionButtons?: string[];
    uses_conversation_state?: boolean;  // From agent YAML config - enables multi-turn state persistence
  };
  userId: string;
  sessionId?: string;
  className?: string;
  webhookUrl?: string; // Add webhook URL from agent config
  showAddNewMessage?: boolean; // Flag to show Add Another Assistant message
  addNewTimestamp?: number; // Timestamp to force re-trigger on every click
  onMessageSent?: () => void; // Callback when a message is sent (for live Recent Actions update)
}

export default function N8nChatInterface({
  agent,
  userId,
  sessionId: initialSessionId,
  className = '',
  webhookUrl,
  showAddNewMessage = false,
  addNewTimestamp,
  onMessageSent
}: N8nChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Use sessionId from prop directly - parent manages session persistence
  // Fall back to generating new session only if parent doesn't provide one
  const sessionId = initialSessionId || generateSessionId(userId, agent.id);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; status: string }>>(new Map());
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [showNewsletterSelector, setShowNewsletterSelector] = useState(false);
  const [existingHistoryId, setExistingHistoryId] = useState<string | null>(null);
  const [activeInteractiveButtons, setActiveInteractiveButtons] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<Record<string, unknown> | undefined>(undefined); // State for multi-turn agents like newsletter_multi
  const conversationStateRef = useRef<Record<string, unknown> | undefined>(undefined); // Ref to always have latest state for closures
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentSessionRef = useRef<string>(sessionId); // Track current session to prevent stale updates
  const chatHistoryService = ChatHistoryService.getInstance();
  const fileUploadService = FileUploadService.getInstance();
  const thinkingMessage = useThinkingMessage(); // Get rotating thinking message

  // Utility: detect and extract file info embedded in stored message text
  const parseEmbeddedFileInfo = (message: string) => {
    const fileNameMatch = message.match(/File:\s*([^\r\n]+)/);
    // Support both "URL: https://..." and "URL:\nhttps://..." formats (CRLF or LF)
    const fileUrlMatch =
      message.match(/URL:\s*(https?:\/\/\S+)/m) ||
      message.match(/URL:\s*(?:\r?\n)+\s*(https?:\/\/\S+)/m);

    if (fileUrlMatch && fileNameMatch) {
      const fileUrl = (fileUrlMatch[1] || fileUrlMatch[0]).toString().replace(/^URL:\s*/i, '').trim();

      // Strip everything from the first "File:" block onward (handles 1+ newlines and CRLF)
      const parts = message.split(/(?:\r?\n)+File:\s*/);
      return {
        hasFile: true,
        fileName: fileNameMatch[1].trim(),
        fileUrl,
        messageText: parts[0].trim()
      };
    }

    return {
      hasFile: false,
      messageText: message
    };
  };

  // Auto-scroll to bottom when new messages arrive and focus input
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Auto-focus input after messages update (new message sent or response received)
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  // Load messages for the current session
  useEffect(() => {

    // Update ref to track current session
    currentSessionRef.current = sessionId;

    // Clear existing messages immediately when session changes
    setMessages([]);

    loadSessionMessages(sessionId);

    // Load conversation state from database for multi-turn agents
    if (isMultiTurnAgent()) {
      loadConversationState();
    }
  }, [sessionId]);

  // Check if agent supports multi-turn conversation state
  // Configured via uses_conversation_state: true in agent YAML config
  const isMultiTurnAgent = (): boolean => {
    return agent.uses_conversation_state === true;
  };

  // Load conversation state from database
  const loadConversationState = async () => {
    try {
      const state = await conversationStateService.getState(sessionId, agent.id);
      if (state) {
        setConversationState(state);
        conversationStateRef.current = state;
      } else {
        setConversationState(undefined);
        conversationStateRef.current = undefined;
      }
    } catch (error) {
      console.error('❌ Error loading conversation state:', error);
    }
  };

  // Set input text when showAddNewMessage is true (timestamp forces re-trigger on every click)
  useEffect(() => {
    if (showAddNewMessage) {
      setInputValue("➕ Add Another Assistant");
    }
  }, [showAddNewMessage, addNewTimestamp]);

  // Show newsletter selector for content_repurposer and handle OAuth callback
  useEffect(() => {
    // Show newsletter selector for content_repurposer agent (and content_repurposer_multi)
    if (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') {
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

  // Separate useEffect for handling pre-filled message (runs only once on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preFilledMessage = urlParams.get('message');
    
    if (preFilledMessage) {
      setInputValue(decodeURIComponent(preFilledMessage));
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []); // Empty dependency array - runs only once on mount

  // Load existing history ID for content_repurposer agent
  useEffect(() => {
    if ((agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && userId) {
      loadExistingHistoryId();
    }
  }, [agent.id, userId]);

  const loadExistingHistoryId = async () => {
    try {
      const { data, error } = await supabase
        .from('history_content_repurposer')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setExistingHistoryId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading existing history ID:', error);
    }
  };

  const getExistingHistoryId = () => existingHistoryId;

  // Get appropriate intro message based on onboarding status
  const getIntroMessage = async (): Promise<string> => {
    // Only check for Personal Assistant
    if (agent.id !== 'personal_assistant') {
      return agent.introMessage || '';
    }

    try {
      // Check if user has completed onboarding (website_analysis exists)
      const { data, error } = await supabase
        .from('website_analysis')
        .select('website_url')
        .eq('firm_user_id', userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        // User has completed onboarding
        return "Hey! I see you've already completed your setup. Great to have you back! 🎉\n\nWhat would you like help with today? I can:\n• Set up another AI agent\n• Update your existing configuration\n• Help with specific tasks\n\nJust let me know!";
      } else {
        // New user - show onboarding intro
        return agent.introMessage || '';
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return agent.introMessage || '';
    }
  };

  const loadSessionMessages = async (targetSessionId: string) => {
    if (!targetSessionId) {
      return;
    }

    try {
      // Load existing messages for this session
      const existingMessages = await chatSessionService.getSessionMessages(targetSessionId);

      // Check if session changed while fetching - prevent stale data
      if (currentSessionRef.current !== targetSessionId) {
        return;
      }

      if (existingMessages.length > 0) {
        // Safe date parsing helper
        const safeParseDate = (ts: string | undefined): Date => {
          if (!ts) return new Date();
          const parsed = new Date(ts);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };

        // Convert database messages to ChatMessage format
        const chatMessages: ChatMessage[] = existingMessages.map(msg => {
          // Use file metadata from database fields if available
          const hasFile = !!(msg.file_url && msg.file_name);

          return {
            id: msg.id,
            content: msg.message,
            sender: msg.sender.toLowerCase() as 'user' | 'agent',
            timestamp: safeParseDate(msg.timestamp),
            status: undefined, // No streaming for loaded messages - only stream new messages
            fileUpload: hasFile
              ? {
                  fileName: msg.file_name!,
                  fileUrl: msg.file_url!,
                  fileId: `file_${msg.id}`,
                  status: 'completed',
                  agentId: agent.id,
                  agentName: agent.name
                }
              : undefined
          };
        });

        // Get context-aware intro message
        const introText = await getIntroMessage();

        // Get first message timestamp safely
        const firstMsgTime = safeParseDate(existingMessages[0].timestamp).getTime();

        // Always prepend the intro message to existing messages
        const messagesWithIntro = introText
          ? [
              {
                id: `intro_${targetSessionId}`,
                content: introText,
                sender: 'agent' as const,
                timestamp: new Date(firstMsgTime - 1000), // 1 second before first message
                status: undefined // No streaming for loaded sessions - only stream new messages
              },
              ...chatMessages
            ]
          : chatMessages;

        // Final check before setting state
        if (currentSessionRef.current === targetSessionId) {
          setMessages(messagesWithIntro);
        }
      } else {
        // New session - get context-aware intro message
        const introText = await getIntroMessage();

        // Check if session changed while getting intro
        if (currentSessionRef.current !== targetSessionId) {
          return;
        }

        if (introText) {
          const introMessage: ChatMessage = {
            id: generateRequestId(),
            content: introText,
            sender: 'agent',
            timestamp: new Date(),
            status: 'Ready' // Enable streaming for intro message
          };
          setMessages([introMessage]);
          // NOTE: Not saving intro message to database - only save real conversations
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading session messages:', error);
      
      // Check if session changed during error handling
      if (currentSessionRef.current !== targetSessionId) {
        return;
      }
      
      // Fallback to default intro message for new sessions (but don't save to DB)
      const introText = await getIntroMessage();
      if (introText) {
        setMessages([{
          id: generateRequestId(),
          content: introText,
          sender: 'agent',
          timestamp: new Date(),
          status: 'Ready' // Enable streaming for intro message
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
          timestamp: new Date(),
          status: 'Ready' // Enable streaming
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        toast.error('Failed to connect to Google Calendar');
        const errorMessage: ChatMessage = {
          id: generateRequestId(),
          content: '❌ Failed to connect to Google Calendar. Please try again.',
          sender: 'agent',
          status: 'Ready',
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
    agentStatus?: string,
    executionId?: string | number,
    workflowId?: string,
    fileUrl?: string,
    fileName?: string
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
        agent_status: agentStatus,
        execution_id: executionId,
        workflow_id: workflowId,
        file_url: fileUrl,
        file_name: fileName
      });
      return savedRecord;
    } catch (error) {
      console.error('Error saving message to history:', error);
      return null;
    }
  };

  const handleSendMessage = async (message: string, fileUrl?: string, fileName?: string, agentMessage?: string) => {
    if (!message.trim() || isLoading) return;

    // For content_repurposer agent (and content_repurposer_multi), enforce newsletter selection
    if ((agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && !selectedNewsletterId) {
      alert('📰 Please select a newsletter from the dropdown above before sending a message.');
      return;
    }

    // If agentMessage is provided, use it for the agent; otherwise use the user message
    // For file uploads: user sees simple message + file frame, agent gets detailed KB instruction
    const messageContent = agentMessage || message;

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
    // Save only the user-visible message, not the agent instruction
    await saveMessageToHistory(message, 'User', userMessage.timestamp, undefined, undefined, undefined, fileUrl, fileName);

    try {
      // Reset streaming text
      setStreamingText('');
      
      // Create a temporary streaming message ID
      const streamingMessageId = `streaming_${generateRequestId()}`;
      
      // Add temporary streaming message to UI
      const tempStreamingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '',
        sender: 'agent',
        timestamp: new Date(),
        status: 'Ready' // Enable streaming display
      };
      setMessages(prev => [...prev, tempStreamingMessage]);
      
      // Send to n8n workflow with streaming updates
      const currentState = conversationStateRef.current;
      console.log('🔵 BRANDY DEBUG: Sending message with state:', JSON.stringify(currentState));
      console.log('🔵 BRANDY DEBUG: conversationState useState:', JSON.stringify(conversationState));
      const response = await sendToN8nWorkflowStreaming(
        userId,
        messageContent, // Send the full message content including file info
        agent.id,
        (text) => {
          // Update the temporary streaming message in real-time
          setStreamingText(text);
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: text }
              : msg
          ));
        }, // Callback for streaming updates
        sessionId,
        userMessage.id,
        webhookUrl, // Pass the webhook URL from agent config
        (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') ? selectedNewsletterId || undefined : undefined, // Include newsletter_id for content_repurposer
        currentState // Use ref for latest state (avoids stale closure issue)
      );

      if (response) {
        // NEW: Handle redirect responses from Master Agent (legacy routing field)
        if (response.routing?.should_redirect && response.routing?.target_url) {

          // Show the redirect message first
          const redirectMessage: ChatMessage = {
            id: response.request_id || generateRequestId(),
            content: response.agent_response || `Redirecting you to ${response.routing.target_agent}...`,
            sender: 'agent',
            timestamp: new Date(),
            status: 'Ready' // Enable streaming
          };
          setMessages(prev => [...prev, redirectMessage]);

          // Save redirect message to history
          await saveMessageToHistory(redirectMessage.content, 'Agent', redirectMessage.timestamp);

          // Redirect after a short delay to let user see the message
          setTimeout(() => {
            window.location.href = response.routing.target_url;
          }, 1500);

          setIsLoading(false);
          return; // Exit early - redirect will handle the rest
        }

        // NEW: Process actions_todo - Generic action handler
        if (response.actions_todo && response.actions_todo.length > 0) {

          // Process each action in order
          for (const action of response.actions_todo) {
            const actionType = action.action;
            const metadata = action.metadata || {};


            // Handle different action types
            switch (actionType) {
              case 'user_routed':
                // User routing - redirect to another agent chat
                if (metadata.target_url) {

                  // Show the redirect message first
                  const redirectMessage: ChatMessage = {
                    id: response.request_id || generateRequestId(),
                    content: response.agent_response || `Redirecting you to ${metadata.target_agent}...`,
                    sender: 'agent',
                    timestamp: new Date(),
                    status: 'Ready' // Enable streaming
                  };
                  setMessages(prev => [...prev, redirectMessage]);

                  // Save redirect message to history
                  await saveMessageToHistory(redirectMessage.content, 'Agent', redirectMessage.timestamp);

                  // Redirect after a short delay to let user see the message
                  setTimeout(() => {
                    window.location.href = metadata.target_url;
                  }, 1500);

                  setIsLoading(false);
                  return; // Exit early - redirect will handle the rest
                }
                break;

              case 'agent_enabled':
                // Agent enablement - refresh sidebar to show new agent

                // Refresh sidebar to show newly enabled agent
                if ((window as any).refreshAgentSidebar) {
                  (window as any).refreshAgentSidebar();
                } else {
                }

                // Show success notification
                const agentName = metadata.agent_name || 'Agent';
                if ((window as any).showToast) {
                  (window as any).showToast(`✅ ${agentName} enabled and ready!`, 'success');
                }

                // Don't return - let the response continue to be processed
                break;

              case 'show_preview':
                // Show preview - metadata might contain preview_url, preview_type, etc.
                // Future: Handle preview display
                break;

              case 'awaiting_selection':
                // Waiting for user input - no action needed, just log
                break;

              case 'refresh_agent_list':
                // Refresh agent list - future implementation
                // Future: Trigger agent list refresh in sidebar
                break;

              default:
                // Unknown action - log for debugging
                break;
            }
          }
        }

        // Store conversation state for multi-turn agents (like newsletter_multi)
        console.log('🟢 BRANDY DEBUG: Response state:', JSON.stringify(response.state));
        console.log('🟢 BRANDY DEBUG: isMultiTurnAgent:', isMultiTurnAgent());
        if (response.state && isMultiTurnAgent()) {
          console.log('🟢 BRANDY DEBUG: SAVING state to ref and useState');
          setConversationState(response.state);
          conversationStateRef.current = response.state; // Update ref immediately for next message closure

          // Persist state to database for multi-turn agents
          try {
            // First ensure the state record exists (create if needed)
            await conversationStateService.getOrCreateState(sessionId, agent.id, userId);
            // Then update with the new state
            const status = response.agent_status === 'Ready' ? 'completed' : 'active';
            await conversationStateService.updateState(
              sessionId,
              agent.id,
              response.state,
              status as 'active' | 'completed' | 'abandoned'
            );
          } catch (stateError) {
            console.error('❌ Error saving conversation state to database:', stateError);
          }
        }

        // Parse response to handle structured JSON format
        let displayMessage = response.agent_response || response.response || 'I received your message but encountered an issue processing the response.';
        
        // Extract only the final response - n8n concatenates streaming "thinking" text with final response
        // Find the LAST occurrence of '...' and extract everything after it
        const lastEllipsisIndex = displayMessage.lastIndexOf('...');
        if (lastEllipsisIndex !== -1 && lastEllipsisIndex < displayMessage.length - 3) {
          // There's content after the last '...'
          const afterEllipsis = displayMessage.substring(lastEllipsisIndex + 3).trim();
          if (afterEllipsis) {
            console.log('[Final Response] Extracted:', afterEllipsis.substring(0, 100) + (afterEllipsis.length > 100 ? '...' : ''));
            displayMessage = afterEllipsis;
          }
        }
        
        let structuredData = null;
        
        // Handle agent enablement for Personal Assistant onboarding
        if (agent.id === 'personal_assistant') {
          // Check if we have the exact expected format with finished: true
          if (response.finished === true && response.agent_data) {
            structuredData = response;
          }
          // Otherwise fallback to legacy text parsing
          else {
            structuredData = response.agent_response;
          }
        }

        // Safely parse timestamp - fallback to current time if invalid
        const parseTimestamp = (ts: string | undefined): Date => {
          if (!ts) return new Date();
          const parsed = new Date(ts);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };
        const messageTimestamp = parseTimestamp(response.timestamp_of_call_made);

        const agentMessage: ChatMessage = {
          id: response.request_id,
          content: displayMessage,
          sender: 'agent',
          timestamp: messageTimestamp,
          status: response.agent_status || 'Ready', // Default to 'Ready' to enable streaming
          isHtml: (response.agent_status || 'Ready') === 'Ready'
        };

        // Save agent response to database and get back the saved record
        const savedRecord = await saveMessageToHistory(
          displayMessage,
          'Agent',
          messageTimestamp,
          response.agent_status || 'Ready',  // Default to 'Ready' for streaming
          response.execution_id,  // Pass execution_id from n8n response
          response.workflow_id  // Pass workflow_id from n8n response
        );

        // Update agentMessage with content_repurposer_history_id if available
        if (savedRecord?.content_repurposer_history_id) {
          agentMessage.content_repurposer_history_id = savedRecord.content_repurposer_history_id;
        }

        // Update the streaming message in place - just change the ID to remove streaming_ prefix
        // This allows smooth transition without disappear/reappear effect
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? {
                ...msg,
                id: response.request_id, // Change ID to remove streaming_ prefix
                content: displayMessage, // Use final content
                status: response.agent_status || 'Ready',
                content_repurposer_history_id: savedRecord?.content_repurposer_history_id
              }
            : msg
        ));

        // Trigger Recent Actions refresh after agent response is saved
        onMessageSent?.();


        // NOTE: Agent enablement is now handled via actions_todo (see agent_enabled case above)
        // No need for separate AgentEnablementService check
      } else {
        // Handle error case - remove streaming message and add error
        const errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== streamingMessageId),
          {
            id: generateRequestId(),
            content: errorMessage,
            sender: 'agent',
            timestamp: new Date(),
            status: 'Ready' // Enable streaming
          }
        ]);
        
        // Save error message to database
        await saveMessageToHistory(errorMessage, 'Agent');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Failed to connect to the service. Please check your connection and try again.';
      
      // Remove streaming message if it exists and add error
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.id.startsWith('streaming_'));
        return [
          ...filtered,
          {
            id: generateRequestId(),
            content: errorMessage,
            sender: 'agent',
            timestamp: new Date(),
            status: 'Ready' // Enable streaming
          }
        ];
      });
      
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
    // Look for button pattern: $**text**$ or $content$
    const singleDollarPattern = /\$([^$]+)\$/g;
    return singleDollarPattern.test(content);
  };

  // Helper function to extract button texts from content
  const extractButtonTexts = (content: string): string[] => {
    const buttons: string[] = [];
    const buttonPattern = /\$\*\*([^*]+)\*\*\$/g;

    let match;
    while ((match = buttonPattern.exec(content)) !== null) {
      if (!buttons.includes(match[1].trim())) {
        buttons.push(match[1].trim());
      }
    }
    return buttons;
  };

  // Helper function to clean button patterns from content
  const cleanButtonPatterns = (content: string): string => {
    return content
      .replace(/\$([^$]+)\$/g, '')
      .replace(/\$\$+/g, '') // Remove orphaned $$
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  // Helper function to detect numbered list options (e.g., "1. OPTION TEXT" or "1. Option Text|Description")
  const hasNumberedOptions = (content: string): boolean => {
    // Split by lines and check each line for numbered option pattern
    const lines = content.split('\n');
    let count = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      // Match "1. Text" pattern - starts with number, period, space, then any text starting with capital letter
      if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
        count++;
      }
    }
    return count >= 2; // At least 2 numbered options
  };

  // Helper function to extract numbered options from content
  const extractNumberedOptions = (content: string): string[] => {
    const options: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match "1. TEXT" and extract the text part (more flexible)
      const match = trimmed.match(/^\d+\.\s+(.+)$/);
      if (match && /^[A-Z]/.test(match[1])) {
        options.push(match[1].trim());
      }
    }
    return options;
  };

  // Helper function to extract numbered options with pipe separator (e.g., "Title|Description")
  const extractNumberedOptionsWithDescription = (content: string): { title: string; description: string }[] => {
    const options: { title: string; description: string }[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match "1. TEXT" and extract the text part
      const match = trimmed.match(/^\d+\.\s+(.+)$/);
      if (match && /^[A-Z]/.test(match[1])) {
        const optionText = match[1].trim();
        // Check for pipe separator
        if (optionText.includes('|')) {
          const [title, ...descParts] = optionText.split('|');
          options.push({ title: title.trim(), description: descParts.join('|').trim() });
        } else {
          options.push({ title: optionText, description: '' });
        }
      }
    }
    return options;
  };

  // Helper function to get content without numbered options (intro text only)
  const getContentWithoutNumberedOptions = (content: string): string => {
    const lines = content.split('\n');
    const introLines: string[] = [];
    for (const line of lines) {
      // Stop when we hit the first numbered option
      if (/^\d+\.\s+[A-Z]/.test(line.trim())) {
        break;
      }
      introLines.push(line);
    }
    // Clean up orphaned $$ patterns and trim
    return introLines.join('\n').replace(/\$\$+/g, '').trim();
  };

  // Helper function to detect inline comma-separated options (e.g., "OPTION A, OPTION B, or OPTION C?")
  const hasInlineOptions = (content: string): boolean => {
    // Look for pattern: ALL CAPS options separated by commas, ending with "or OPTION?"
    const pattern = /[A-Z][A-Z\s\/&\-]+,\s+[A-Z][A-Z\s\/&\-]+.*,\s+or\s+[A-Z][A-Z\s\/&\-]+\?/;
    return pattern.test(content);
  };

  // Helper function to extract inline options from content
  const extractInlineOptions = (content: string): string[] => {
    // Find the part with comma-separated options ending with "or X?"
    const match = content.match(/([A-Z][A-Z\s\/&\-]+(?:,\s+[A-Z][A-Z\s\/&\-]+)+,\s+or\s+[A-Z][A-Z\s\/&\-]+)\?/);
    if (!match) return [];
    
    const optionsStr = match[1];
    // Split by ", or " first to get the last option
    const parts = optionsStr.split(/,\s+or\s+/);
    const lastOption = parts[1]?.trim();
    const firstPart = parts[0];
    
    // Split the first part by commas
    const options = firstPart.split(/,\s+/).map(o => o.trim()).filter(o => o.length > 0);
    if (lastOption) {
      options.push(lastOption);
    }
    
    return options;
  };

  // Helper function to get content before inline options
  const getContentBeforeInlineOptions = (content: string): string => {
    // Find where the ALL CAPS options start
    const match = content.match(/^(.*?)([A-Z][A-Z\s\/&\-]+,\s+[A-Z][A-Z\s\/&\-]+.*,\s+or\s+[A-Z][A-Z\s\/&\-]+\?)/s);
    if (match) {
      return match[1].trim();
    }
    return content;
  };

  // Helper function to detect agent recommendations in Personal Assistant messages
  const hasAgentRecommendations = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    // Check if message mentions selecting/configuring assistants
    const hasSelectionPrompt = lowerContent.includes('select one') ||
                               lowerContent.includes('choose one') ||
                               lowerContent.includes('configuring one of these');
    // Check if message has $**...**$ button patterns (agent recommendations)
    const hasButtonPattern = /\$\*\*[^*]+\*\*\$/.test(content);
    return hasSelectionPrompt || hasButtonPattern;
  };

  // Helper function to extract agent names from Personal Assistant recommendations
  const extractAgentRecommendations = (content: string): string[] => {
    const agents: string[] = [];

    // Extract from $**...**$ button patterns
    const buttonPattern = /\$\*\*([^*]+)\*\*\$/g;
    let match;
    while ((match = buttonPattern.exec(content)) !== null) {
      // Extract agent name - remove emoji and description after dash
      let agentText = match[1].trim();
      // Remove leading emoji (any non-letter characters at start)
      agentText = agentText.replace(/^[^\w\s]+\s*/, '');
      // If there's a dash, take only the part before it (agent name)
      if (agentText.includes(' - ')) {
        agentText = agentText.split(' - ')[0].trim();
      }
      if (agentText && !agents.includes(agentText)) {
        agents.push(agentText);
      }
    }
    
    // If no button patterns found, fall back to keyword detection
    if (agents.length === 0) {
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('newsletter')) {
        agents.push('Newsletter Agent');
      }
      if (lowerContent.includes('content repurpos') || lowerContent.includes('content strategist')) {
        agents.push('Content Repurposer');
      }
      if (lowerContent.includes('solar sales')) {
        agents.push('Solar Sales Assistant');
      }
      if (lowerContent.includes('social media')) {
        agents.push('Social Media Manager');
      }
    }
    
    return agents;
  };

  // Helper function to detect if message contains HTML content (for newsletter agent)
  const hasHTMLContent = (content: string): boolean => {
    const htmlPatterns = [
      /<html[\s>]/i,
      /<body[\s>]/i,
      /<div[\s>]/i,
      /<table[\s>]/i,
      /<td[\s>]/i,
      /<tr[\s>]/i,
      /<p[\s>]/i,
      /<h[1-6][\s>]/i,
      /<img[\s>]/i,
      /<a[\s>]/i,
      /<style[\s>]/i,
      /<head[\s>]/i,
      /<!DOCTYPE/i
    ];
    return htmlPatterns.some(pattern => pattern.test(content));
  };

  // Helper function to detect if message contains social media content (for content_repurposer agent)
  const hasSocialMediaContent = (content: string): boolean => {
    try {
      const parsed = JSON.parse(content);
      
      // Handle error structure with raw JSON content
      if (parsed && parsed.error && parsed.raw) {
        try {
          // Extract JSON from markdown code blocks
          const rawContent = parsed.raw.replace(/```json\n|\n```/g, '');
          const innerParsed = JSON.parse(rawContent);
          if (innerParsed && (innerParsed.LinkedIn || innerParsed.InstagramFacebook || innerParsed.TikTokReels || innerParsed.GeneralAssets)) {
            return true;
          }
        } catch {
          // If inner parsing fails, continue with outer checks
        }
      }
      
      // Check for ContentRepurposerPosts structure
      if (Array.isArray(parsed) && parsed[0] && parsed[0].ContentRepurposerPosts) {
        return true;
      }
      if (parsed && parsed.ContentRepurposerPosts) {
        return true;
      }
      // Also check for direct social media keys
      if (parsed && (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels || parsed.GeneralAssets)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Check for duplicate files in firm_users_knowledge_base
  const checkForDuplicateFile = async (fileName: string): Promise<{ isDuplicate: boolean; existingFile?: { file_id: string; file_url: string } }> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/files/user/${userId}?agent_id=${agent.id}`);
      
      if (response.ok) {
        const result = await response.json();
        const files = result.data || [];
        const existingFile = files.find((f: { file_name: string; file_id: string; file_url: string }) => 
          f.file_name.toLowerCase() === fileName.toLowerCase()
        );
        
        if (existingFile) {
          return { isDuplicate: true, existingFile };
        }
      }
    } catch (error) {
      console.error('Error checking for duplicate file:', error);
    }
    return { isDuplicate: false };
  };

  // Delete existing file before replacing
  const deleteExistingFile = async (fileId: string): Promise<boolean> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/knowledge-base/file/${fileId}`, {
        method: 'DELETE'
      });
      return response.ok || response.status === 404;
    } catch (error) {
      console.error('Error deleting existing file:', error);
      return false;
    }
  };

  const handleAttachmentClick = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.txt,.docx,.png,.jpg,.jpeg,.mp4,.mov,.webm';
    fileInput.style.display = 'none';

    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'video/mp4',
        'video/quicktime',
        'video/webm'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, TXT, DOCX, PNG, JPG, JPEG, MP4, MOV, and WEBM files are supported');
        return;
      }
      
      try {
        // Check for duplicate file
        const { isDuplicate, existingFile } = await checkForDuplicateFile(file.name);
        
        if (isDuplicate && existingFile) {
          // Show in upload indicator that we're replacing
          const uploadTrackingId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          setUploadingFiles(prev => new Map(prev.set(uploadTrackingId, { 
            name: file.name, 
            status: 'Replacing existing file...' 
          })));
          
          // Delete the existing file first
          await deleteExistingFile(existingFile.file_id);
          
          // Update status to uploading
          setUploadingFiles(prev => new Map(prev.set(uploadTrackingId, { 
            name: file.name, 
            status: 'Uploading...' 
          })));
          
          // Pass trackingId to prevent double tracking
          await uploadFileToSupabase(file, uploadTrackingId);
          
          // Clear the upload indicator
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(uploadTrackingId);
            return newMap;
          });
        } else {
          await uploadFileToSupabase(file);
        }
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

  const uploadFileToSupabase = async (file: File, trackingId?: string) => {
    try {
      const timestamp = Date.now();
      // Sanitize filename - remove special characters and spaces that cause "Invalid key" errors
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars (including em-dashes) with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      const fileName = `${userId}_${timestamp}_${sanitizedFileName}`;
      const uploadTrackingId = trackingId || `upload_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

      // Track the upload if no tracking ID was provided (non-duplicate case)
      if (!trackingId) {
        setUploadingFiles(prev => new Map(prev.set(uploadTrackingId, { name: file.name, status: 'Uploading...' })));
      }
      
      
      // Step 1: Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('newsletter')
        .upload(fileName, file);
      
      if (error) {
        console.error('Supabase upload error:', error);
        console.error('Error details:', { message: error.message, statusCode: error.statusCode });
        throw new Error(`Upload failed: ${error.message}`);
      }
      

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('newsletter')
        .getPublicUrl(data.path);

      const fileUrl = urlData.publicUrl;

      // Clear uploading indicator once upload completes (processing happens in background)
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(uploadTrackingId);
        return newMap;
      });

      // Step 3: Call backend processing endpoint (no UI indicator)
      await callBackendProcessing(file.name, fileUrl);
    } catch (error) {
      console.error('Error in uploadFileToSupabase:', error);
      // Clear indicator if upload fails
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(uploadTrackingId);
        return newMap;
      });
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
      formData.append('source', 'chat');


      // Use the backend URL from environment variables
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/file/process`, {
        method: 'POST',
        body: formData
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend processing failed: ${response.statusText} - ${errorText}`);
      }
    
    const result = await response.json();
    
    // Track the file upload for status monitoring
    const fileId = result.data?.file_id;
    
    // Detect if file is an image or video
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    const isImage = imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    const isVideo = videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    
    // User visible message (saved to chat history)
    const userVisibleMessage = `I've uploaded a file: ${fileName}`;
    
    if (isImage) {
      // For images: send URL with analysis instruction immediately (no need to wait for KB processing)
      const agentInstruction = `I've uploaded an image: ${fileUrl}. Please analyze this image and tell me what you see in it. Describe the content, objects, text, or any relevant information you can extract from the image.`;
      await handleSendMessage(userVisibleMessage, fileUrl, fileName, agentInstruction);
      
      // Still monitor for UI updates
      if (fileId) {
        monitorFileStatus(fileId, fileName);
      }
    } else if (isVideo) {
      // For videos: send URL directly to agent (no text extraction needed)
      const agentInstruction = `I've uploaded a video: ${fileUrl}. This video file is now available for use in social media posts or other content.`;
      await handleSendMessage(userVisibleMessage, fileUrl, fileName, agentInstruction);
      
      // Still monitor for UI updates
      if (fileId) {
        monitorFileStatus(fileId, fileName);
      }
    } else {
      // For documents: wait for processing to complete before sending agent instruction
      // First show the file upload message in chat (without sending to agent yet)
      const messageId = generateRequestId();
      const userMessage: ChatMessage = {
        id: messageId,
        content: userVisibleMessage,
        sender: 'user',
        timestamp: new Date(),
        fileUpload: {
          fileName: fileName,
          fileUrl: fileUrl,
          fileId: fileId || `file_${messageId}`,
          status: 'processing',
          agentId: agent.id,
          agentName: agent.name
        }
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to history (without agent instruction)
      await saveMessageToHistory(userVisibleMessage, 'User', userMessage.timestamp, undefined, undefined, undefined, fileUrl, fileName);
      
      // Monitor file status and send agent instruction when complete
      if (fileId) {
        monitorFileStatusAndNotifyAgent(fileId, fileName, fileUrl);
      }
    }
    } catch (error) {
      console.error('Error in callBackendProcessing:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  const monitorFileStatus = async (fileId: string, fileName: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Monitor for 5 minutes (30 attempts * 10 seconds)
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkStatus = async () => {
      try {
        const file = await fileUploadService.getFileStatus(fileId);
        
        // If file not found, stop monitoring
        if (!file) {
          console.log(`File ${fileId} not found, stopping monitoring`);
          return;
        }
        
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
            // Stop polling - file is completed
            if (timeoutId) clearTimeout(timeoutId);
            
            // Show success toast
            toast.success(`File "${fileName}" processed successfully!`, {
              description: 'Added to your knowledge base.',
              duration: 3000,
            });
            return;
          } else if (file.processing_status === 'failed') {
            // Show error toast notification
            toast.error(`File "${fileName}" processing failed`, {
              description: file.error_message || 'Unknown error occurred',
              duration: 7000,
            });
            // Stop polling - file failed
            if (timeoutId) clearTimeout(timeoutId);
            return;
          }
        }
        
        // Continue monitoring if still processing
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          // Timeout - stop monitoring
          console.log(`File ${fileId} monitoring timed out after ${maxAttempts} attempts`);
        }
      } catch (error) {
        console.error('Error checking file status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkStatus, 10000);
        }
      }
    };
    
    // Start monitoring after 5 seconds
    timeoutId = setTimeout(checkStatus, 5000);
    
    // Return cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log(`Stopped monitoring file ${fileId}`);
      }
    };
  };

  // Monitor file status and send agent instruction only when processing completes
  const monitorFileStatusAndNotifyAgent = async (fileId: string, fileName: string, fileUrl: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Monitor for 10 minutes (60 attempts * 10 seconds)
    let timeoutId: NodeJS.Timeout | null = null;
    let agentNotified = false;
    
    // Helper to get progress message based on status
    const getProgressMessage = (status: string, message?: string): string => {
      switch (status) {
        case 'extracting': return 'Reading your file...';
        case 'extracted': return 'Analyzing content...';
        case 'embedding': return 'Processing...';
        case 'saving': return 'Adding to knowledge base...';
        case 'processing': return 'Processing...';
        default: return 'Processing...';
      }
    };
    
    // Helper to get progress percentage based on status
    const getProgressPercent = (status: string, serverProgress?: number): number => {
      if (serverProgress) return serverProgress;
      switch (status) {
        case 'extracting': return 20;
        case 'extracted': return 40;
        case 'embedding': return 50;
        case 'saving': return 70;
        case 'processing': return 30;
        default: return 10;
      }
    };
    
    const checkStatus = async () => {
      try {
        const file = await fileUploadService.getFileStatus(fileId);
        
        // If file not found, stop monitoring
        if (!file) {
          console.log(`File ${fileId} not found, stopping monitoring`);
          return;
        }
        
        const status = file.processing_status || file.status || 'processing';
        const message = file.message || file.processing_message;
        const progress = file.progress;
        
        // Update the file message with processing progress
        setMessages(prev => prev.map(msg => {
          if (msg.fileUpload?.fileId === fileId) {
            return {
              ...msg,
              fileUpload: {
                ...msg.fileUpload,
                status: file.processing_status,
                extractedText: file.extracted_text,
                errorMessage: file.error_message,
                processingProgress: status !== 'completed' && status !== 'failed' ? {
                  status: status,
                  message: getProgressMessage(status, message),
                  progress: getProgressPercent(status, progress)
                } : undefined
              }
            };
          }
          return msg;
        }));
        
        if (file.processing_status === 'completed' && !agentNotified) {
          // File processing complete - now send instruction to agent
          agentNotified = true;
          if (timeoutId) clearTimeout(timeoutId);
          
          // Show success toast
          toast.success(`File "${fileName}" processed successfully!`, {
            description: 'Added to your knowledge base.',
            duration: 3000,
          });
          
          // Now send the agent instruction (document is in KB)
          const agentInstruction = `I've uploaded a file: ${fileName}. Please read and analyze this document from my knowledge base. You can ask me questions about it or provide insights based on its content.`;
          
          // Send to agent (this will add agent response to chat)
          setIsLoading(true);
          try {
            const response = await sendToN8nWorkflowStreaming(
              userId,
              agentInstruction,
              agent.id,
              (text) => setStreamingText(text),
              sessionId,
              generateRequestId(),
              webhookUrl,
              (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') ? selectedNewsletterId || undefined : undefined,
              conversationState
            );
            
            if (response) {
              // Add agent response to chat
              const displayMessage = response.agent_response || response.response || 'I received your file and processed it.';
              const agentMessage: ChatMessage = {
                id: response.request_id || generateRequestId(),
                content: displayMessage,
                sender: 'agent',
                timestamp: new Date(),
                status: response.agent_status || 'Ready',
                isHtml: (response.agent_status || 'Ready') === 'Ready'
              };
              
              setMessages(prev => [...prev, agentMessage]);
              
              // Save agent response to database
              await saveMessageToHistory(
                displayMessage,
                'Agent',
                agentMessage.timestamp,
                response.agent_status || 'Ready',
                response.execution_id,
                response.workflow_id
              );
              
              // Trigger Recent Actions refresh
              onMessageSent?.();
            }
          } catch (error) {
            console.error('Error sending to agent after file processing:', error);
            const errorMessage = 'Your file was processed but I encountered an error analyzing it. Please try asking about it.';
            // Add error message to chat
            setMessages(prev => [...prev, {
              id: generateRequestId(),
              content: errorMessage,
              sender: 'agent',
              timestamp: new Date(),
              status: 'Ready'
            }]);
          } finally {
            setIsLoading(false);
            setStreamingText('');
          }
          
          return;
        } else if (file.processing_status === 'failed') {
          // Show error toast
          toast.error(`File "${fileName}" processing failed`, {
            description: file.error_message || 'Unknown error occurred',
            duration: 7000,
          });
          
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        
        // Continue monitoring if still processing
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkStatus, 1000); // Check every 1 second to catch fast processing
        } else {
          console.log(`File ${fileId} monitoring timed out after ${maxAttempts} attempts`);
          toast.error(`File "${fileName}" processing timed out`, {
            description: 'Please try uploading again.',
            duration: 7000,
          });
        }
      } catch (error) {
        console.error('Error checking file status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkStatus, 1000); // Retry every 1 second on error too
        }
      }
    };
    
    // Start monitoring immediately to catch fast processing
    checkStatus();
  };

  const handleMicrophoneClick = () => {
    // TODO: Implement voice input functionality
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Newsletter Selector for content_repurposer agent */}
      {showNewsletterSelector && (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && (
        <div className="p-4 border-b">
          <NewsletterSelector
            onNewsletterSelect={(newsletterId) => {
              setSelectedNewsletterId(newsletterId);
              if (newsletterId) {
              }
            }}
            selectedNewsletterId={selectedNewsletterId}
          />
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] break-words overflow-hidden ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
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
                      // Use StreamingAgentMessage for agent messages with streaming support
                      <StreamingAgentMessage
                        response={{
                          user_id: userId,
                          session_id: sessionId,
                          agent_name: agent.id,
                          timestamp_of_call_made: message.timestamp instanceof Date && !isNaN(message.timestamp.getTime()) 
                            ? message.timestamp.toISOString() 
                            : new Date().toISOString(),
                          request_id: message.content_repurposer_history_id || message.id,
                          agent_response: message.content,
                          agent_status: message.status
                        }}
                        enableStreaming={true}
                        streamingSpeed={15}
                        onButtonClick={handleButtonClick}
                        isExternalStreaming={message.id.startsWith('streaming_')}
                      />
                    ) : (
                      // Regular message display with interactive buttons support
                      (() => {
                        // For newsletter agent (and newsletter_multi), check if content is HTML and use HTMLPreview
                        if ((agent.id === 'newsletter' || agent.id === 'newsletter_multi') && hasHTMLContent(message.content)) {
                          return (
                            <div className="html-preview-wrapper">
                              <HTMLPreview content={message.content} agentName={agent.id} />
                              <EnableContentRepurposerButton />
                            </div>
                          );
                        }
                        
                        // For content_repurposer agent (and content_repurposer_multi), check if content is social media and use SocialMediaPreview
                        if ((agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && hasSocialMediaContent(message.content)) {
                          const historyId = message.content_repurposer_history_id || getExistingHistoryId() || message.id;
                          return (
                            <div className="social-media-preview-wrapper">
                              <SocialMediaPreview content={message.content} historyId={historyId} />
                            </div>
                          );
                        }
                        
                        // For newsletter agent (and newsletter_multi), check for numbered options and make them clickable
                        if ((agent.id === 'newsletter' || agent.id === 'newsletter_multi') && hasNumberedOptions(message.content)) {
                          const introText = getContentWithoutNumberedOptions(message.content);
                          const options = extractNumberedOptions(message.content);
                          return (
                            <div className="bg-gray-100 rounded-lg px-4 py-3">
                              {introText && (
                                <p className="text-text-primary whitespace-pre-wrap mb-3">{introText}</p>
                              )}
                              <div className="space-y-2">
                                {options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(option)}
                                    className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-medium transition-colors"
                                  >
                                    {idx + 1}. {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // For newsletter agent (and newsletter_multi), check for inline comma-separated options
                        if ((agent.id === 'newsletter' || agent.id === 'newsletter_multi') && hasInlineOptions(message.content)) {
                          const introText = getContentBeforeInlineOptions(message.content);
                          const options = extractInlineOptions(message.content);
                          return (
                            <div className="bg-gray-100 rounded-lg px-4 py-3">
                              {introText && (
                                <p className="text-text-primary whitespace-pre-wrap mb-3">{introText}</p>
                              )}
                              <div className="space-y-2">
                                {options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(option)}
                                    className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-medium transition-colors"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // For personal_assistant, check for agent recommendations
                        if (agent.id === 'personal_assistant' && hasAgentRecommendations(message.content)) {
                          const agents = extractAgentRecommendations(message.content);
                          if (agents.length > 0) {
                            // Clean the message content - remove $**...**$ patterns
                            const cleanedContent = cleanButtonPatterns(message.content);
                            return (
                              <div className="bg-gray-100 rounded-lg px-4 py-3">
                                <LinkDetectingTextArea
                                  content={cleanedContent}
                                  className="text-text-primary mb-3"
                                />
                                <div className="space-y-2">
                                  {agents.map((agentName, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSendMessage(agentName)}
                                      className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-medium transition-colors"
                                    >
                                      {idx + 1}. {agentName}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // For personal_assistant, check for numbered options with pipe separator (Title|Description)
                        if (agent.id === 'personal_assistant' && hasNumberedOptions(message.content)) {
                          const introText = getContentWithoutNumberedOptions(message.content);
                          const options = extractNumberedOptionsWithDescription(message.content);
                          return (
                            <div className="bg-gray-100 rounded-lg px-4 py-3">
                              {introText && (
                                <LinkDetectingTextArea
                                  content={introText}
                                  className="text-text-primary mb-3"
                                />
                              )}
                              <div className="space-y-2">
                                {options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(option.title)}
                                    className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                                  >
                                    <span className="text-purple-700 font-medium">{idx + 1}. {option.title}</span>
                                    {option.description && (
                                      <span className="text-purple-600 text-sm ml-1">- {option.description}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // Regular message display - check for $$...$$ button patterns
                        if (hasInteractiveButtons(message.content)) {
                          return (
                            <div className="bg-gray-100 rounded-lg px-4 py-3">
                              <InteractiveMessageButtons 
                                content={message.content}
                                onButtonClick={handleButtonClick}
                              />
                            </div>
                          );
                        }
                        
                        // Plain text message display
                        return (
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <LinkDetectingTextArea 
                              content={message.content}
                              className="text-text-primary whitespace-pre-wrap"
                            />
                          </div>
                        );
                      })()
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
                    <FileMessage fileInfo={message.fileUpload} timestamp={message.timestamp} processingProgress={message.fileUpload.processingProgress} />
                  ) : (
                    <>
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 overflow-hidden">
                        <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {uploadingFiles.size > 0 && (
        <div className="border-t border-gray-200 px-4 pt-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <div className="space-y-1">
              {Array.from(uploadingFiles.entries()).map(([id, file]) => (
                <div key={id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-gray-500">{file.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
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

      {/* Interactive Buttons - Below Input Area */}
      {activeInteractiveButtons.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {activeInteractiveButtons.map((buttonText, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(buttonText)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {buttonText}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion Buttons - Below Input Area (only show when no interactive buttons and at start) */}
      {activeInteractiveButtons.length === 0 && agent.suggestionButtons && agent.suggestionButtons.length > 0 && messages.length <= 1 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {agent.suggestionButtons.map((suggestion, index) => {
              // Highlight "Complete Setup" button with pink-to-purple gradient (same as + New Chat)
              const isCompleteSetup = suggestion.toLowerCase().includes('complete setup');
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={
                    isCompleteSetup
                      ? "px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      : "px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  }
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
