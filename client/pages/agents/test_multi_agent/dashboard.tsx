import React from 'react';
import UniversalChatLayout from '../../../components/layout/UniversalChatLayout';
import CleanChatInterface from '../../../components/chat/CleanChatInterface';
import { AgentConfigService } from '../../../services/agentConfigService';

export default function TestMultiAgentDashboard() {
  const configService = AgentConfigService.getInstance();

  // Get Test Multi-Agent configuration from YAML
  const [agentConfig, setAgentConfig] = React.useState(null);

  React.useEffect(() => {
    const loadAgentConfig = async () => {
      const config = await configService.loadAgentConfig('test_multi_agent');
      if (config) {
        setAgentConfig(config);
        console.log('Test Multi-Agent config loaded from YAML:', config.agent.name);
      } else {
        console.error('Failed to load Test Multi-Agent config from YAML');
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
          <p className="text-gray-500">Failed to load Test Multi-Agent configuration</p>
        </div>
      </div>
    );
  }

  const agentInfo = {
    name: agentConfig.agent.name,
    tagline: agentConfig.agent.tagline || '',
    avatar: agentConfig.agent.avatar,
    introMessage: `Hi! I'm your ${agentConfig.agent.name}. ${agentConfig.agent.tagline} I'm here to help with testing multi-agent code generation systems, advanced AI workflows, and system integration testing.`
  };

  const suggestions = [
    'Generate test cases',
    'Run system diagnostics',
    'Optimize performance',
    'Create integration tests',
    'Validate workflows',
    'Analyze metrics'
  ];

  const handleSendMessage = (message: string) => {
    console.log('Test Multi-Agent - Message sent:', message);
    // Handle message sending logic here
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Test Multi-Agent - Suggestion clicked:', suggestion);
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