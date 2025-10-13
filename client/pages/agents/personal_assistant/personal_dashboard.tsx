import React from 'react';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function PersonalDashboard() {
  const configService = AgentConfigService.getInstance();

  // Get Personal Assistant configuration
  const agentConfig = configService.getMockAgentConfig('personal_assistant', {
    agent: {
      id: 'personal_assistant',
      name: 'Personal Assistant',
      category: 'GENERAL',
      description: 'Your versatile personal assistant ready to help with any task, from scheduling and organization to research and general support.',
      specialization: 'Always Ready to Help',
      tagline: 'Organize. Schedule. Support.',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64',
      capabilities: [
        'Task management and scheduling coordination',
        'Research and information gathering', 
        'Email drafting and communication support',
        'Document organization and file management',
        'Calendar management and appointment scheduling',
        'Travel planning and logistics coordination'
      ],
      recent_actions: [
        'Organized calendar for next week\'s meetings',
        'Researched market trends for quarterly report',
        'Drafted follow-up emails for client meetings', 
        'Scheduled team meetings for project kickoff'
      ]
    }
  });

  // Handle case where config is null
  if (!agentConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Agent Configuration Error</h2>
          <p className="text-gray-500">Failed to load Personal Assistant configuration</p>
        </div>
      </div>
    );
  }

  const agentInfo = {
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || '',
    avatar: agentConfig.agent.avatar,
    introMessage: `Hi! I'm your ${agentConfig.agent.name}. ${agentConfig.agent.tagline} I'm here to help you with any task, from scheduling and organization to research and general support. How can I assist you today?`
  };

  const suggestions = [
    'Help me organize my schedule for this week',
    'Draft a professional email for me',
    'Research latest industry trends',
    'Create a task list for my project',
    'Schedule a meeting with my team',
    'Help me plan my upcoming trip'
  ];

  const handleSendMessage = (message: string) => {
    console.log('Personal Assistant - Message sent:', message);
    // Handle message sending logic here
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Personal Assistant - Suggestion clicked:', suggestion);
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