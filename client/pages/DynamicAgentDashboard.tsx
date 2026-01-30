import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import UniversalChatLayout from '../components/layout/UniversalChatLayout';
import N8nChatInterface from '../components/chat/N8nChatInterface';
import { AgentConfigService } from '../services/agentConfigService';
import { navigationService } from '../services/navigationService';
import { useNavigationService } from '../hooks/useNavigationService';
import { chatSessionService } from '../services/chatSessionService';

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
          console.log(`${config.agent.name} config loaded from YAML`);
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
  }, [agentId, configService]);

  const handlePinToggle = (agentId: string, pinned: boolean) => {
    console.log(`Agent ${agentId} pin toggled to: ${pinned}`);
    // TODO: Implement pin toggle persistence
  };

  // Initialize navigation service with React Router
  useNavigationService();

  const handleSettingsClick = (agentId: string) => {
    console.log(`Settings clicked for agent: ${agentId}`);

    // Navigate to agent settings page (voice input, file upload, instructions)
    navigate(`/agent-settings/${agentId}`);
  };

  const handleNewChat = (agentId: string) => {
    console.log(`New chat clicked for agent: ${agentId}`);

    // When user explicitly clicks "New Chat", always generate a fresh session
    const newSessionId = chatSessionService.generateSessionId(userId, agentId);
    setCurrentSessionId(newSessionId);

    console.log(`Created new chat session: ${newSessionId}`);
  };

  const handleSessionSelect = (sessionId: string) => {
    console.log(`🔄 Session selected: ${sessionId}`);
    console.log(`🔄 Previous session ID was: ${currentSessionId}`);
    setCurrentSessionId(sessionId);
    console.log(`✅ Current session ID updated to: ${sessionId}`);
  };

  // Initialize with session persistence logic (1-hour timeout)
  useEffect(() => {
    const initializeSession = async () => {
      if (userId && agentId) {
        try {
          // Use session persistence logic - continue existing session within 1 hour or create new one
          const sessionId = await chatSessionService.getOrCreateActiveSession(userId, agentId);
          setCurrentSessionId(sessionId);
          console.log(`🔄 DynamicAgentDashboard: Session initialized for ${agentId}: ${sessionId}`);
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

  // Loading state
  if (loading) {
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

  // Build agent info for chat interface
  const agentInfo = {
    id: agentConfig.agent.id,
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || agentConfig.agent.description,
    avatar: agentConfig.agent.avatar,
    introMessage: generateIntroMessage(agentConfig.agent, location.state?.fromSidebar),
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
 * Generate intro message based on agent configuration
 */
function generateIntroMessage(agent: any, fromSidebar?: boolean): string {
  const { initial_message, sidebar_greeting } = agent;

  // Use sidebar_greeting when navigating from sidebar (if available), otherwise use initial_message
  if (fromSidebar && sidebar_greeting) {
    return sidebar_greeting;
  }

  // Return the initial_message from YAML config
  return initial_message || '';
}
