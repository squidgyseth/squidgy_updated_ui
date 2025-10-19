import React, { useState } from 'react';
import { Settings, Pin, PinOff, MessageSquare, Zap, Clock, ChevronRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useUser } from '../../hooks/useUser';
import ChatHistory from '../chat/ChatHistory';

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
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { userId } = useUser();

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
                <h1 className="text-base font-medium bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">{agent.name}</h1>
                <p className="text-sm font-normal text-gray-500 mt-1">active • {agent.tagline}</p>
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

        {/* Configure Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="text-squidgy-primary" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">Configure</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleSettingsClick}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-squidgy-primary rounded-full"></div>
                <span className="text-sm text-gray-700">Configurable Data</span>
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
          <div className="p-6 border-b border-gray-100">
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

        {/* Previous Newsletters Section - Only for Newsletter Agent */}
        {agent.id === 'newsletter' && userId && (
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="text-squidgy-primary" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">Previous Newsletters</h3>
            </div>
            <ChatHistory
              userId={userId}
              agentId={agent.id}
              agentName={agent.name}
              onSessionSelect={(sessionId) => {
                console.log('Selected session:', sessionId);
                // TODO: Load session messages
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}