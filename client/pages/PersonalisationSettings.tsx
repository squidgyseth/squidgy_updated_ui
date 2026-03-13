import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Check,
  Wand2,
  Briefcase,
  Smile,
  Save
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { supabase } from '../lib/supabase';
import OnboardingService from '../services/onboardingService';
import { useAdmin } from '../hooks/useAdmin';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  description: string;
  selected: boolean;
  hasCustomization?: boolean;
}

type AssistantTone = 'friendly' | 'professional' | 'casual';

export default function PersonalisationSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userId, profile, isReady, isAuthenticated } = useUser();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [assistantName, setAssistantName] = useState('');
  const [selectedTones, setSelectedTones] = useState<AssistantTone[]>(['friendly']);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Handle navigation state for auto-selecting agent
  useEffect(() => {
    const navigationState = location.state as { selectedAgent?: string; openSection?: string } | null;
    if (navigationState?.selectedAgent) {
      // We'll handle the agent selection after agents are loaded
    }
  }, [location.state]);

  // Load agents from compiled data with proper filtering
  useEffect(() => {
    const loadAgents = async () => {
      setLoading(true);
      try {
        // Get current user
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

        // Load agents from public compiled file
        const response = await fetch('/agents-compiled.json');
        const agentsData = await response.json();
        
        if (agentsData && agentsData.agents) {
          // Check if we should show all agents (local development override)
          const showAllAgents = import.meta.env.VITE_SHOW_ALL_AGENTS === 'true';
          
          // Get platform-enabled agents from agents table (skip if show_all_agents is true)
          let platformEnabledIds: Set<string>;
          
          if (showAllAgents) {
            // In local development with show_all_agents, all agents are considered platform-enabled
            platformEnabledIds = new Set(agentsData.agents.map((a: any) => a.agent.id));
          } else {
            const { data: platformAgents } = await supabase
              .from('agents')
              .select('agent_id, is_enabled')
              .eq('is_enabled', true);
            
            platformEnabledIds = new Set(platformAgents?.map(a => a.agent_id) || []);
          }

          // Get user-enabled agents from assistant_personalizations
          const onboardingService = OnboardingService.getInstance();
          const enabledAgents = await onboardingService.getEnabledAgents(actualUserId);
          const enabledAgentIds = new Set(enabledAgents.map(agent => agent.assistant_id));

          // Always include Personal Assistant
          enabledAgentIds.add('personal_assistant');
          platformEnabledIds.add('personal_assistant');

          // Filter agents to only show those that are BOTH platform-enabled AND user-enabled
          // Exception: Admin-only agents bypass user enablement check for admin users
          const filteredAgents = agentsData.agents.filter((agentData: any) => {
            const agentId = agentData.agent.id;
            const isAdminOnly = agentData.agent.admin_only === true;
            const isPlatformEnabled = platformEnabledIds.has(agentId);
            const isUserEnabled = enabledAgentIds.has(agentId);
            
            // Admin-only agents: show if user is admin AND platform-enabled
            if (isAdminOnly) {
              return isAdmin && isPlatformEnabled;
            }
            
            // Regular agents: must be both platform-enabled AND user-enabled
            return isPlatformEnabled && isUserEnabled;
          });

          const formattedAgents: Agent[] = filteredAgents.map((agentData: any) => ({
            id: agentData.agent.id,
            name: agentData.agent.name,
            avatar: agentData.agent.avatar,
            category: agentData.agent.category,
            description: agentData.agent.description,
            selected: false
          }));
          setAgents(formattedAgents);
          
          // Check for navigation state to auto-select agent
          const navigationState = location.state as { selectedAgent?: string; openSection?: string } | null;
          const preSelectedAgentId = navigationState?.selectedAgent;
          
          if (preSelectedAgentId) {
            // Find and select the agent from navigation state
            const preSelectedAgent = formattedAgents.find(a => a.id === preSelectedAgentId);
            if (preSelectedAgent) {
              setSelectedAgent(preSelectedAgent);
              setAgents(prev => prev.map(a => ({
                ...a, 
                selected: a.id === preSelectedAgentId
              })));
              
              // Load customization for the pre-selected agent
              await loadAgentCustomization(preSelectedAgentId, preSelectedAgent);
            } else {
              // Agent not found, fallback to default
              const defaultAgent = formattedAgents[0];
              if (defaultAgent) {
                setSelectedAgent(defaultAgent);
                setAgents(prev => prev.map(a => ({
                  ...a, 
                  selected: a.id === defaultAgent.id
                })));
                await loadAgentCustomization(defaultAgent.id, defaultAgent);
              }
            }
          } else {
            // No pre-selected agent, use default
            if (formattedAgents.length > 0) {
              const defaultAgent = formattedAgents[0];
              setSelectedAgent(defaultAgent);
              setAgents(prev => prev.map(a => ({
                ...a, 
                selected: a.id === defaultAgent.id
              })));
              
              // Load customization for the default agent
              await loadAgentCustomization(defaultAgent.id, defaultAgent);
            }
          }
          
          // Check which agents have existing customizations
          await checkExistingCustomizations(formattedAgents);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        toast.error('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    if (isReady && isAuthenticated) {
      loadAgents();
    }
  }, [isReady, isAuthenticated, location.state, isAdmin]); // Reload when admin status changes

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleAgentSelect = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setAgents(prev => prev.map(a => ({
        ...a,
        selected: a.id === agentId
      })));
      
      // Load existing customization for this agent
      await loadAgentCustomization(agentId, agent);
    }
  };

  const loadAgentCustomization = async (agentId: string, agent: Agent) => {
    if (!profile?.user_id) return;

    try {
      const { supabase } = await import('../lib/supabase');

      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('assistant_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading customization:', error);
        return;
      }

      if (data) {
        // Load existing customization
        setAssistantName(data.custom_name || agent.name);
        const savedTones = (data.communication_tone || 'friendly').split(',').map((tone: string) => tone.trim()) as AssistantTone[];
        setSelectedTones(savedTones);
      } else {
        // No existing customization, use defaults
        setAssistantName(agent.name);
        setSelectedTones(['friendly']);
      }
    } catch (error) {
      console.error('Error loading agent customization:', error);
      // Fallback to defaults
      setAssistantName(agent.name);
      setSelectedTones(['friendly']);
    }
  };

  const checkExistingCustomizations = async (agentList: Agent[]) => {
    if (!profile?.user_id) return;

    try {
      const { supabase } = await import('../lib/supabase');

      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('assistant_id')
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Error checking customizations:', error);
        return;
      }

      const customizedAgentIds = data?.map(item => item.assistant_id) || [];

      setAgents(prev => prev.map(agent => ({
        ...agent,
        hasCustomization: customizedAgentIds.includes(agent.id)
      })));
    } catch (error) {
      console.error('Error checking existing customizations:', error);
    }
  };

  const handleToneToggle = (tone: AssistantTone) => {
    setSelectedTones(prev => {
      if (prev.includes(tone)) {
        // Remove tone if already selected (but keep at least one)
        return prev.length > 1 ? prev.filter(t => t !== tone) : prev;
      } else {
        // Add tone if not selected
        return [...prev, tone];
      }
    });
  };

  const handleSave = async () => {
    if (!profile?.user_id || !selectedAgent) {
      toast.error('Please log in and select an agent');
      return;
    }

    if (!assistantName.trim()) {
      toast.error('Please enter an assistant name');
      return;
    }

    try {
      setSaving(true);

      const { supabase } = await import('../lib/supabase');

      const updateFields = {
        custom_name: assistantName.trim(),
        communication_tone: selectedTones.join(','),
        last_updated: new Date().toISOString()
      };


      // Check if a row already exists for this user+agent
      const { data: existing } = await supabase
        .from('assistant_personalizations')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('assistant_id', selectedAgent.id)
        .single();

      let error;
      if (existing) {
        // Update existing row
        ({ error } = await supabase
          .from('assistant_personalizations')
          .update(updateFields)
          .eq('user_id', profile.user_id)
          .eq('assistant_id', selectedAgent.id));
      } else {
        // Insert new row
        ({ error } = await supabase
          .from('assistant_personalizations')
          .insert({
            user_id: profile.user_id,
            assistant_id: selectedAgent.id,
            ...updateFields
          }));
      }

      if (error) {
        console.error('Supabase save error:', error);
        throw new Error(error.message || 'Failed to save assistant customization');
      }

      toast.success(`${selectedAgent.name} customization saved successfully!`);

      // Update the customization indicator for this agent
      setAgents(prev => prev.map(agent =>
        agent.id === selectedAgent.id
          ? { ...agent, hasCustomization: true }
          : agent
      ));
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };


  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SettingsLayout title="Personalisation Settings">
      {/* AI Assistant Customization */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-medium text-gray-900 mb-8">AI Assistant Customization</h2>
        
        {/* Assistant Name */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assistant Name
          </label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Agent Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Agent
          </label>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading agents...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No agents found. Please try refreshing the page.
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className="relative flex flex-col items-center group"
                >
                  <div className={`relative w-16 h-16 rounded-full overflow-hidden transition-all duration-200 ${
                    agent.selected 
                      ? 'ring-4 ring-purple-500 ring-offset-2' 
                      : 'ring-2 ring-transparent hover:ring-gray-300 hover:ring-offset-1'
                  }`}>
                    {agent.avatar ? (
                      <img 
                        src={agent.avatar} 
                        alt={agent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {agent.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    {agent.selected && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {agent.hasCustomization && !agent.selected && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900">
                      {agent.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assistant Tone */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assistant Tone
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Friendly Tone */}
            <button
              onClick={() => handleToneToggle('friendly')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTones.includes('friendly')
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTones.includes('friendly') ? 'bg-purple-600' : 'bg-purple-100'
                }`}>
                  <Wand2 className={`w-4 h-4 ${
                    selectedTones.includes('friendly') ? 'text-white' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Friendly</h3>
                    {selectedTones.includes('friendly') && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Warm, approachable tone
                  </p>
                </div>
              </div>
            </button>

            {/* Professional Tone */}
            <button
              onClick={() => handleToneToggle('professional')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTones.includes('professional')
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTones.includes('professional') ? 'bg-purple-600' : 'bg-blue-100'
                }`}>
                  <Briefcase className={`w-4 h-4 ${
                    selectedTones.includes('professional') ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Professional</h3>
                    {selectedTones.includes('professional') && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Business-oriented tone
                  </p>
                </div>
              </div>
            </button>

            {/* Casual Tone */}
            <button
              onClick={() => handleToneToggle('casual')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTones.includes('casual')
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedTones.includes('casual') ? 'bg-purple-600' : 'bg-teal-100'
                }`}>
                  <Smile className={`w-4 h-4 ${
                    selectedTones.includes('casual') ? 'text-white' : 'text-teal-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Casual</h3>
                    {selectedTones.includes('casual') && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Relaxed, conversational tone
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Personalization'}
          </button>
        </div>
      </div>
    </SettingsLayout>
  );
}
