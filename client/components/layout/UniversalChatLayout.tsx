import React, { useState, useEffect } from 'react';
import { Settings, Pin, PinOff, MessageSquare, Zap, Clock, ChevronRight, ChevronDown, Plus } from 'lucide-react';
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
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

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
                  <path d="M7.5 2.5V17.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Right Sidebar - Fixed Layout */}
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">

        {/* FIXED TOP SECTION: Header + Actions + Onboarding */}
        <div className="flex-none bg-white border-b border-gray-100 z-10 shadow-sm">
          {/* Compact Header */}
          <div className="p-3 flex items-center space-x-3">
            <div className="relative">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {agent.name.substring(0, 2)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate leading-tight">{agent.name}</h2>
              <div className="flex items-center text-[10px] text-gray-500 mt-0.5">
                <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                Active • {agent.category}
              </div>
            </div>
          </div>

          {/* Compact Actions Row */}
          <div className="px-3 pb-2 flex gap-2">
            <button
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition text-xs font-semibold shadow-sm"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
            <button
              onClick={handleSettingsClick}
              className="px-2 py-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition border border-gray-200"
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handlePinToggle}
              className={`px-2 py-1.5 rounded-md transition border ${isPinned
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-gray-200'
                }`}
              title={isPinned ? "Unpin Agent" : "Pin Agent"}
            >
              {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>
          </div>

          {/* Onboarding Section - Compact & Secondary */}
          <div className="px-3 pb-1">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center justify-between p-2 bg-purple-50/50 hover:bg-purple-50 rounded-md transition cursor-pointer border border-purple-100/50 group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] text-purple-700 font-medium group-hover:text-purple-800">Complete AI Setup</span>
              </div>
              <ChevronRight className="text-purple-300 group-hover:text-purple-500" size={12} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE AREA: Sessions first, then collapsed details */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-50/50">

          {/* Previous Sessions - Priority Content */}
          <div className="px-3 pt-0 pb-1">
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm p-2.5 min-h-[52px] flex flex-col justify-center">
              <PreviousSessions
                agentId={agent.id}
                currentSessionId={currentSessionId}
                onSessionSelect={onSessionSelect || (() => { })}
              />
            </div>
          </div>

          <div className="px-3 pb-4 space-y-2">
            {/* Capabilities - Collapsible */}
            <CollapsibleSection
              title="Capabilities"
              icon={<Zap size={14} />}
              isOpen={openSection === 'capabilities'}
              onToggle={() => toggleSection('capabilities')}
              preview={
                <div className="flex flex-wrap gap-2 mt-1">
                  {agent.capabilities && agent.capabilities.length > 0 ? (
                    <>
                      {agent.capabilities.slice(0, 2).map((cap, i) => (
                        <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-100">
                          {cap.length > 15 ? cap.substring(0, 15) + '...' : cap}
                        </span>
                      ))}
                      {agent.capabilities.length > 2 && (
                        <span className="text-[10px] text-gray-400 self-center">+{agent.capabilities.length - 2} more</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400">No capabilities specified</span>
                  )}
                </div>
              }
            >
              <div className="space-y-1.5 mt-2">
                {agent.capabilities && agent.capabilities.length > 0 ? (
                  agent.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <p className="leading-tight">{capability}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No specific capabilities listed for this agent.</p>
                )}
              </div>
            </CollapsibleSection>

            {/* Recent Activity - Collapsible */}
            <CollapsibleSection
              title="Recent Activity"
              icon={<Clock size={14} />}
              isOpen={openSection === 'activity'}
              onToggle={() => toggleSection('activity')}
              preview={
                <div className="mt-1">
                  {recentActions.length > 0 ? (
                    <p className="text-[10px] text-gray-500 truncate italic">
                      Latest: {recentActions[0]}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400">No recent activity</p>
                  )}
                </div>
              }
            >
              <div className="space-y-2.5 mt-2">
                {isLoadingActions ? (
                  <p className="text-xs text-gray-500 pl-1">Loading activity...</p>
                ) : recentActions.length > 0 ? (
                  recentActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-green-500"></div>
                      <p className="text-xs text-gray-700 font-medium">{action}</p>
                    </div>
                  ))
                ) : (
                  [...Array(4)].map((_, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-200"></div>
                      <p className="text-xs text-gray-400">—</p>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>

            {/* Previous Content - Collapsible */}
            <CollapsibleSection
              title="Generated Content"
              icon={<MessageSquare size={14} />}
              isOpen={openSection === 'content'}
              onToggle={() => toggleSection('content')}
              preview={
                <p className="text-[10px] text-gray-500 mt-1">View recent items</p>
              }
            >
              <div className="-mx-1">
                <PreviousContent agentId={agent.id} />
              </div>
            </CollapsibleSection>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper Component for Collapsible Sections
function CollapsibleSection({
  title,
  icon,
  children,
  preview,
  isOpen: propsIsOpen,
  onToggle,
  defaultOpen = false
}: {
  title: string,
  icon: React.ReactNode,
  children: React.ReactNode,
  preview?: React.ReactNode,
  isOpen?: boolean,
  onToggle?: () => void,
  defaultOpen?: boolean
}) {
  const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : localIsOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalIsOpen(!localIsOpen);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
      <button
        onClick={handleToggle}
        className="w-full flex items-start justify-between p-2.5 bg-white hover:bg-gray-50 transition-colors min-h-[52px]"
      >
        <div className="flex-1 min-w-0 pr-2 self-center">
          <div className="flex items-center gap-2">
            <span className="text-purple-500">{icon}</span>
            <span className="text-xs font-bold text-gray-800">{title}</span>
          </div>
          {!isOpen && preview && (
            <div className="animate-in fade-in duration-300">
              {preview}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {isOpen ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-2.5 pb-3 pt-0 border-t border-gray-50 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}