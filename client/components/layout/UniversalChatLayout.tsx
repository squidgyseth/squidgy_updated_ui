import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pin, PinOff, MessageSquare, Zap, Clock, ChevronRight, ChevronDown, Plus, Check, FileText } from 'lucide-react';
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
  const navigate = useNavigate();
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(true); // Only true on initial load
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const toggleSection = (sectionId: string) => {
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

  const handleIntegrationSetupClick = () => {
    navigate('/integrations-settings');
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

  const handleGlobalSettingsClick = () => {
    navigate('/account-settings');
  };

  const handleNewChat = () => {
    onNewChat?.(agent.id);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-white">
      {/* Main Chat/Content Area - Clean design matching screenshots */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simple Chat Header - matches screenshots exactly - Responsive padding */}
        <div className="border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 bg-white">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Sidebar toggle + Agent info */}
            <div className="flex items-center space-x-3">
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
                <p className="text-xs font-normal text-gray-500 mt-1">active • Friendly & Helpful</p>
              </div>
            </div>

            {/* Right: Action buttons - Hide phone/video on mobile */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => alert('Coming soon')}
                className="hidden md:block p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={() => alert('Coming soon')}
                className="hidden md:block p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`p-2 rounded-lg transition border text-purple-600 ${isRightSidebarOpen
                  ? 'bg-purple-50 border-purple-100'
                  : 'border-transparent hover:bg-purple-50'
                  }`}
                title={isRightSidebarOpen ? "Hide details" : "Show details"}
              >
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

      {/* Right Sidebar - Redesigned Layout - Hidden on mobile, shown on desktop */}
      {isRightSidebarOpen && (
        <div className="hidden md:flex w-80 border-l border-gray-200 bg-white flex-col h-full overflow-hidden font-sans">

          {/* Header Section */}
          <div className="flex-none p-3 pb-0.5 text-center bg-gradient-to-b from-purple-50/50 to-white">
            <div className="relative inline-block mb-1.5">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {agent.name.substring(0, 2)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></div>
            </div>

            <h2 className="text-sm font-bold text-indigo-600 mb-0">{agent.name}</h2>

            <div className="inline-flex items-center px-2 py-0.5 bg-purple-100/80 rounded-full mb-1.5">
              <span className="text-[8px] font-semibold text-purple-700">Friendly & Helpful</span>
            </div>

            <p className="text-[9px] text-center text-gray-400 mb-1.5 leading-tight px-4 line-clamp-2">
              {agent.description || "I'm here to help you set up your Squidgy account."}
            </p>

            <div className="flex gap-1 justify-center px-1">
              <button
                onClick={handleNewChat}
                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Plus size={12} />
                <span className="font-semibold text-[10px]">New Chat</span>
              </button>

              <button
                onClick={handleGlobalSettingsClick}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-purple-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-colors bg-white shadow-sm"
                title="Settings"
              >
                <Settings size={14} />
              </button>

              <button
                onClick={handlePinToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shadow-sm ${isPinned
                  ? 'bg-purple-50 text-purple-600 border-purple-300'
                  : 'bg-white border-purple-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                title={isPinned ? "Unpin Agent" : "Pin Agent"}
              >
                <Pin size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">

            {/* Onboarding Section */}
            <div>
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">ONBOARDING</h3>
              <div className="space-y-2">
                {/* Card 1 */}
                <div className="p-2.5 rounded-lg border border-gray-100 shadow-sm bg-white hover:border-purple-100 transition-colors cursor-pointer group" onClick={handleSettingsClick}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-[11px]">Configurable Data</span>
                    <div className="flex items-center gap-1.5">
                      <div className="px-1 py-0.5 bg-red-50 rounded-full">
                        <span className="text-[9px] font-bold text-red-400">Setup Required</span>
                      </div>
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-2.5 rounded-lg border border-gray-100 shadow-sm bg-white hover:border-purple-100 transition-colors cursor-pointer group" onClick={handleIntegrationSetupClick}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-[11px]">Integration Setup</span>
                    <div className="flex items-center gap-1.5">
                      <div className="px-1.5 py-0.5 bg-red-50 rounded-full">
                        <span className="text-[9px] font-bold text-red-400">Setup Required</span>
                      </div>
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Previous Sessions */}
                <div className="pt-0.5">
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <MessageSquare size={14} className="text-purple-600" />
                    <h3 className="text-[11px] font-bold text-gray-800">Previous Sessions</h3>
                  </div>
                  <div className="pl-2 border-l-2 border-purple-100 ml-2">
                    <PreviousSessions
                      agentId={agent.id}
                      currentSessionId={currentSessionId}
                      onSessionSelect={onSessionSelect || (() => { })}
                      hideHeader={true}
                    />
                  </div>
                </div>

                {/* Review Row */}
                <div className="flex items-center gap-2 py-0.5 px-1 cursor-pointer group" onClick={handleSettingsClick}>
                  <div className="text-purple-600">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-gray-800 text-[11px] flex-1 group-hover:text-purple-600 transition-colors">Review your Brand Profile</span>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </div>
            </div>

            {/* Capabilities Section */}
            <div>
              <div className="flex items-center justify-between mb-2 cursor-pointer group" onClick={() => toggleSection('capabilities')}>
                <div className="flex items-center gap-2 px-1">
                  <Zap size={14} className="text-purple-600 fill-purple-100" />
                  <h3 className="text-[11px] font-bold text-gray-800">Capabilities</h3>
                </div>
                <ChevronRight size={12} className={`text-purple-300 group-hover:text-purple-600 transition-transform ${openSection === 'capabilities' ? 'rotate-90' : ''}`} />
              </div>

              {/* Always show tags as preview, matching image */}
              <div className="flex flex-wrap gap-1 px-1 mb-1">
                <div className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[9px] font-medium">
                  Website analysis...
                </div>
                <div className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[9px] font-medium">
                  AI agent recomm...
                </div>
                <div className="text-[9px] text-gray-400 font-medium py-0.5 px-0.5">
                  +4 more
                </div>
              </div>

              {/* Expanded Content */}
              {openSection === 'capabilities' && (
                <div className="mt-2 pl-2 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
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
              )}
            </div>

            {/* Recent Activity Section */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between pointer-events-none group px-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-purple-600" />
                  <h3 className="text-[11px] font-bold text-gray-800">Recent Activity</h3>
                </div>
              </div>

              <div className="mt-2 pl-2 space-y-1.5">
                {isLoadingActions ? (
                  <p className="text-[9px] text-gray-500 pl-1">Loading activity...</p>
                ) : recentActions.length > 0 ? (
                  recentActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full mt-1 flex-shrink-0 bg-green-500"></div>
                      <p className="text-[9px] text-gray-700 font-medium line-clamp-1">{action}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-gray-400 pl-1">No recent activity.</p>
                )}
              </div>
            </div>

            {/* Generated Content Section */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between cursor-pointer group px-1" onClick={() => toggleSection('content')}>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-purple-600" />
                  <h3 className="text-[11px] font-bold text-gray-800">Generated Content</h3>
                </div>
                <ChevronRight size={12} className={`text-purple-300 group-hover:text-purple-600 transition-transform ${openSection === 'content' ? 'rotate-90' : ''}`} />
              </div>

              {openSection === 'content' && (
                <div className="mt-2 pl-1 animate-in slide-in-from-top-1 duration-200">
                  <PreviousContent agentId={agent.id} />
                </div>
              )}
            </div>



          </div>
        </div>
      )}
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
