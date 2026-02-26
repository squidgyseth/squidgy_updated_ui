import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import CreateGroupChatModal from '../modals/CreateGroupChatModal';
import OptimizedAgentService from '../../services/optimizedAgentService';
import OnboardingService from '../../services/onboardingService';
import { supabase } from '../../lib/supabase';

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
  const { userId, profile, isImpersonating } = useUser();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [categories, setCategories] = useState<AssistantCategory[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);

  useEffect(() => {
    loadAgentsFromYAML();
  }, [userId, profile, isImpersonating]); // Refresh when user data changes (including impersonation)

  // Refresh agents when needed (can be called from outside)
  const refreshAgents = () => {
    loadAgentsFromYAML();
  };

  // Expose refresh function to window for N8N webhook calls
  useEffect(() => {
    (window as any).refreshAgentSidebar = refreshAgents;
    
    return () => {
      delete (window as any).refreshAgentSidebar;
    };
  }, []);

  // Subscribe to Supabase Realtime for agent refresh broadcasts from backend
  useEffect(() => {
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get the actual user_id from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', user.id)
          .single();

        if (!profile?.user_id) return;

        // Subscribe to broadcast channel for this user (backend sends refresh signals here)
        channel = supabase
          .channel(`agent-refresh-${profile.user_id}`)
          .on(
            'broadcast',
            { event: 'refresh_sidebar' },
            (payload) => {
              console.log('🔄 Sidebar refresh signal received from backend:', payload);
              // Refresh the sidebar when backend sends refresh signal
              loadAgentsFromYAML();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'assistant_personalizations',
              filter: `user_id=eq.${profile.user_id}`
            },
            (payload) => {
              console.log('🔄 Agent enablement change detected:', payload);
              // Refresh the sidebar when any change occurs
              loadAgentsFromYAML();
            }
          )
          .subscribe((status: string) => {
            console.log('📡 Realtime subscription status:', status);
          });

      } catch (error) {
        console.error('❌ Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    // Extract selected agent from URL
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'chat' && pathParts[2]) {
      setSelectedAssistant(pathParts[2]);
    }
  }, [location]);

  const loadAgentsFromYAML = async () => {
    try {
      // Use the useUser hook which properly handles impersonation
      if (!userId || !profile) {
        setCategories([]);
        return;
      }

      const actualUserId = profile.user_id;

      const agentService = OptimizedAgentService.getInstance();
      const onboardingService = OnboardingService.getInstance();
      const allAgentConfigs = agentService.getAllAgents();
      
      // Get platform-enabled agents from agents table
      const { data: platformAgents } = await supabase
        .from('agents')
        .select('agent_id, is_enabled')
        .eq('is_enabled', true);
      
      const platformEnabledIds = new Set(platformAgents?.map(a => a.agent_id) || []);
      
      // Get enabled agents for this user
      const enabledAgents = await onboardingService.getEnabledAgents(actualUserId);
      const enabledAgentIds = new Set(enabledAgents.map(agent => agent.assistant_id));
      
      // Always include Personal Assistant (pinned)
      enabledAgentIds.add('personal_assistant');
      platformEnabledIds.add('personal_assistant');
      
      // Filter configs to only show agents that are BOTH platform-enabled AND user-enabled
      const enabledConfigs = allAgentConfigs.filter(config => 
        enabledAgentIds.has(config.agent.id) && platformEnabledIds.has(config.agent.id)
      );
      
      
      // Transform configs to match sidebar format
      const assistants: Assistant[] = enabledConfigs.map((config) => {
        // Get custom data for this agent
        const customData = enabledAgents.find(agent => agent.assistant_id === config.agent.id);
        
        return {
          name: customData?.custom_name || config.agent.name,
          description: config.agent.description || config.agent.specialization || 'AI Assistant',
          avatar: config.agent.avatar || "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
          isOnline: true,
          id: config.agent.id,
          category: config.agent.category?.toUpperCase() || 'GENERAL',
          pinned: config.agent.pinned || false
        };
      });


      // Group by category
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
    // Here you would typically handle the group creation logic
  };

  const handleAssistantClick = (assistant: Assistant) => {
    if (assistant.id) {
      navigate(`/chat/${assistant.id}`, {
        state: { fromSidebar: true }
      });
      setSelectedAssistant(assistant.id);
    }
  };

  const handleAddNew = () => {
    navigate('/chat/personal_assistant', {
      state: {
        showAddNewMessage: true,
        addNewTimestamp: Date.now() // Force re-trigger on every click
      }
    });
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
    <div className="w-[284px] h-full flex flex-col border-r border-border-purple bg-white">
      {/* Header with Squidgy logo */}
      <div className="h-24 flex items-center justify-center gap-5 px-6 bg-header-gradient">
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/38911497e575307b8d9004ca969b8a56bbf75c3c?width=278"
          alt="Squidgy"
          className="w-[139px] h-12"
        />
      </div>
      
      {/* Assistant Controls */}
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-black leading-5">Your Assistants</h2>
        </div>
        <div className="flex items-start gap-2">
          {/* 
          <button 
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-squidgy-gradient text-white text-xs whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1839 13.7715V12.4889C12.1839 11.8086 11.9137 11.1562 11.4326 10.6751C10.9516 10.1941 10.2991 9.92383 9.6188 9.92383H5.77115C5.09085 9.92383 4.4384 10.1941 3.95735 10.6751C3.47631 11.1562 3.20605 11.8086 3.20605 12.4889V13.7715" stroke="white" strokeWidth="1.2825" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.69547 7.35872C9.11214 7.35872 10.2606 6.21028 10.2606 4.79362C10.2606 3.37695 9.11214 2.22852 7.69547 2.22852C6.27881 2.22852 5.13037 3.37695 5.13037 4.79362C5.13037 6.21028 6.27881 7.35872 7.69547 7.35872Z" stroke="white" strokeWidth="1.2825" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Group Chat</span>
          </button>
          */}
          <button 
            onClick={handleAddNew}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-squidgy-primary/10 text-squidgy-primary text-xs whitespace-nowrap"
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
                <span className="text-xs font-semibold text-squidgy-primary">{category.name}</span>
                {category.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-squidgy-primary bg-squidgy-primary/20 rounded-full">
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
