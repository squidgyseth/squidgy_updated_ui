import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Layers, ArrowLeft, Settings } from 'lucide-react';
import AgentPageCarousel from '../AgentPageCarousel';
import { AgentConfigService } from '../../services/agentConfigService';
import type { AgentCarouselConfig } from '../../types/carouselTypes';
import DynamicAgentDashboard from '../../pages/DynamicAgentDashboard';

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
    // Use DynamicAgentDashboard for ALL agents - no hardcoding!
    return (
      <div className={`h-full ${className}`}>
        <DynamicAgentDashboard />
      </div>
    );
  }
    
  // Fallback - also use DynamicAgentDashboard for consistency
  return (
    <div className={`h-full ${className}`}>
      <DynamicAgentDashboard />
    </div>
  );
}