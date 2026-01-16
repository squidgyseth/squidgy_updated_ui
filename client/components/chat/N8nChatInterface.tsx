import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Paperclip, Mic } from 'lucide-react';
import type { N8nResponse, ChatMessage } from '../../types/n8n.types';
import AgentResponseHandler from './AgentResponseHandler';
import FileMessage from './FileMessage';
import { sendToN8nWorkflow, generateRequestId, generateSessionId } from '../../lib/n8nService';
import { ChatHistoryService } from '../../services/chatHistoryService';
import { chatSessionService } from '../../services/chatSessionService';
import { FileUploadService } from '../../services/fileUploadService';
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
  onMessageSent?: () => void; // Callback when a message is sent (for live Recent Actions update)
}

export default function N8nChatInterface({
  agent,
  userId,
  sessionId: initialSessionId,
  className = '',
  webhookUrl,
  showAddNewMessage = false,
  onMessageSent
}: N8nChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(initialSessionId || generateSessionId(userId, agent.id));
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; status: string }>>(new Map());
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [showNewsletterSelector, setShowNewsletterSelector] = useState(false);
  const [existingHistoryId, setExistingHistoryId] = useState<string | null>(null);
  const [activeInteractiveButtons, setActiveInteractiveButtons] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<Record<string, unknown> | undefined>(undefined); // State for multi-turn agents like newsletter_multi
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatHistoryService = ChatHistoryService.getInstance();
  const fileUploadService = FileUploadService.getInstance();

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
    console.log(`📨 N8nChatInterface: sessionId changed to: ${sessionId}`);
    console.log(`📨 N8nChatInterface: agentId: ${agent.id}, userId: ${userId}`);
    
    // Clear existing messages immediately when session changes
    setMessages([]);
    
    loadSessionMessages();
  }, [sessionId]);

  // Set input text when showAddNewMessage is true
  useEffect(() => {
    if (showAddNewMessage) {
      setInputValue("➕ Add Another Assistant");
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agent.id, showAddNewMessage]);

  // Handle scroll events (kept for potential future use)
  const handleScroll = () => {
    // No-op for now - scroll tracking removed
  };

  // Add intro message on mount and show newsletter selector for content_repurposer
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
      console.log('🔧 Pre-filled message detected:', preFilledMessage);
      setInputValue(decodeURIComponent(preFilledMessage));
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, document.title, newUrl.toString());
      console.log('✅ Pre-filled message set in input');
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

    // For content_repurposer agent (and content_repurposer_multi), enforce newsletter selection
    if ((agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && !selectedNewsletterId) {
      alert('📰 Please select a newsletter from the dropdown above before sending a message.');
      return;
    }

    // Get the actual auth user ID to ensure consistency with file uploads
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const authUserId = authUser?.id || userId;

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
      // Use authUserId to ensure consistency with file uploads (RLS policy uses auth.uid())
      const response = await sendToN8nWorkflow(
        authUserId,
        messageContent, // Send the full message content including file info
        agent.id,
        sessionId,
        userMessage.id,
        webhookUrl, // Pass the webhook URL from agent config
        (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') ? selectedNewsletterId || undefined : undefined, // Include newsletter_id for content_repurposer
        conversationState // Pass conversation state for multi-turn agents like newsletter_multi
      );

      if (response) {
        // Store conversation state for multi-turn agents (like newsletter_multi)
        if (response.state) {
          console.log('💾 Storing conversation state:', response.state);
          setConversationState(response.state);
        }

        // Parse response to handle structured JSON format
        let displayMessage = response.agent_response;
        let structuredData = null;
        
        // Handle agent enablement for Personal Assistant onboarding
        if (agent.id === 'personal_assistant') {
          // Check if we have the exact expected format with finished: true
          if (response.finished === true && response.agent_data) {
            console.log('✅ N8nChatInterface: Found exact structured format - processing agent enablement');
            structuredData = response;
          }
          // Otherwise fallback to legacy text parsing
          else {
            console.log('🔄 N8nChatInterface: Using legacy text parsing approach');
            structuredData = response.agent_response;
          }
        }

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

        // Trigger Recent Actions refresh after agent response is saved
        onMessageSent?.();

        console.log('🔍 N8N DEBUG: Agent response received from agent.id:', agent.id);
        console.log('🔍 N8N DEBUG: Response object:', response);

        // Handle agent enablement for Personal Assistant onboarding
        if (agent.id === 'personal_assistant') {
          console.log('🔍 N8N DEBUG: Personal Assistant detected, checking for agent enablement');
          const enablementService = AgentEnablementService.getInstance();
          // Ensure user_id is included in the enablement data
          const enablementData = {
            ...response,
            user_id: response.user_id || userId // Use response user_id or fallback to component userId
          };
          console.log('🔍 N8N DEBUG: Agent response for enablement check:', enablementData);
          
          try {
            // Pass the full response object with user_id guaranteed
            await enablementService.handleOnboardingResponse(enablementData, userId);
            console.log('🔍 N8N DEBUG: AgentEnablementService called successfully');
          } catch (error) {
            console.error('❌ N8N DEBUG: Error calling AgentEnablementService:', error);
          }
        } else {
          console.log('🔍 N8N DEBUG: Not Personal Assistant, skipping enablement check for agent:', agent.id);
        }
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
    // For general_assistant: populate input field so user can edit before sending
    // For other agents: send directly
    if (agent.id === 'general_assistant') {
      setInputValue(text);
    } else {
      handleSendMessage(text);
    }
  };

  // Helper function to detect if message contains interactive buttons
  const hasInteractiveButtons = (content: string): boolean => {
    // Look for the flexible button patterns
    const newFormatPattern = /\$\$\*\*([^*]+)\*\*\$\$/g;
    const oldFormatPattern = /\$\*\*\*\*([^*]+)\*\*\*\*\$/g;
    
    return newFormatPattern.test(content) || oldFormatPattern.test(content);
  };

  // Helper function to extract button texts from content
  const extractButtonTexts = (content: string): string[] => {
    const buttons: string[] = [];
    const newFormatPattern = /\$\$\*\*([^*]+)\*\*\$\$/g;
    const oldFormatPattern = /\$\*\*\*\*([^*]+)\*\*\*\*\$/g;
    
    let match;
    while ((match = newFormatPattern.exec(content)) !== null) {
      if (!buttons.includes(match[1].trim())) {
        buttons.push(match[1].trim());
      }
    }
    if (buttons.length === 0) {
      while ((match = oldFormatPattern.exec(content)) !== null) {
        if (!buttons.includes(match[1].trim())) {
          buttons.push(match[1].trim());
        }
      }
    }
    return buttons;
  };

  // Helper function to clean button patterns from content
  const cleanButtonPatterns = (content: string): string => {
    return content
      .replace(/\$\$\*\*[^*]+\*\*\$\$/g, '')
      .replace(/\$\*\*\*\*[^*]+\*\*\*\*\$/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  // Helper function to detect numbered list options (e.g., "1. OPTION TEXT")
  const hasNumberedOptions = (content: string): boolean => {
    // Split by lines and check each line for numbered option pattern
    const lines = content.split('\n');
    let count = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      // Match "1. UPPERCASE TEXT" pattern - allow any characters after the number
      if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
        count++;
        console.log('Matched line:', trimmed);
      }
    }
    console.log('hasNumberedOptions check:', { lineCount: lines.length, matchCount: count, firstLines: lines.slice(0, 10) });
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
    console.log('extractNumberedOptions:', options);
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
    return introLines.join('\n').trim();
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
    // Check if message has $$**...**$$ button patterns (agent recommendations)
    const hasButtonPattern = /\$\$\*\*[^*]+\*\*\$\$/.test(content);
    return hasSelectionPrompt || hasButtonPattern;
  };

  // Helper function to extract agent names from Personal Assistant recommendations
  const extractAgentRecommendations = (content: string): string[] => {
    const agents: string[] = [];
    
    // First, extract from $$**...**$$ button patterns
    const buttonPattern = /\$\$\*\*([^*]+)\*\*\$\$/g;
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

  const handleAttachmentClick = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.txt,.docx,.md,.png,.jpg,.jpeg,.gif,.webp';
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
      const allowedTypes = [
        'application/pdf', 
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/markdown',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp'
      ];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      if (!allowedTypes.includes(file.type) && fileExtension !== 'md' && !imageExtensions.includes(fileExtension || '')) {
        alert('Only PDF, TXT, DOCX, MD, and image files (PNG, JPG, GIF, WEBP) are supported');
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
      // Get the actual auth user ID for RLS policy compliance
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Not authenticated');
      }
      
      const timestamp = Date.now();
      // Store files in user-specific folder using auth.uid(): {authUserId}/uploads/{timestamp}_{filename}
      // This matches the RLS policy which checks (storage.foldername(name))[1] = auth.uid()::text
      const filePath = `${authUser.id}/uploads/${timestamp}_${file.name}`;
      
      // All agents use the shared knowledge-base bucket
      // Files are organized per user for easy cleanup on account deletion
      const bucketName = 'knowledge-base';
      
      console.log('Uploading file to Supabase...', filePath);
      console.log('File details:', { name: file.name, size: file.size, type: file.type, bucket: bucketName, authUserId: authUser.id });
      
      // Step 1: Upload to Supabase storage in user's folder
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (error) {
        console.error('Supabase upload error:', error);
        console.error('Error details:', { message: error.message });
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      console.log('File uploaded successfully:', data);
    
    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
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
      {showNewsletterSelector && (agent.id === 'content_repurposer' || agent.id === 'content_repurposer_multi') && (
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
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4" style={{ overflowAnchor: 'none' }}
      >
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
                      (() => {
                        // For newsletter agent (and newsletter_multi), check if content is HTML and use HTMLPreview
                        if ((agent.id === 'newsletter' || agent.id === 'newsletter_multi') && hasHTMLContent(message.content)) {
                          return (
                            <div className="html-preview-wrapper">
                              <HTMLPreview content={message.content} />
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
                            // Clean the message content - remove $$**...**$$ patterns
                            const cleanedContent = cleanButtonPatterns(message.content);
                            return (
                              <div className="bg-gray-100 rounded-lg px-4 py-3">
                                <p className="text-text-primary whitespace-pre-wrap mb-3">{cleanedContent}</p>
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
                        
                        // Regular message display
                        return (
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <LinkDetectingTextArea 
                              content={hasInteractiveButtons(message.content) ? cleanButtonPatterns(message.content) : message.content}
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
                    <FileMessage fileInfo={message.fileUpload} timestamp={message.timestamp} />
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
