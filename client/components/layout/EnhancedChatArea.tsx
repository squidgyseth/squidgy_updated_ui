import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Layers, ArrowLeft, Settings } from 'lucide-react';
import AgentPageCarousel from '../AgentPageCarousel';
import { AgentConfigService } from '../../services/agentConfigService';
import type { AgentCarouselConfig } from '../../types/carouselTypes';
import NewsletterComponent from '../../pages/agents/newsletter/newsletter_liquid_blanch_17032840_page1';
import PersonalAssistantComponent from '../../pages/agents/personal_assistant/personal_dashboard';
import SMMAssistantComponent from '../../pages/agents/smm_assistant/dashboard';
import TestMultiAgentComponent from '../../pages/agents/test_multi_agent/dashboard';
import TestMultiPageAgentComponent from '../../pages/agents/test_multi_page_agent/dashboard';

interface EnhancedChatAreaProps {
  className?: string;
}

export default function EnhancedChatArea({ className = '' }: EnhancedChatAreaProps) {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [carouselConfig, setCarouselConfig] = useState<AgentCarouselConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'chat'>('carousel');

  const configService = AgentConfigService.getInstance();

  useEffect(() => {
    if (agentId) {
      loadAgentConfiguration();
    } else {
      // No agent selected - show welcome screen
      setIsLoading(false);
      setCarouselConfig(null);
    }
  }, [agentId]);

  /**
   * Load agent configuration and determine display mode
   */
  const loadAgentConfiguration = async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const config = await configService.getCarouselConfig(agentId);
      
      if (!config) {
        setError(`Agent "${agentId}" not found`);
        return;
      }

      setCarouselConfig(config);
      
      // Determine view mode based on pages
      if (config.pages && config.pages.length > 0) {
        setViewMode('carousel');
      } else {
        setViewMode('chat');
      }

    } catch (error: any) {
      console.error('Error loading agent config:', error);
      setError(`Failed to load agent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleGoBack = () => {
    navigate('/chat');
  };

  /**
   * Toggle between carousel and chat modes
   */
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'carousel' ? 'chat' : 'carousel');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Agent</h3>
          <p className="text-gray-500">Please wait while we prepare your assistant...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Agent Not Available</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={handleGoBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  // No agent selected - welcome screen
  if (!agentId || !carouselConfig) {
    return (
      <div className={`h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}>
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Squidgy</h2>
          <p className="text-gray-600 mb-6">
            Select an assistant from the sidebar to start exploring their capabilities. 
            Multi-page agents will open as interactive carousels with all their tools and features.
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-2">💡 Tip</h3>
            <p className="text-sm text-gray-600">
              Agents with multiple pages will show a carousel interface where you can navigate through different views and tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show carousel for multi-page agents - but bypass for clean chat interface
  if (viewMode === 'carousel' && carouselConfig.pages.length > 0) {
    // Instead of showing carousel with unwanted headers, directly load the page component
    const currentPage = carouselConfig.pages[0]; // Use first page
    if (currentPage) {
      // For newsletter agent, render the component directly
      if (carouselConfig.agentId === 'newsletter') {
        return (
          <div className={`h-full ${className}`}>
            <NewsletterComponent />
          </div>
        );
      }

      // For personal assistant agent
      if (carouselConfig.agentId === 'personal_assistant') {
        return (
          <div className={`h-full ${className}`}>
            <PersonalAssistantComponent />
          </div>
        );
      }

      // For SMM assistant agent
      if (carouselConfig.agentId === 'smm_assistant') {
        return (
          <div className={`h-full ${className}`}>
            <SMMAssistantComponent />
          </div>
        );
      }

      // For test multi-agent
      if (carouselConfig.agentId === 'test_multi_agent') {
        return (
          <div className={`h-full ${className}`}>
            <TestMultiAgentComponent />
          </div>
        );
      }

      // For test multi-page agent
      if (carouselConfig.agentId === 'test_multi_page_agent') {
        return (
          <div className={`h-full ${className}`}>
            <TestMultiPageAgentComponent />
          </div>
        );
      }
    }
    
    // Fallback to original carousel if not newsletter
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* Carousel Component */}
        <div className="flex-1">
          <AgentPageCarousel config={carouselConfig} />
        </div>
      </div>
    );
  }

  // Fallback to traditional chat interface
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-semibold">{carouselConfig.agentName}</h2>
              <p className="text-sm text-gray-500">{carouselConfig.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {carouselConfig.pages.length > 0 && (
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span className="text-sm">Page View</span>
              </button>
            )}
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Traditional Chat Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chat Mode</h3>
          <p className="text-gray-500 mb-4">Traditional chat interface with {carouselConfig.agentName}</p>
          {carouselConfig.pages.length > 0 && (
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Switch to Page View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}