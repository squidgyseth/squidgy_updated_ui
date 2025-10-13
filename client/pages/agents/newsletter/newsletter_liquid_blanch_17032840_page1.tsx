import React, { useState } from 'react';
import { useUser } from '../../../hooks/useUser';
import { sendToN8nWorkflow } from '../../../lib/n8nService';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function NewsletterNewsletterLiquidBlanch17032840Page1() {
  const { userId, sessionId } = useUser();
  
  // Get agent configuration
  const agentService = AgentConfigService.getInstance();
  const [agentConfig, setAgentConfig] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  React.useEffect(() => {
    // Load newsletter agent config
    const agentId = 'newsletter';
    const config = agentService.getMockAgentConfig(agentId);
    
    if (config) {
      setAgentConfig(config);
      console.log('Newsletter agent config loaded:', config.agent.name);
    } else {
      console.error('Failed to load newsletter agent config');
    }
  }, []);
  
  // Chat handlers
  const handleSendMessage = async (message: string) => {
    setIsGenerating(true);
    
    try {
      console.log('Sending newsletter request:', message);
      
      // Send to N8n workflow
      await sendToN8nWorkflow(userId, JSON.stringify({
        content: message,
        type: 'newsletter_generation'
      }), 'newsletter', sessionId, {});
      
      console.log('Newsletter generation request sent successfully');
      
    } catch (error) {
      console.error('Failed to send newsletter request:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Suggestion clicked:', suggestion);
    // This will auto-send the suggestion through CleanChatInterface
  };

  const handlePinToggle = (agentId: string, pinned: boolean) => {
    console.log(`Agent ${agentId} pin toggled to: ${pinned}`);
  };

  const handleSettingsClick = (agentId: string) => {
    console.log(`Settings clicked for agent: ${agentId}`);
  };

  // If agent config is not loaded yet, show loading
  if (!agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  // Create agent info for CleanChatInterface  
  const agentInfo = {
    id: agentConfig.agent.id,
    name: agentConfig.agent.name,
    avatar: agentConfig.agent.avatar,
    tagline: agentConfig.agent.tagline,
    introMessage: `Hi! I'm your ${agentConfig.agent.name}. ${agentConfig.agent.tagline} I'm here to help you create engaging newsletters, process content, and optimize your email marketing. What newsletter project can I help you with today?`,
    suggestionButtons: [
      'Create newsletter content',
      'Process PDF document',
      'Generate email templates'
    ]
  };

  return (
    <UniversalChatLayout 
      agent={agentConfig.agent}
      onPinToggle={handlePinToggle}
      onSettingsClick={handleSettingsClick}
    >
      <CleanChatInterface
        agent={agentInfo}
        onSendMessage={handleSendMessage}
        onSuggestionClick={handleSuggestionClick}
      />
    </UniversalChatLayout>
  );
}