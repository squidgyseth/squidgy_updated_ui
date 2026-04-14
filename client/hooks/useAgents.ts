import { useState, useEffect } from 'react';
import DatabaseAgentService, { type AgentConfig } from '@/services/databaseAgentService';

const agentService = DatabaseAgentService.getInstance();

export function useAgents() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentService.getAllAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAgents = async () => {
    try {
      const data = await agentService.refreshAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh agents');
      console.error('Error refreshing agents:', err);
    }
  };

  return {
    agents,
    loading,
    error,
    refreshAgents,
  };
}

export function useAgentById(agentId: string) {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const data = await agentService.getAgentById(agentId);
      setAgent(data);
    } catch (err) {
      console.error('Error loading agent:', err);
    } finally {
      setLoading(false);
    }
  };

  return { agent, loading };
}

export function useAgentsByCategory() {
  const [agentsByCategory, setAgentsByCategory] = useState<Record<string, AgentConfig[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentsByCategory();
  }, []);

  const loadAgentsByCategory = async () => {
    try {
      setLoading(true);
      const data = await agentService.getAgentsByCategory();
      setAgentsByCategory(data);
    } catch (err) {
      console.error('Error loading agents by category:', err);
    } finally {
      setLoading(false);
    }
  };

  return { agentsByCategory, loading };
}

export function useVisibleAgents() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisibleAgents();
  }, []);

  const loadVisibleAgents = async () => {
    try {
      setLoading(true);
      const data = await agentService.getVisibleAgents();
      setAgents(data);
    } catch (err) {
      console.error('Error loading visible agents:', err);
    } finally {
      setLoading(false);
    }
  };

  return { agents, loading };
}

export function useVisibleAgentsByCategory() {
  const [agentsByCategory, setAgentsByCategory] = useState<Record<string, AgentConfig[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisibleAgentsByCategory();
  }, []);

  const loadVisibleAgentsByCategory = async () => {
    try {
      setLoading(true);
      const data = await agentService.getVisibleAgentsByCategory();
      setAgentsByCategory(data);
    } catch (err) {
      console.error('Error loading visible agents by category:', err);
    } finally {
      setLoading(false);
    }
  };

  return { agentsByCategory, loading };
}
