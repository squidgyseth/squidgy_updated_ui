import React from 'react';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function TestMultiPageAgentDashboard() {
  const configService = AgentConfigService.getInstance();

  // Get Test Multi-Page Agent configuration
  const agentConfig = configService.getMockAgentConfig('test_multi_page_agent', {
    agent: {
      id: 'test_multi_page_agent',
      name: 'Test Multi-Page Agent',
      category: 'TESTING',
      description: 'Testing multi-page functionality with advanced navigation and complex user interface components.',
      specialization: 'Multi-Page Testing',
      tagline: 'Navigate. Test. Validate.',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64',
      capabilities: [
        'Multi-page navigation testing',
        'Complex UI component validation',
        'User journey optimization',
        'Interface responsiveness testing'
      ],
      recent_actions: [
        'Tested multi-page navigation flows',
        'Validated complex UI components',
        'Optimized user experience paths',
        'Analyzed interface responsiveness'
      ]
    }
  });

  // Handle case where config is null
  if (!agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Agent Configuration Error</h2>
          <p className="text-gray-500">Failed to load Test Multi-Page Agent configuration</p>
        </div>
      </div>
    );
  }

  const agentInfo = {
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || '',
    avatar: agentConfig.agent.avatar,
    introMessage: `Hi! I'm your ${agentConfig.agent.name}. ${agentConfig.agent.tagline} I'm here to help with testing multi-page functionality, navigation flows, and complex UI components.`
  };

  const suggestions = [
    'Test navigation flows',
    'Validate UI components',
    'Optimize user journeys',
    'Check responsiveness',
    'Run page tests',
    'Analyze performance'
  ];

  const handleSendMessage = (message: string) => {
    console.log('Test Multi-Page Agent - Message sent:', message);
    // Handle message sending logic here
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Test Multi-Page Agent - Suggestion clicked:', suggestion);
    handleSendMessage(suggestion);
  };

  return (
    <UniversalChatLayout agent={agentConfig.agent}>
      <CleanChatInterface
        agent={agentInfo}
        onSendMessage={handleSendMessage}
        onSuggestionClick={handleSuggestionClick}
        suggestions={suggestions}
      />
    </UniversalChatLayout>
  );
}