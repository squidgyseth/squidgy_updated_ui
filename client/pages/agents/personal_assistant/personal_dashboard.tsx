import React from 'react';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function PersonalDashboard() {
  const configService = AgentConfigService.getInstance();

  // Get Personal Assistant configuration from YAML
  const [agentConfig, setAgentConfig] = React.useState(null);

  React.useEffect(() => {
    const loadAgentConfig = async () => {
      const config = await configService.loadAgentConfig('personal_assistant');
      if (config) {
        setAgentConfig(config);
        console.log('Personal Assistant config loaded from YAML:', config.agent.name);
      } else {
        console.error('Failed to load Personal Assistant config from YAML');
      }
    };
    
    loadAgentConfig();
  }, [configService]);

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