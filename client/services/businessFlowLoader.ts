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
   * Load agent details from actual config file
   */
  async loadAgentFromConfigFile(configFileName: string): Promise<any> {
    try {
      const response = await fetch(`/agents-compiled.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agents-compiled.json: ${response.status}`);
      }
      
      const agentsData = await response.json();
      const agentData = agentsData.agents?.find((a: any) => 
        a.agent?.id === configFileName
      );
      
      if (agentData?.agent) {
        // Transform to expected format
        return {
          id: agentData.agent.id,
          name: agentData.agent.name,
          description: agentData.agent.description,
          icon: agentData.agent.avatar || agentData.agent.icon || '🤖',
          icon_color: agentData.agent.icon_color || '#6017E8',
          key_capabilities: agentData.agent.capabilities || [],
          specialization: agentData.agent.specialization,
          tagline: agentData.agent.tagline,
          presetup_required: agentData.agent.presetup_required || false,
          presetup_page: agentData.agent.presetup_page || null
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load agent config for ${configFileName}:`, error);
      return null;
    }
  }

  /**
   * Get all agents organized by department (for Step 3 display)
   * Now loads actual agent details from config files
   */
  async getAgentsByDepartment(departmentIds: string[]): Promise<Record<string, Array<{id: string} & AgentConfig>>> {
    const config = await this.loadBusinessFlow();
    const result: Record<string, Array<{id: string} & AgentConfig>> = {};

    for (const deptId of departmentIds) {
      const department = config.departments[deptId];
      
      if (department) {
        const agents: Array<{id: string} & AgentConfig> = [];
        
        for (const agentId of department.agents) {
          const agentRef = config.agents[agentId];
          
          if (agentRef?.config_file) {
            // Load actual agent details from config file
            const agentDetails = await this.loadAgentFromConfigFile(agentRef.config_file);
            
            if (agentDetails) {
              agents.push({
                id: agentId,
                name: agentDetails.name || agentId,
                description: agentDetails.description || '',
                icon: agentDetails.icon || '🤖',
                icon_color: agentDetails.icon_color || '#6017E8',
                is_recommended: true, // Can be configured in business-flow if needed
                agent_config_file: agentRef.config_file,
                key_capabilities: agentDetails.key_capabilities || [],
                presetup_required: agentDetails.presetup_required || false,
                presetup_page: agentDetails.presetup_page || null
              });
            }
          }
        }
        
        result[deptId] = agents;
      }
    }

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