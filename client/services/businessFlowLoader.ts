import yaml from 'js-yaml';

// Business Flow Configuration Types
export interface BusinessTypeConfig {
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  recommended_departments: string[];
}

export interface DepartmentConfig {
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  agents: string[];
}

export interface AgentConfig {
  name: string;
  description: string;
  icon: string;
  icon_color: string;
  is_recommended: boolean;
  agent_config_file: string | null;
  key_capabilities: string[];
}

export interface BusinessFlowConfig {
  business_types: Record<string, BusinessTypeConfig>;
  departments: Record<string, DepartmentConfig>;
  agents: Record<string, AgentConfig>;
}

// UI Settings Configuration Types
export interface PersonalizationConfig {
  avatar_styles: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  communication_tones: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

export interface UISettingsConfig {
  personalization: PersonalizationConfig;
  flow: {
    total_steps: number;
    step_titles: string[];
  };
}

class BusinessFlowLoader {
  private static instance: BusinessFlowLoader;
  private businessFlow: BusinessFlowConfig | null = null;
  private uiSettings: UISettingsConfig | null = null;

  private constructor() {}

  static getInstance(): BusinessFlowLoader {
    if (!BusinessFlowLoader.instance) {
      BusinessFlowLoader.instance = new BusinessFlowLoader();
    }
    return BusinessFlowLoader.instance;
  }

  /**
   * Load business flow configuration (business types → departments → agents)
   */
  async loadBusinessFlow(): Promise<BusinessFlowConfig> {
    if (this.businessFlow) {
      return this.businessFlow;
    }

    try {
      const response = await fetch('/config/business-flow.yaml');
      if (!response.ok) {
        throw new Error(`Failed to fetch business-flow.yaml: ${response.status}`);
      }

      const yamlContent = await response.text();
      const config = yaml.load(yamlContent) as BusinessFlowConfig;

      if (config && config.business_types && config.departments && config.agents) {
        this.businessFlow = config;
        return config;
      }

      throw new Error('Invalid business flow configuration');
    } catch (error) {
      console.error('Failed to load business flow config:', error);
      throw error;
    }
  }

  /**
   * Load UI settings configuration (personalization, flow)
   */
  async loadUISettings(): Promise<UISettingsConfig> {
    if (this.uiSettings) {
      return this.uiSettings;
    }

    try {
      const response = await fetch('/config/ui-settings.yaml');
      if (!response.ok) {
        throw new Error(`Failed to fetch ui-settings.yaml: ${response.status}`);
      }

      const yamlContent = await response.text();
      const config = yaml.load(yamlContent) as UISettingsConfig;

      if (config && config.personalization && config.flow) {
        this.uiSettings = config;
        return config;
      }

      throw new Error('Invalid UI settings configuration');
    } catch (error) {
      console.error('Failed to load UI settings config:', error);
      throw error;
    }
  }

  // ===== STEP 1: BUSINESS TYPES =====
  
  /**
   * Get all business types for Step 1
   */
  async getBusinessTypes(): Promise<Array<{id: string} & BusinessTypeConfig>> {
    const config = await this.loadBusinessFlow();
    return Object.entries(config.business_types).map(([id, businessType]) => ({
      id,
      ...businessType
    }));
  }

  // ===== STEP 2: DEPARTMENTS =====

  /**
   * Get recommended departments for a business type
   */
  async getRecommendedDepartments(businessTypeId: string): Promise<string[]> {
    const config = await this.loadBusinessFlow();
    const businessType = config.business_types[businessTypeId];
    return businessType ? businessType.recommended_departments : [];
  }

  /**
   * Get all departments for Step 2
   */
  async getDepartments(): Promise<Array<{id: string} & DepartmentConfig>> {
    const config = await this.loadBusinessFlow();
    return Object.entries(config.departments).map(([id, department]) => ({
      id,
      ...department
    }));
  }

  // ===== STEP 3: AGENTS =====

  /**
   * Get agents for specific departments
   */
  async getAgentsForDepartments(departmentIds: string[]): Promise<Array<{id: string} & AgentConfig>> {
    const config = await this.loadBusinessFlow();
    const agents: Array<{id: string} & AgentConfig> = [];

    // Collect all agent IDs from selected departments
    const agentIds = new Set<string>();
    departmentIds.forEach(deptId => {
      const department = config.departments[deptId];
      if (department) {
        department.agents.forEach(agentId => agentIds.add(agentId));
      }
    });

    // Get agent details for each ID
    agentIds.forEach(agentId => {
      const agent = config.agents[agentId];
      if (agent) {
        agents.push({
          id: agentId,
          ...agent
        });
      }
    });

    return agents;
  }

  /**
   * Get all agents organized by department (for Step 3 display)
   */
  async getAgentsByDepartment(departmentIds: string[]): Promise<Record<string, Array<{id: string} & AgentConfig>>> {
    const config = await this.loadBusinessFlow();
    const result: Record<string, Array<{id: string} & AgentConfig>> = {};

    departmentIds.forEach(deptId => {
      const department = config.departments[deptId];
      if (department) {
        result[deptId] = department.agents.map(agentId => {
          const agent = config.agents[agentId];
          return agent ? { id: agentId, ...agent } : null;
        }).filter(Boolean) as Array<{id: string} & AgentConfig>;
      }
    });

    return result;
  }

  // ===== STEP 4: PERSONALIZATION =====

  /**
   * Get personalization options for Step 4
   */
  async getPersonalizationOptions(): Promise<PersonalizationConfig> {
    const config = await this.loadUISettings();
    return config.personalization;
  }

  // ===== GENERAL =====

  /**
   * Get flow configuration (steps, titles, etc.)
   */
  async getFlowConfig(): Promise<{ total_steps: number; step_titles: string[] }> {
    const config = await this.loadUISettings();
    return config.flow;
  }

  /**
   * Get agent config file path for linking to /agents/configs
   */
  async getAgentConfigFile(agentId: string): Promise<string | null> {
    const config = await this.loadBusinessFlow();
    const agent = config.agents[agentId];
    return agent ? agent.agent_config_file : null;
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.businessFlow = null;
    this.uiSettings = null;
  }
}

export default BusinessFlowLoader;