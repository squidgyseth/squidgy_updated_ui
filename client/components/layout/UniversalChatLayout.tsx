import React, { useState, useEffect } from 'react';
import { Settings, Pin, PinOff, MessageSquare, Zap, Clock, ChevronRight, Plus } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useUser } from '../../hooks/useUser';
import ChatHistory from '../chat/ChatHistory';
import PreviousContent from '../chat/PreviousContent';
import PreviousSessions from '../chat/PreviousSessions';
import { ChatHistoryService } from '../../services/chatHistoryService';

interface AgentConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  specialization?: string;
  tagline?: string;
  avatar?: string;
  pinned?: boolean;
  capabilities?: string[];
}

interface UniversalChatLayoutProps {
  agent: AgentConfig;
  children: React.ReactNode; // The actual agent interface (newsletter form, etc.)
  onPinToggle?: (agentId: string, pinned: boolean) => void;
  onSettingsClick?: (agentId: string) => void;
  onNewChat?: (agentId: string) => void;
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onRecentActionUpdate?: (action: string) => void;
  recentActionTrigger?: number; // Increment to trigger refresh
}

// Helper to format message into short informative action summary
const formatRecentAction = (message: string, agentName: string): string => {
  // Remove HTML tags
  const cleanMessage = message.replace(/<[^>]*>/g, '').trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  // Detect agent enablement/configuration completion - use the passed agent name
  if (lowerMessage.includes('is now configured') || lowerMessage.includes('configured and ready') || lowerMessage.includes('is now fully configured') || lowerMessage.includes('enabled and ready')) {
    return `${agentName} enabled`;
  }
  
  // Detect notifications enabled
  if (lowerMessage.includes('notifications enabled') || (lowerMessage.includes('notification') && lowerMessage.includes('enabled'))) {
    return 'Notifications enabled';
  }
  
  // Detect calendar connected
  if (lowerMessage.includes('calendar connected') || (lowerMessage.includes('calendar') && lowerMessage.includes('connected'))) {
    return 'Calendar connected';
  }
  
  // Detect brand voice set
  if (lowerMessage.includes('brand voice') || lowerMessage.includes('voice set')) {
    return 'Brand voice configured';
  }
  
  // Detect targeting configured
  if (lowerMessage.includes('b2c targeting') || lowerMessage.includes('b2b targeting') || lowerMessage.includes('targeting configured')) {
    return 'Targeting configured';
  }
  
  // Detect goals aligned
  if (lowerMessage.includes('goals aligned') || (lowerMessage.includes('goal') && lowerMessage.includes('aligned'))) {
    return 'Goals configured';
  }
  
  // Detect newsletter preview (HTML content with newsletter structure)
  if (message.includes('<html') || message.includes('<!DOCTYPE') || message.includes('<table') || (lowerMessage.includes('newsletter') && lowerMessage.includes('preview'))) {
    return 'Newsletter preview';
  }
  
  // Detect newsletter creation
  if (lowerMessage.includes('newsletter') && (lowerMessage.includes('created') || lowerMessage.includes('generated') || lowerMessage.includes('ready'))) {
    return 'Newsletter created';
  }
  
  // Detect content repurposing
  if (lowerMessage.includes('repurpos') || lowerMessage.includes('social media content') || lowerMessage.includes('posts generated')) {
    return 'Content repurposed';
  }
  
  // Detect social media post creation
  if (lowerMessage.includes('linkedin') || lowerMessage.includes('twitter') || lowerMessage.includes('instagram') || lowerMessage.includes('facebook')) {
    return 'Social posts created';
  }
  
  // Detect content generation
  if (lowerMessage.includes('here\'s') || lowerMessage.includes('i\'ve created') || lowerMessage.includes('i\'ve generated') || lowerMessage.includes('draft')) {
    return 'Content generated';
  }
  
  // Detect website analysis
  if (lowerMessage.includes('website') && lowerMessage.includes('analy')) {
    return 'Website analyzed';
  }
  
  // Detect onboarding/setup completion
  if (lowerMessage.includes('fully configured and ready') || lowerMessage.includes('setup complete')) {
    return 'Setup completed';
  }
  
  // Detect questions asked by agent
  if (lowerMessage.includes('would you like') || lowerMessage.includes('what would you') || lowerMessage.includes('which') || lowerMessage.endsWith('?')) {
    return 'Question asked';
  }
  
  // Detect generic acknowledgments (not useful as activity)
  if (lowerMessage.startsWith('okay, got it') || lowerMessage.startsWith('okay got it') || lowerMessage.startsWith('ok, got it') || lowerMessage.startsWith('ok got it')) {
    return 'Acknowledgment';
  }
  
  // Detect chat/conversation started
  if (lowerMessage.startsWith('hey') || lowerMessage.startsWith('hello') || lowerMessage.startsWith('hi ') || lowerMessage.includes('welcome') || lowerMessage.includes('great to') || lowerMessage.startsWith('okay, let\'s get started') || lowerMessage.startsWith('okay, let\'s start')) {
    return 'Conversation started';
  }
  
  // Default: truncate the actual message to show something meaningful
  if (cleanMessage.length > 0) {
    // Get first sentence or first 50 chars
    const firstSentence = cleanMessage.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 0) {
      return firstSentence.length > 50 ? firstSentence.substring(0, 47) + '...' : firstSentence;
    }
    return cleanMessage.length > 50 ? cleanMessage.substring(0, 47) + '...' : cleanMessage;
  }
  
  return 'Activity recorded';
};

