import { useState, useEffect } from "react";
import DynamicAgentPage from "../DynamicAgentPage";
import { createProxyUrl } from "../../utils/urlMasking";

interface ChatAreaProps {
  selectedAssistant: string;
  onToggleDetails: () => void;
  onToggleSidebar: () => void;
  agentData?: any;
}

export default function ChatAreaV2({ 
  selectedAssistant, 
  onToggleDetails, 
  onToggleSidebar,
  agentData 
}: ChatAreaProps) {
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentData) {
      setCurrentAgent(agentData);
    } else {
      // Fetch agent data if not provided
      fetchAgentData(selectedAssistant);
    }
  }, [selectedAssistant, agentData]);

  const fetchAgentData = async (agentName: string) => {
    setIsLoading(true);
    try {
      // Try to fetch from database first
      const response = await fetch(`/api/agents/${agentName}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentAgent(data);
      } else {
        // Fallback to default agent
        setCurrentAgent({
          agent_id: agentName.toLowerCase().replace(/\s+/g, '_'),
          name: agentName,
          page_type: 'standard'
        });
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      // Use fallback
      setCurrentAgent({
        agent_id: agentName.toLowerCase().replace(/\s+/g, '_'),
        name: agentName,
        page_type: 'standard'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!currentAgent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select an agent to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-[72px] border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            {currentAgent.avatar_url && (
              <img 
                src={createProxyUrl(currentAgent.avatar_url, 'avatar')} 
                alt={currentAgent.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{currentAgent.name}</h2>
              <p className="text-sm text-gray-500">
                {currentAgent.description || 'AI Assistant'}
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={onToggleDetails}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Dynamic Agent Page */}
      <DynamicAgentPage
        agentId={currentAgent.agent_id}
        agentName={currentAgent.name}
        pageType={currentAgent.page_type}
        componentPath={currentAgent.generated_component_path}
      />
    </div>
  );
}
