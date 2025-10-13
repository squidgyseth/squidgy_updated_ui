import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  TrendingUp, 
  Briefcase, 
  HeadphonesIcon,
  Settings,
  Plus,
  Pin,
  MoreVertical,
  Layers
} from 'lucide-react';

interface AgentPage {
  name: string;
  path: string;
  order: number;
}

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  avatar?: string;
  pinned?: boolean;
  pages?: AgentPage[];
  isActive?: boolean;
}

interface AgentCategory {
  name: string;
  displayName: string;
  color: string;
  icon: React.ReactNode;
  agents: Agent[];
  isExpanded?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  MARKETING: <TrendingUp className="w-4 h-4" />,
  SALES: <Briefcase className="w-4 h-4" />,
  HR: <Users className="w-4 h-4" />,
  SUPPORT: <HeadphonesIcon className="w-4 h-4" />,
  OPERATIONS: <Settings className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  MARKETING: 'purple',
  SALES: 'blue',
  HR: 'green',
  SUPPORT: 'orange',
  OPERATIONS: 'gray',
};

export default function CategorizedAgentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [pinnedAgents, setPinnedAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    // Parse current path to determine selected agent and page
    const pathParts = location.pathname.split('/');
    if (pathParts.includes('agents') && pathParts.length > 3) {
      const agentIndex = pathParts.indexOf('agents');
      setSelectedAgent(pathParts[agentIndex + 1] || null);
      setSelectedPage(pathParts[agentIndex + 2] || null);
    }
  }, [location]);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents/list');
      
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.status}`);
      }
      
      const agentConfigs = await response.json();
      
      // Transform agent configs from YAML to sidebar format
      const agents: Agent[] = agentConfigs.map((config: any) => ({
        id: config.agent.id,
        name: config.agent.name,
        category: config.agent.category,
        description: config.agent.description,
        avatar: config.agent.avatar,
        pinned: config.agent.pinned || false,
        pages: config.ui_use?.pages?.map((page: any) => ({
          name: page.name,
          path: page.path,
          order: page.order
        })) || [],
        isActive: false
      }));
      
      // Group agents by category
      const grouped = groupAgentsByCategory(agents);
      setCategories(grouped);
      
      // Filter pinned agents
      const pinned = agents.filter(a => a.pinned);
      setPinnedAgents(pinned);
      
      // Auto-expand categories with active agents
      const categoriesToExpand = new Set<string>();
      grouped.forEach(cat => {
        if (cat.agents.some(a => a.isActive)) {
          categoriesToExpand.add(cat.name);
        }
      });
      setExpandedCategories(categoriesToExpand);
      
      console.log('Loaded agents from API:', agents);
      
    } catch (error) {
      console.error('Failed to load agents:', error);
      // Show error state instead of mock data
      setCategories([]);
    }
  };

  const groupAgentsByCategory = (agents: Agent[]): AgentCategory[] => {
    const grouped: Record<string, Agent[]> = {};
    
    agents.forEach(agent => {
      const category = agent.category.toUpperCase();
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(agent);
    });

    return Object.entries(grouped).map(([category, agents]) => ({
      name: category,
      displayName: category.charAt(0) + category.slice(1).toLowerCase(),
      color: categoryColors[category] || 'gray',
      icon: categoryIcons[category] || <Settings className="w-4 h-4" />,
      agents: agents.sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAgentClick = (agent: Agent) => {
    // Always navigate to /chat/{agent.id} 
    // The carousel component will handle page navigation
    navigate(`/chat/${agent.id}`);
    setSelectedAgent(agent.id);
  };

  const handlePageClick = (agent: Agent, page: AgentPage) => {
    navigate(`/chat/agents/${agent.id}/${page.path}`);
    setSelectedAgent(agent.id);
    setSelectedPage(page.path);
  };

  const togglePin = (agent: Agent) => {
    // Toggle pin status
    // This would call an API to persist the change
    console.log('Toggle pin for:', agent.name);
  };

  const getMockCategories = (): AgentCategory[] => {
    return [
      {
        name: 'MARKETING',
        displayName: 'Marketing',
        color: 'purple',
        icon: categoryIcons.MARKETING,
        agents: [
          { 
            id: 'newsletter', 
            name: 'Newsletter Agent',
            category: 'MARKETING',
            description: 'Create and manage newsletters',
            pinned: true
          },
          { 
            id: 'smm_assistant', 
            name: 'SMM Assistant',
            category: 'MARKETING',
            description: 'Social media marketing',
            pages: [
              { name: 'Dashboard', path: 'dashboard', order: 1 },
              { name: 'Analytics', path: 'analytics', order: 2 },
              { name: 'Content', path: 'content', order: 3 }
            ]
          },
          { 
            id: 'content_strategist', 
            name: 'Content Strategist',
            category: 'MARKETING',
            description: 'Content planning'
          }
        ]
      },
      {
        name: 'SALES',
        displayName: 'Sales',
        color: 'blue', 
        icon: categoryIcons.SALES,
        agents: [
          { 
            id: 'lead_generator', 
            name: 'Lead Generator',
            category: 'SALES',
            description: 'Find leads fast'
          },
          { 
            id: 'crm_updater', 
            name: 'CRM Updater',
            category: 'SALES',
            description: 'Keep data clean'
          }
        ]
      },
      {
        name: 'HR',
        displayName: 'HR',
        color: 'green',
        icon: categoryIcons.HR,
        agents: [
          { 
            id: 'recruiter_assistant', 
            name: 'Recruiter Assistant',
            category: 'HR',
            description: 'Hire with ease'
          },
          { 
            id: 'onboarding_coach', 
            name: 'Onboarding Coach',
            category: 'HR',
            description: 'Smooth onboarding'
          }
        ]
      }
    ];
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Assistants</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Group Chat
            </button>
            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Pinned Section */}
        {pinnedAgents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 uppercase mb-2">
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </div>
            <div className="space-y-1">
              {pinnedAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedAgent === agent.id 
                      ? 'bg-purple-50 border border-purple-300' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {agent.avatar ? (
                    <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {categories.map(category => (
          <div key={category.name} className="mb-4">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-${category.color}-600`}>
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
                <span className={`text-${category.color}-600`}>
                  {category.icon}
                </span>
                <span className="text-sm font-medium uppercase text-gray-700">
                  {category.displayName}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 bg-${category.color}-100 text-${category.color}-700 rounded-full`}>
                {category.agents.length}
              </span>
            </button>

            {/* Category Agents */}
            {expandedCategories.has(category.name) && (
              <div className="mt-2 space-y-1 pl-8">
                {category.agents.map(agent => (
                  <div key={agent.id}>
                    <button
                      onClick={() => handleAgentClick(agent)}
                      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedAgent === agent.id 
                          ? `bg-${category.color}-50 border border-${category.color}-300` 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full bg-${category.color}-200 flex items-center justify-center`}>
                          <span className="text-xs font-semibold">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{agent.name}</p>
                          {agent.pages && agent.pages.length > 1 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Layers className="w-3 h-3" />
                              {agent.pages.length}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{agent.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(agent);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </button>

                    {/* Sub-pages for multi-page agents */}
                    {selectedAgent === agent.id && agent.pages && agent.pages.length > 1 && (
                      <div className="ml-11 mt-1 space-y-1">
                        {agent.pages
                          .sort((a, b) => a.order - b.order)
                          .map(page => (
                            <button
                              key={page.path}
                              onClick={() => handlePageClick(agent, page)}
                              className={`w-full px-3 py-1.5 text-left text-sm rounded-md transition-colors ${
                                selectedPage === page.path
                                  ? `bg-${category.color}-100 text-${category.color}-700`
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {page.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          Log Out
        </button>
      </div>
    </div>
  );
}