export default function UniversalChatLayout({ 
  agent, 
  children, 
  onPinToggle, 
  onSettingsClick,
  onNewChat,
  currentSessionId,
  onSessionSelect,
  recentActionTrigger
}: UniversalChatLayoutProps) {
  const [isPinned, setIsPinned] = useState(agent.pinned || false);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { userId } = useUser();
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(true); // Only true on initial load
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Function to add a new action to the top of the list (live update)
  const addRecentAction = (message: string) => {
    const newAction = formatRecentAction(message, agent.name);
    setRecentActions(prev => {
      // Add new action to top, remove last if more than 4
      const updated = [newAction, ...prev];
      return updated.slice(0, 4);
    });
  };

  // Fetch real user activity from chat_history
  useEffect(() => {
    const fetchRecentActions = async () => {
      if (!userId || !agent.id) {
        return;
      }

      // Only show loading on initial load, not on refreshes
      if (!hasLoadedOnce) {
        setIsLoadingActions(true);
      }
      
      try {
        const chatHistoryService = ChatHistoryService.getInstance();
        // Use getRecentAgentMessages to get individual messages, not grouped by session
        // Fetch more than 4 to account for filtered "Question asked" entries
        const messages = await chatHistoryService.getRecentAgentMessages(userId, agent.id, 10);
        
        if (messages.length > 0) {
          // Format each message as a recent action, filter out non-useful activities
          const actions = messages
            .map(msg => formatRecentAction(msg.message, agent.name))
            .filter(action => !['Question asked', 'Acknowledgment', 'Conversation started', 'Activity recorded'].includes(action))
            .slice(0, 4); // Take first 4 after filtering
          
          setRecentActions(actions);
        }
      } catch (error) {
        console.error('Error fetching recent actions:', error);
      } finally {
        setIsLoadingActions(false);
        setHasLoadedOnce(true);
      }
    };

    fetchRecentActions();
  }, [userId, agent.id, currentSessionId, recentActionTrigger]); // Re-fetch when trigger changes

  const handlePinToggle = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    onPinToggle?.(agent.id, newPinnedState);
  };

  const handleSettingsClick = () => {
    onSettingsClick?.(agent.id);
  };

  const handleNewChat = () => {
    onNewChat?.(agent.id);
  };

  return (
    <div className="flex h-full bg-white">
      {/* Main Chat/Content Area - Clean design matching screenshots */}
      <div className="flex-1 flex flex-col">
        {/* Simple Chat Header - matches screenshots exactly */}
        <div className="border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            {/* Left: Sidebar toggle + Agent info */}
            <div className="flex items-center space-x-3">
              {/* Sidebar Toggle Button */}
              <button 
                onClick={toggleSidebar}
                className="text-squidgy-primary hover:bg-gray-100 p-1 rounded transition-colors"
                title="Toggle Sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 2.5V17.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="relative">
                {agent.avatar && (
                  <img 
                    src={agent.avatar} 
                    alt={agent.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                {/* Active indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-base font-bold text-black">{agent.name}</h1>
                <p className="text-xs font-normal text-gray-500 mt-1">active • {agent.tagline}</p>
              </div>
            </div>
            
            {/* Right: Action buttons */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="p-2 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-2 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 overflow-hidden bg-white">
          {children}
        </div>
      </div>

      {/* Right Sidebar - Agent Details - Modal Style Design */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        {/* Agent Header - Modal Style */}
        <div className="p-6 text-center">
          {/* Centered Avatar with Gradient Border */}
          {agent.avatar && (
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-purple-600 p-1">
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-full h-full rounded-full object-cover"
                />
                {/* Active indicator */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          )}
          
          {/* Centered Agent Name */}
          <h2 className="text-lg font-semibold text-purple-600 mb-3">{agent.name}</h2>
          
          {/* Centered Specialization Badge */}
          {agent.specialization && (
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {agent.specialization}
              </span>
            </div>
          )}
          
          {/* Centered Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6 text-center max-w-xs mx-auto">{agent.description}</p>

          {/* Action Buttons - matching screenshot */}
          <div className="space-y-3">
            {/* New Chat Button */}
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-medium"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>

            {/* Settings and Pin Buttons */}
            <div className="flex space-x-3">
              <button 
                onClick={handleSettingsClick}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-xl hover:from-red-600 hover:to-purple-700 transition font-medium"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button 
                onClick={handlePinToggle}
                className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition font-medium"
              >
                {isPinned ? <Pin size={18} /> : <PinOff size={18} />}
                <span>{isPinned ? 'Pinned' : 'To pin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Onboarding Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="text-squidgy-primary" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">Onboarding</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleSettingsClick}
              className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer border border-purple-200 relative"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700 font-medium">Configurable Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Setup Required</span>
                <ChevronRight className="text-purple-400" size={14} />
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer border border-purple-200 relative">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700 font-medium">Integration Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Setup Required</span>
                <ChevronRight className="text-purple-400" size={14} />
              </div>
            </button>
          </div>
        </div>

        {/* Capabilities Section - matching screenshots exactly */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="text-squidgy-primary" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">Capabilities</h3>
            </div>
            <div className="space-y-3">
              {agent.capabilities.map((capability, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-squidgy-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 leading-relaxed">{capability}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Actions Section - dynamic from chat_history */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="text-squidgy-primary" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">Recent Actions</h3>
          </div>
          <div className="space-y-4">
            {isLoadingActions ? (
              <p className="text-sm text-gray-500">Loading recent activity...</p>
            ) : (
              [...Array(4)].map((_, index) => {
                const action = recentActions[index];
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${action ? 'bg-squidgy-primary' : 'bg-gray-300'}`}></div>
                    <p className={`text-sm ${action ? 'text-gray-700' : 'text-gray-400'}`}>
                      {action || '—'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Previous Content Section */}
        <div className="px-6 py-2">
          <PreviousContent agentId={agent.id} />
        </div>

        {/* Previous Sessions Section */}
        <div className="px-6 py-2">
          <PreviousSessions 
            agentId={agent.id} 
            currentSessionId={currentSessionId}
            onSessionSelect={onSessionSelect || (() => {})}
          />
        </div>
      </div>
    </div>
  );
}