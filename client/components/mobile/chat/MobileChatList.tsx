import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Input } from '../../ui/input';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';
import OptimizedAgentService from '../../../services/optimizedAgentService';
import OnboardingService from '../../../services/onboardingService';
import { supabase } from '../../../lib/supabase';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface MobileChatListProps {
  agents?: Agent[];
  onAgentSelect?: (agent: Agent) => void;
  onCreateAgent?: () => void;
}

export function MobileChatList({
  agents: propAgents,
  onAgentSelect,
  onCreateAgent,
}: MobileChatListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    loadEnabledAgents();
  }, []);

  const loadEnabledAgents = async () => {
    try {
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAgents([]);
        return;
      }

      // Get the correct user_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        setAgents([]);
        return;
      }

      const actualUserId = profile.user_id;

      const agentService = OptimizedAgentService.getInstance();
      const onboardingService = OnboardingService.getInstance();
      const allAgentConfigs = agentService.getAllAgents();

      // Get enabled agents for this user
      const enabledAgents = await onboardingService.getEnabledAgents(actualUserId);
      const enabledAgentIds = new Set(enabledAgents.map(agent => agent.assistant_id));

      // Always include Personal Assistant (pinned)
      enabledAgentIds.add('personal_assistant');

      // Filter configs to only show enabled agents
      const enabledConfigs = allAgentConfigs.filter(config =>
        enabledAgentIds.has(config.agent.id)
      );

      // Transform configs to match mobile format
      const loadedAgents: Agent[] = enabledConfigs.map((config) => {
        // Get custom data for this agent
        const customData = enabledAgents.find(agent => agent.assistant_id === config.agent.id);

        return {
          id: config.agent.id,
          name: customData?.custom_name || config.agent.name,
          description: config.agent.description || config.agent.specialization || 'AI Assistant',
          avatar: config.agent.avatar || "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
          isOnline: true,
          lastMessageTime: '',
          unreadCount: 0,
        };
      });

      setAgents(loadedAgents);

    } catch (error) {
      console.error('Failed to load enabled agents:', error);
      setAgents([]);
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAgentClick = (agent: Agent) => {
    // Navigate to the agent's chat page
    navigate(`/chat/${agent.id}`, {
      state: { fromMobileList: true }
    });

    // Still call the callback if provided
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  const handleCreateAgent = () => {
    // Navigate to Personal Assistant with add new message
    navigate('/chat/personal_assistant', {
      state: {
        showAddNewMessage: true,
        addNewTimestamp: Date.now() // Force re-trigger on every click
      }
    });

    // Still call the callback if provided
    if (onCreateAgent) {
      onCreateAgent();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          {/* Squidgy Logo/Title */}
          <h1 className="text-2xl font-bold text-primary">
            Squidgy Chats
          </h1>
        </div>
        
        {/* Create Agent Button */}
        <TouchButton
          variant="ghost"
          size="icon"
          onClick={handleCreateAgent}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
        </TouchButton>
      </div>

      {/* Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search or Ask Squidgy AI"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted/30 border-muted focus:border-primary"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-1">
          {filteredAgents.map((agent) => (
            <MobileCard
              key={agent.id}
              variant="interactive"
              onClick={() => handleAgentClick(agent)}
              className="p-0 border-none bg-transparent hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Avatar with online status */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white">
                      {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  {agent.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">
                      {agent.name}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {agent.lastMessageTime}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {agent.description}
                  </p>
                </div>

                {/* Unread badge */}
                {agent.unreadCount && agent.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {agent.unreadCount > 99 ? '99+' : agent.unreadCount}
                  </Badge>
                )}
              </div>
            </MobileCard>
          ))}
        </div>

        {/* Empty state */}
        {filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No agents found
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchQuery 
                ? `No agents match "${searchQuery}". Try a different search term.`
                : 'Create your first AI assistant to get started.'
              }
            </p>
            {!searchQuery && (
              <TouchButton
                variant="gradient"
                className="mt-4"
                onClick={handleCreateAgent}
              >
                Create Agent
              </TouchButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
