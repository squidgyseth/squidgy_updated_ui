import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import UniversalChatLayout from '../components/layout/UniversalChatLayout';
import N8nChatInterface from '../components/chat/N8nChatInterface';
import { AgentConfigService } from '../services/agentConfigService';
import { navigationService } from '../services/navigationService';
import { useNavigationService } from '../hooks/useNavigationService';
import { chatSessionService } from '../services/chatSessionService';
import { queryByUserId } from '../services/supabaseQueryService';
import { checkAndTriggerGhlOnboarding } from '../lib/api';
import { AlertTriangle, Clock, MessageCircle, RefreshCw } from 'lucide-react';

/**
 * Dynamic Agent Dashboard - A single component that handles ALL agents
 * Loads agent configuration from YAML based on agentId from URL
 */
export default function DynamicAgentDashboard() {
  const { agentId } = useParams<{ agentId: string }>();
  const { userId, sessionId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const configService = AgentConfigService.getInstance();

  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recentActionTrigger, setRecentActionTrigger] = useState(0);
  const [hasWebsiteInfo, setHasWebsiteInfo] = useState<boolean>(false);
  const [pitTokenStatus, setPitTokenStatus] = useState<{ hasPitToken: boolean; checked: boolean; loading: boolean }>({
    hasPitToken: false,
    checked: false,
    loading: false
  });

  // Check PIT token status for social media agent
  useEffect(() => {
    const checkPitToken = async () => {
      if (agentId === 'social_media' && userId && !pitTokenStatus.checked) {
        setPitTokenStatus(prev => ({ ...prev, loading: true }));
        
        try {
          const result = await checkAndTriggerGhlOnboarding(userId);
          setPitTokenStatus({
            hasPitToken: result.hasPitToken,
            checked: true,
            loading: false
          });
        } catch (error) {
          console.error('Error checking PIT token:', error);
          setPitTokenStatus({
            hasPitToken: false,
            checked: true,
            loading: false
          });
        }
      }
    };

    checkPitToken();
  }, [agentId, userId, pitTokenStatus.checked]);

  // Callback to trigger recent actions refresh when a message is sent
  const handleMessageSent = () => {
    setRecentActionTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const loadAgentConfig = async () => {
      if (!agentId) {
        setError('No agent ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const config = await configService.loadAgentConfig(agentId);

        if (config) {
          setAgentConfig(config);

          // For Personal Assistant, check if user has website info
          if (agentId === 'personal_assistant' && userId) {
            try {
              const result = await queryByUserId('vw_personal_assistant_config_llm', userId);

              if (result.success && result.data && result.data.length > 0) {
                const websiteInfo = result.data[0].website_analysis_info;
                setHasWebsiteInfo(!!websiteInfo && websiteInfo.trim() !== '');
              }
            } catch (err) {
              // Continue with default behavior on error
            }
          }
        } else {
          setError(`Failed to load configuration for agent: ${agentId}`);
        }
      } catch (err) {
        console.error(`Error loading agent ${agentId}:`, err);
        setError(`Error loading agent configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadAgentConfig();
  }, [agentId, configService, userId]);

  const handlePinToggle = (agentId: string, pinned: boolean) => {
    // TODO: Implement pin toggle persistence
  };

  // Initialize navigation service with React Router
  useNavigationService();

  const handleSettingsClick = (agentId: string) => {

    // Navigate to agent settings page (voice input, file upload, instructions)
    navigate(`/agent-settings/${agentId}`);
  };

  const handleNewChat = (agentId: string) => {

    // Clear stored session so a new one is created
    chatSessionService.clearStoredSessionId(userId, agentId);

    // When user explicitly clicks "New Chat", always generate a fresh session
    const newSessionId = chatSessionService.generateSessionId(userId, agentId);
    setCurrentSessionId(newSessionId);

  };

  const handleSessionSelect = (sessionId: string) => {
    
    // Store the selected session in localStorage so it persists across navigation
    if (agentId) {
      chatSessionService.storeSessionId(userId, agentId, sessionId);
    }
    
    setCurrentSessionId(sessionId);
  };

  // Initialize with session persistence logic (1-hour timeout)
  useEffect(() => {
    const initializeSession = async () => {
      if (userId && agentId) {
        try {
          // Use session persistence logic - continue existing session within 1 hour or create new one
          const sessionId = await chatSessionService.getOrCreateActiveSession(userId, agentId);
          setCurrentSessionId(sessionId);
        } catch (error) {
          console.error(`❌ Error initializing session for ${agentId}:`, error);
          // Fallback to creating new session
          const newSessionId = chatSessionService.generateSessionId(userId, agentId);
          setCurrentSessionId(newSessionId);
        }
      }
    };

    initializeSession();
  }, [userId, agentId]);

  // Loading state - wait for both agent config AND session initialization
  if (loading || !currentSessionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Agent Not Found</h2>
          <p className="text-gray-500 mb-4">{error || `Agent "${agentId}" not found`}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PIT token validation for social media agent
  if (agentId === 'social_media' && pitTokenStatus.checked && !pitTokenStatus.hasPitToken) {
    return <SocialMediaPitTokenWarning onRetry={() => setPitTokenStatus(prev => ({ ...prev, checked: false }))} />;
  }

  // Build agent info for chat interface
  const agentInfo = {
    id: agentConfig.agent.id,
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || agentConfig.agent.description,
    avatar: agentConfig.agent.avatar,
    introMessage: generateIntroMessage(agentConfig.agent, location.state?.fromSidebar, hasWebsiteInfo),
    suggestionButtons: agentConfig.suggestions || []
  };

  return (
    <UniversalChatLayout
      agent={agentConfig.agent}
      onPinToggle={handlePinToggle}
      onSettingsClick={handleSettingsClick}
      onNewChat={handleNewChat}
      currentSessionId={currentSessionId}
      onSessionSelect={handleSessionSelect}
      recentActionTrigger={recentActionTrigger}
    >
      <N8nChatInterface
        key={currentSessionId} // Force re-render when session changes
        agent={agentInfo}
        userId={userId}
        sessionId={currentSessionId} // Use the current session ID
        webhookUrl={agentConfig.n8n?.webhook_url} // Pass the webhook URL from agent config
        showAddNewMessage={location.state?.showAddNewMessage}
        addNewTimestamp={location.state?.addNewTimestamp}
        onMessageSent={handleMessageSent}
      />
    </UniversalChatLayout>
  );
}

/**
 * Generate intro message based on agent configuration and user state
 */
function generateIntroMessage(agent: any, fromSidebar?: boolean, hasWebsiteInfo?: boolean): string {
  const { initial_message, sidebar_greeting, id } = agent;

  // Use sidebar_greeting when navigating from sidebar (if available), otherwise use initial_message
  if (fromSidebar && sidebar_greeting) {
    return sidebar_greeting;
  }

  // For Personal Assistant: Check if user already has website info
  if (id === 'personal_assistant' && hasWebsiteInfo) {
    return "Seems like you have already given the website information. What else can I help you with?";
  }

  // Return the initial_message from YAML config
  return initial_message || '';
}

/**
 * Social Media PIT Token Warning Component
 * Shows when user tries to access social media agent without PIT token
 */
function SocialMediaPitTokenWarning({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate();
  const [retryCountdown, setRetryCountdown] = useState<number>(300); // Start with 5 minutes
  const [isRetrying, setIsRetrying] = useState<boolean>(true); // Start retrying immediately

  const handleContactSupport = () => {
    // Navigate to support page or open email client
    window.location.href = 'mailto:support@squidgy.ai?subject=Social Media Agent - PIT Token Issue';
  };

  // Auto-start retry when component mounts
  useEffect(() => {
    // Set a timeout to retry after 5 minutes
    const retryTimer = setTimeout(() => {
      // Trigger retry and refresh the page
      onRetry();
      window.location.reload(); // Refresh the page to show updated status
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearTimeout(retryTimer);
  }, [onRetry]);

  // Countdown timer effect
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryCountdown === 0 && isRetrying) {
      setIsRetrying(false);
    }
  }, [retryCountdown, isRetrying]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-orange-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Setup In Progress</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-200 mb-6">
          <p className="text-gray-700 mb-4">
            Your Ai Mate is getting their social media hat on 🎩 Give them a couple of minutes to get settled in!
          </p>
          
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <Clock className="w-4 h-4 mr-2" />
            <span>This usually takes a few minutes to complete</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Auto-retrying in {formatCountdown(retryCountdown)}
          </div>
          
          <button
            onClick={handleContactSupport}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Contact Support Team
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If this issue persists, please contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}