import React, { useState } from 'react';
import { Settings, Pin, PinOff, MessageSquare, Zap, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

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
  recent_actions?: string[];
}

interface UniversalChatLayoutProps {
  agent: AgentConfig;
  children: React.ReactNode; // The actual agent interface (newsletter form, etc.)
  onPinToggle?: (agentId: string, pinned: boolean) => void;
  onSettingsClick?: (agentId: string) => void;
}

export default function UniversalChatLayout({ 
  agent, 
  children, 
  onPinToggle, 
  onSettingsClick 
}: UniversalChatLayoutProps) {
  const [isPinned, setIsPinned] = useState(agent.pinned || false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);

  const handlePinToggle = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    onPinToggle?.(agent.id, newPinnedState);
  };

  const handleSettingsClick = () => {
    onSettingsClick?.(agent.id);
  };

  return (
    <div className="flex h-full bg-white">
      {/* Main Chat/Content Area - Clean design matching screenshots */}
      <div className="flex-1 flex flex-col">
        {/* Simple Chat Header - matches screenshots exactly */}
        <div className="border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            {/* Left: Agent info */}
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
                <h1 className="text-lg font-semibold text-gray-900">{agent.name}</h1>
                <p className="text-sm text-gray-600">active • {agent.tagline}</p>
              </div>
              <button 
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition ml-2"
              >
                {isProfileExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            {/* Right: Action buttons */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
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

      {/* Right Sidebar - Agent Details - Exact match to screenshots */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        {/* Agent Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            {agent.avatar && (
              <img 
                src={agent.avatar} 
                alt={agent.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-squidgy-primary">{agent.name}</h2>
              {agent.specialization && (
                <p className="text-sm font-medium text-squidgy-primary mb-1">{agent.specialization}</p>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{agent.description}</p>

          {/* Action Buttons - matching screenshot colors */}
          <div className="flex space-x-3">
            <button 
              onClick={handleSettingsClick}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-squidgy-red text-white rounded-lg hover:bg-squidgy-red/90 transition font-medium text-sm"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button 
              onClick={handlePinToggle}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 border-2 border-squidgy-primary/30 text-squidgy-primary rounded-lg hover:bg-squidgy-primary/10 transition font-medium text-sm"
            >
              {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
              <span>{isPinned ? 'Pinned' : 'To pin'}</span>
            </button>
          </div>
        </div>

        {/* Configure Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="text-squidgy-primary" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">Configure</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-squidgy-primary rounded-full"></div>
                <span className="text-sm text-gray-700">Agent Settings</span>
              </div>
              <ChevronRight className="text-gray-400" size={14} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-squidgy-primary rounded-full"></div>
                <span className="text-sm text-gray-700">Customization Options</span>
              </div>
              <ChevronRight className="text-gray-400" size={14} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-squidgy-primary rounded-full"></div>
                <span className="text-sm text-gray-700">Integration Setup</span>
              </div>
              <ChevronRight className="text-gray-400" size={14} />
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

        {/* Recent Actions Section - matching screenshots exactly */}
        {agent.recent_actions && agent.recent_actions.length > 0 && (
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="text-squidgy-primary" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">Recent Actions</h3>
            </div>
            <div className="space-y-3">
              {agent.recent_actions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition cursor-pointer">
                  <div className="w-2 h-2 bg-squidgy-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">{action}</p>
                  </div>
                  <ChevronRight className="text-gray-400 mt-1 flex-shrink-0" size={14} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}