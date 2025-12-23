import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateGroupChatModal from '../modals/CreateGroupChatModal';
import OptimizedAgentService from '../../services/optimizedAgentService';
import { usePlatform, usePlatformTheme } from '../../contexts/PlatformContext';

interface Assistant {
  name: string;
  description: string;
  avatar: string;
  isOnline: boolean;
  isSelected?: boolean;
  id?: string;
  category?: string;
  pinned?: boolean;
}

interface AssistantCategory {
  name: string;
  count: number;
  assistants: Assistant[];
}

export default function CategorizedAgentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [categories, setCategories] = useState<AssistantCategory[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { platform } = usePlatform();
  const theme = usePlatformTheme();

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      try {
        const agentService = OptimizedAgentService.getInstance();
        // Ensure database agents are loaded first, passing platform ID for cache invalidation
        await agentService.loadAvailableAgents(platform.id);
        // Now get the filtered agents
        loadAgentsFromService();
      } catch (error) {
        console.error('Failed to load agents from database:', error);
        loadAgentsFromService();
      } finally {
        setIsLoading(false);
      }
    };
    loadAgents();
  }, [platform.id]);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'chat' && pathParts[2]) {
      setSelectedAssistant(pathParts[2]);
    }
  }, [location]);

  const loadAgentsFromService = () => {
    try {
      const agentService = OptimizedAgentService.getInstance();
      const agentConfigs = agentService.getAllAgents();
      
      console.log(`🤖 Loading ${agentConfigs.length} agents for platform: ${platform.id}`);
      
      const assistants: Assistant[] = agentConfigs.map((config) => ({
        name: config.agent.name,
        description: config.agent.description || config.agent.specialization || 'AI Assistant',
        avatar: config.agent.avatar || "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
        isOnline: true,
        id: config.agent.id,
        category: config.agent.category?.toUpperCase() || 'GENERAL',
        pinned: config.agent.pinned || false
      }));

      const grouped = groupAssistantsByCategory(assistants);
      setCategories(grouped);
      
    } catch (error) {
      console.error('Failed to load agents:', error);
      setCategories([]);
    }
  };

  const groupAssistantsByCategory = (assistants: Assistant[]): AssistantCategory[] => {
    const grouped: Record<string, Assistant[]> = {};
    const pinnedAssistants: Assistant[] = [];
    
    // Separate pinned and regular assistants
    assistants.forEach(assistant => {
      if (assistant.pinned) {
        pinnedAssistants.push(assistant);
      } else {
        const category = assistant.category || 'GENERAL';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(assistant);
      }
    });
    
    // Convert to category format with proper counts
    const categories = Object.entries(grouped).map(([categoryName, categoryAssistants]) => ({
      name: categoryName,
      count: categoryName === 'PINNED' ? 0 : categoryAssistants.length, 
      assistants: categoryAssistants
    }));

    // Add PINNED category first if there are pinned assistants
    if (pinnedAssistants.length > 0) {
      const pinnedCategory = {
        name: 'PINNED',
        count: 0,
        assistants: pinnedAssistants
      };
      return [pinnedCategory, ...categories];
    }

    return categories;
  };


  const handleCreateGroup = (groupName: string, selectedAssistants: string[]) => {
    console.log('Creating group:', groupName, 'with assistants:', selectedAssistants);
    // Here you would typically handle the group creation logic
  };

  const handleAssistantClick = (assistant: Assistant) => {
    if (assistant.id) {
      navigate(`/chat/${assistant.id}`);
      setSelectedAssistant(assistant.id);
    }
  };

  const AssistantItem = ({ assistant, isSelected = false }: { assistant: Assistant; isSelected?: boolean }) => (
    <div 
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-bg-selected border-2 border-squidgy-primary/60 shadow-md' : 'hover:bg-bg-hover'
      }`}
      onClick={() => handleAssistantClick(assistant)}
    >
      <div className="relative">
        <img 
          src={assistant.avatar} 
          alt={assistant.name}
          className="w-8 h-8 rounded-full"
        />
        {assistant.isOnline && (
          <div className="absolute -bottom-0 -right-0 w-2 h-2 bg-text-success rounded-full border border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold leading-5 ${isSelected ? 'text-squidgy-primary' : 'text-black'}`}>
          {assistant.name}
        </h3>
        <p className="text-xs text-text-secondary leading-4">
          {assistant.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-[284px] h-full flex flex-col border-r border-gray-200 bg-white">
      {/* Header with Platform logo */}
      <div className="h-24 flex items-center justify-center gap-5 px-6 bg-white border-b border-gray-200">
        {platform.id === 'squidgy' ? (
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
            alt="Squidgy"
            className="w-[139px] h-12"
          />
        ) : (
          <span 
            className="text-3xl font-bold"
            style={{
              background: `linear-gradient(107deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {platform.displayName}
          </span>
        )}
      </div>
      
      {/* Assistant Controls */}
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-black leading-5">Your Assistants</h2>
        </div>
        <div className="flex items-start gap-2">
          <button 
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-xs whitespace-nowrap"
            style={{
              background: `linear-gradient(107deg, ${theme.gradientStart}, ${theme.gradientMid}, ${theme.gradientEnd})`
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1839 13.7715V12.4889C12.1839 11.8086 11.9137 11.1562 11.4326 10.6751C10.9516 10.1941 10.2991 9.92383 9.6188 9.92383H5.77115C5.09085 9.92383 4.4384 10.1941 3.95735 10.6751C3.47631 11.1562 3.20605 11.8086 3.20605 12.4889V13.7715" stroke="white" strokeWidth="1.2825" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.69547 7.35872C9.11214 7.35872 10.2606 6.21028 10.2606 4.79362C10.2606 3.37695 9.11214 2.22852 7.69547 2.22852C6.27881 2.22852 5.13037 3.37695 5.13037 4.79362C5.13037 6.21028 6.27881 7.35872 7.69547 7.35872Z" stroke="white" strokeWidth="1.2825" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Group Chat</span>
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs whitespace-nowrap"
            style={{
              backgroundColor: `${theme.primaryColor}15`,
              color: theme.primaryColor
            }}
          >
            <span className="text-sm">+</span>
            <span>Add New</span>
          </button>
        </div>
      </div>
      
      {/* Assistant Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.name} className="px-6 py-2">
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-2">
              {category.name === "PINNED" && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 9.91699V12.8337" stroke="#5E17EB" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.24984 6.27699C5.24972 6.49404 5.18906 6.70675 5.07467 6.89122C4.96029 7.07568 4.79671 7.22457 4.60234 7.32116L3.564 7.84616C3.36963 7.94275 3.20605 8.09164 3.09167 8.2761C2.97728 8.46056 2.91662 8.67328 2.9165 8.89033V9.33366C2.9165 9.48837 2.97796 9.63674 3.08736 9.74614C3.19675 9.85553 3.34513 9.91699 3.49984 9.91699H10.4998C10.6545 9.91699 10.8029 9.85553 10.9123 9.74614C11.0217 9.63674 11.0832 9.48837 11.0832 9.33366V8.89033C11.0831 8.67328 11.0224 8.46056 10.908 8.2761C10.7936 8.09164 10.63 7.94275 10.4357 7.84616L9.39734 7.32116C9.20296 7.22457 9.03939 7.07568 8.925 6.89122C8.81061 6.70675 8.74995 6.49404 8.74984 6.27699V4.08366C8.74984 3.92895 8.8113 3.78058 8.92069 3.67118C9.03009 3.56178 9.17846 3.50033 9.33317 3.50033C9.64259 3.50033 9.93934 3.37741 10.1581 3.15862C10.3769 2.93982 10.4998 2.64308 10.4998 2.33366C10.4998 2.02424 10.3769 1.72749 10.1581 1.5087C9.93934 1.28991 9.64259 1.16699 9.33317 1.16699H4.6665C4.35708 1.16699 4.06034 1.28991 3.84155 1.5087C3.62275 1.72749 3.49984 2.02424 3.49984 2.33366C3.49984 2.64308 3.62275 2.93982 3.84155 3.15862C4.06034 3.37741 4.35708 3.50033 4.6665 3.50033C4.82121 3.50033 4.96959 3.56178 5.07898 3.67118C5.18838 3.78058 5.24984 3.92895 5.24984 4.08366V6.27699Z" stroke="#5E17EB" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold" style={{ color: theme.primaryColor }}>{category.name}</span>
                {category.count > 0 && (
                  <span 
                    className="px-2 py-0.5 text-xs font-semibold rounded-full"
                    style={{
                      color: theme.primaryColor,
                      backgroundColor: `${theme.primaryColor}20`
                    }}
                  >
                    {category.count}
                  </span>
                )}
              </div>
            </div>
            
            {/* Assistants */}
            <div className="space-y-2">
              {category.assistants.map((assistant) => (
                <AssistantItem 
                  key={assistant.name}
                  assistant={assistant}
                  isSelected={selectedAssistant === assistant.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Chat Modal */}
      <CreateGroupChatModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}