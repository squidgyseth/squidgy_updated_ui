import { AgentConfig } from '../data/agents';

interface CompiledAgents {
  agents: AgentConfig[];
}

class AgentMappingService {
  private static instance: AgentMappingService;
  private agentMap: Map<string, string> = new Map();
  private isLoaded = false;

  private constructor() {}

  static getInstance(): AgentMappingService {
    if (!AgentMappingService.instance) {
      AgentMappingService.instance = new AgentMappingService();
    }
    return AgentMappingService.instance;
  }

  async loadAgentMappings(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load from compiled agents JSON
      const response = await fetch('/agents-compiled.json');
      const compiledAgents: CompiledAgents = await response.json();

      // Create mapping from agent names to IDs
      compiledAgents.agents.forEach(agentConfig => {
        const { id, name } = agentConfig.agent;
        
        // Map both lowercase name and exact name for flexible matching
        this.agentMap.set(name.toLowerCase(), id);
        
        // Also map common variations
        const normalizedName = name.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/assistant|agent/g, '')
          .trim();
        
        if (normalizedName !== name.toLowerCase()) {
          this.agentMap.set(normalizedName, id);
        }
        
        // Map specific variations for better matching
        if (name.toLowerCase().includes('newsletter')) {
          this.agentMap.set('newsletter', id);
          this.agentMap.set('newsletter agent', id);
        }
        
        if (name.toLowerCase().includes('solar')) {
          this.agentMap.set('solar sales', id);
          this.agentMap.set('solar', id);
          this.agentMap.set('sol', id);
        }
        
        if (name.toLowerCase().includes('content')) {
          this.agentMap.set('content strategist', id);
          this.agentMap.set('content repurposer', id);
          this.agentMap.set('content', id);
        }
        
        if (name.toLowerCase().includes('smm') || name.toLowerCase().includes('social media')) {
          this.agentMap.set('smm', id);
          this.agentMap.set('social media', id);
          this.agentMap.set('smm assistant', id);
        }
        
        if (name.toLowerCase().includes('personal')) {
          this.agentMap.set('personal', id);
          this.agentMap.set('personal assistant', id);
        }
      });

      this.isLoaded = true;
      console.log('🔍 Agent mappings loaded:', Array.from(this.agentMap.entries()));
    } catch (error) {
      console.error('Failed to load agent mappings:', error);
      
      // Fallback to hardcoded mappings if file load fails
      this.createFallbackMappings();
    }
  }

  private createFallbackMappings(): void {
    const fallbackMappings = [
      ['newsletter', 'newsletter'],
      ['newsletter agent', 'newsletter'],
      ['solar sales assistant', 'SOL'],
      ['solar sales', 'SOL'],
      ['sol', 'SOL'],
      ['content strategist', 'content_repurposer'],
      ['content repurposer', 'content_repurposer'],
      ['smm assistant', 'smm_assistant'],
      ['social media', 'smm_assistant'],
      ['smm', 'smm_assistant'],
      ['personal assistant', 'personal_assistant'],
      ['personal', 'personal_assistant'],
    ];

    fallbackMappings.forEach(([name, id]) => {
      this.agentMap.set(name.toLowerCase(), id);
    });

    this.isLoaded = true;
    console.log('🔍 Fallback agent mappings loaded');
  }

  getAgentId(agentName: string): string | null {
    if (!this.isLoaded) {
      console.warn('Agent mappings not loaded yet');
      return null;
    }

    const normalizedName = agentName.toLowerCase().trim();
    
    // Try exact match first
    if (this.agentMap.has(normalizedName)) {
      return this.agentMap.get(normalizedName) || null;
    }

    // Try partial matching for flexible search
    for (const [mappedName, agentId] of this.agentMap.entries()) {
      if (normalizedName.includes(mappedName) || mappedName.includes(normalizedName)) {
        return agentId;
      }
    }

    console.warn(`No agent ID found for: "${agentName}"`);
    return null;
  }

  getAllMappings(): Map<string, string> {
    return new Map(this.agentMap);
  }
}

export default AgentMappingService;

// Export singleton instance for convenience
export const agentMappingService = AgentMappingService.getInstance();