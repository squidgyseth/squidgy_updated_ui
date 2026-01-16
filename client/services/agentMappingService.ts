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

        console.log(`🔍 Agent: "${name}" (${id}) -> words: [${words.join(', ')}]`);

        return { id, name, words };
      });

      // Sort by word count descending - more specific agents first
      // This ensures "newsletter_multi" matches before "newsletter"
      this.agents.sort((a, b) => b.words.length - a.words.length);

      this.isLoaded = true;
      console.log('🔍 Agent mappings loaded:', this.agents.map(a => `${a.name} (${a.id})`));
    } catch (error) {
      console.error('Failed to load agent mappings:', error);
      this.isLoaded = true; // Mark as loaded to prevent retry loops
    }
  }

  getAgentId(targetText: string): string | null {
    if (!this.isLoaded) {
      console.warn('Agent mappings not loaded yet');
      return null;
    }

    // Lowercase the target text for matching
    const textLower = targetText.toLowerCase().trim();

    // Check if text contains "agent" or "assistant" (bonus confirmation)
    const hasAgentWord = textLower.includes('agent') || textLower.includes('assistant');

    console.log(`🔍 Finding agent for: "${targetText}"`);
    console.log(`   Has agent/assistant word: ${hasAgentWord}`);

    // Find the best matching agent
    // Agents are sorted by word count (most specific first)
    for (const agent of this.agents) {
      // Check if ALL words from agent ID are present in the text
      const allWordsMatch = agent.words.every(word => textLower.includes(word));

      if (allWordsMatch && (hasAgentWord || agent.words.length >= 2)) {
        // Match found! Either has "agent/assistant" word OR has multiple ID words
        console.log(`✅ Matched: "${agent.name}" (${agent.id})`);
        console.log(`   Words found: [${agent.words.join(', ')}]`);
        return agent.id;
      }
    }

    // No match found
    console.warn(`❌ No agent ID found for: "${targetText}"`);
    return null;
  }

  getAllAgents(): AgentInfo[] {
    return [...this.agents];
  }
}

export default AgentMappingService;

// Export singleton instance for convenience
export const agentMappingService = AgentMappingService.getInstance();
