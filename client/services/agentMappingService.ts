import { AgentConfig } from '../data/agents';

interface CompiledAgents {
  agents: AgentConfig[];
}

interface AgentInfo {
  id: string;
  name: string;
  words: string[]; // Words from agent ID split by "_"
}

class AgentMappingService {
  private static instance: AgentMappingService;
  private agents: AgentInfo[] = [];
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

      // Store agent info with ID words for dynamic matching
      this.agents = compiledAgents.agents.map(agentConfig => {
        const { id, name } = agentConfig.agent;
        // Split agent ID by "_" to get meaningful words
        // e.g., "newsletter_multi" -> ["newsletter", "multi"]
        // e.g., "content_repurposer" -> ["content", "repurposer"]
        const words = id.toLowerCase().split('_').filter(w => w.length > 0);


        return { id, name, words };
      });

      // Sort by word count descending - more specific agents first
      // This ensures "newsletter_multi" matches before "newsletter"
      this.agents.sort((a, b) => b.words.length - a.words.length);

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load agent mappings:', error);
      this.isLoaded = true; // Mark as loaded to prevent retry loops
    }
  }

  getAgentId(targetText: string): string | null {
    if (!this.isLoaded) {
      return null;
    }

    // Lowercase the target text for matching
    const textLower = targetText.toLowerCase().trim();


    // Strategy 1: Match by agent display name (most reliable)
    // e.g., "Social Media Manager" matches agent with name "Social Media Manager"
    for (const agent of this.agents) {
      const nameLower = agent.name.toLowerCase();
      if (textLower.includes(nameLower) || nameLower.includes(textLower)) {
        return agent.id;
      }
    }

    // Strategy 2: Match by agent ID words
    // e.g., "social media agent" matches agent ID "social_media_agent"
    const hasAgentWord = textLower.includes('agent') || textLower.includes('assistant');

    for (const agent of this.agents) {
      const allWordsMatch = agent.words.every(word => textLower.includes(word));

      if (allWordsMatch && (hasAgentWord || agent.words.length >= 2)) {
        return agent.id;
      }
    }

    // Strategy 3: Match by significant name words (skip generic words)
    // e.g., "Social Media Manager" -> significant words ["social", "media", "manager"]
    // matches agent "Social Media Manager" with words ["social", "media"]
    const genericWords = new Set(['agent', 'assistant', 'manager', 'the', 'with', 'and', 'for']);
    for (const agent of this.agents) {
      const nameWords = agent.name.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !genericWords.has(w));
      if (nameWords.length > 0 && nameWords.every(word => textLower.includes(word))) {
        return agent.id;
      }
    }

    // No match found
    return null;
  }

  getAllAgents(): AgentInfo[] {
    return [...this.agents];
  }
}

export default AgentMappingService;

// Export singleton instance for convenience
export const agentMappingService = AgentMappingService.getInstance();
