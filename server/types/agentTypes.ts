// Agent Configuration Types for Multi-Page Support

export interface PageConfig {
  name: string;
  path: string;
  order: number;
  source?: {
    type: 'figma_api' | 'figma_deployed';
    url: string;
  };
  generatedComponent?: string;
}

export interface AgentUIConfig {
  page_type: 'standard' | 'figma' | 'multi_page';
  
  // Single or comma-separated URLs
  figma_url?: string;
  figma_deployed_url?: string;
  figma_token?: string;
  
  // Pages configuration (added after generation)
  pages?: PageConfig[];
}

export interface AgentConfig {
  agent: {
    id: string;
    name: string;
    category: 'MARKETING' | 'SALES' | 'HR' | 'SUPPORT' | 'OPERATIONS' | 'CUSTOM';
    description: string;
    avatar?: string;
    pinned?: boolean;
  };
  
  n8n: {
    webhook_url: string;
  };
  
  ui: AgentUIConfig;
  
  // UI pages usage configuration (added after generation)
  ui_use?: {
    pages: PageConfig[];
    default_page?: string;
    navigation_type?: 'tabs' | 'sidebar' | 'dropdown';
  };
}

export interface AgentCategory {
  name: string;
  displayName: string;
  color: string;
  icon?: string;
  agents: AgentConfig[];
}

export interface GeneratedPage {
  agentId: string;
  pageName: string;
  filePath: string;
  sourceUrl: string;
  sourceType: 'figma_api' | 'figma_deployed';
  componentCode: string;
}

export interface MultiPageGenerationResult {
  agentId: string;
  agentName: string;
  category: string;
  pages: GeneratedPage[];
  folderPath: string;
  success: boolean;
  errors?: string[];
}