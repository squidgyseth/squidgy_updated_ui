import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout, MobileChatList, MobileChatWindow } from '../../components/mobile';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

export default function MobileChatsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    // Load messages for this agent (in real app, fetch from API)
    setMessages([
      {
        id: '1',
        content: `Hey there! I'm your ${agent.name}. I'm here to help you with ${agent.description.toLowerCase()}. How can I assist you today?`,
        timestamp: new Date(),
        isUser: false,
      },
    ]);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedAgent) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate agent response (in real app, send to API)
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thanks for your message! I understand you said: "${content}". Let me help you with that.`,
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, agentResponse]);
    }, 1000);
  };

  const handleCreateAgent = () => {
    navigate('/create-agent');
  };

  const handleBack = () => {
    setSelectedAgent(null);
  };

  return (
    <MobileLayout showBottomNav={!selectedAgent}>
      {selectedAgent ? (
        <MobileChatWindow
          agent={selectedAgent}
          messages={messages}
          onBack={handleBack}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <MobileChatList
          onAgentSelect={handleAgentSelect}
          onCreateAgent={handleCreateAgent}
        />
      )}
    </MobileLayout>
  );
}
