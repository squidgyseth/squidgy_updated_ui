import React from 'react';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function SMMAssistantDashboard() {
  const configService = AgentConfigService.getInstance();

  // Get SMM Assistant configuration from YAML
  const agentConfig = configService.getMockAgentConfig('smm_assistant', {
    agent: {
      id: 'smm_assistant',
      name: 'SMM Assistant',
      category: 'MARKETING',
      description: 'Specializes in social media marketing, content creation, and trend analysis to help grow your online presence across all platforms.',
      specialization: 'Creative & Trendy',
      tagline: 'Trend. Post. Analyze.',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64',
      capabilities: [
        'Content creation and optimization for all major social platforms',
        'Trend analysis and hashtag research',
        'Social media strategy development and planning',
        'Engagement optimization and community management'
      ],
      recent_actions: [
        'Created 15 Instagram post ideas for fashion brand',
        'Analysed competitor performance',
        'Generated trending hashtags for Q4 campaign',
        'Developed content calendar for December'
      ]
    }
  });

  // Handle case where config is null
  if (!agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Agent Configuration Error</h2>
          <p className="text-gray-500">Failed to load SMM Assistant configuration</p>
        </div>
      </div>
    );
  }

  const agentInfo = {
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || '',
    avatar: agentConfig.agent.avatar,
    introMessage: `Hi! I'm your ${agentConfig.agent.name}. ${agentConfig.agent.tagline} I specialize in social media marketing, content creation, and trend analysis to help grow your online presence across all platforms.`
  };

  const suggestions = [
    'Create Instagram post ideas',
    'Analyze competitor content',
    'Write engaging captions',
    'Generate trending hashtags',
    'Plan content calendar',
    'Optimize engagement strategy'
  ];

  const handleSendMessage = (message: string) => {
    console.log('SMM Assistant - Message sent:', message);
    // Handle message sending logic here
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('SMM Assistant - Suggestion clicked:', suggestion);
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