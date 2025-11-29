import yaml from 'js-yaml';

// Configuration interfaces matching our YAML structure
export interface BusinessTypeConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
}

export interface DepartmentConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  default_recommended?: boolean;
  is_popular?: boolean;
}

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

export interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  icon_color: string;
  is_recommended?: boolean;
  agent_config?: string | null;
  key_capabilities: string[];
}

export interface AssistantsCatalogConfig {
  hr_people: AssistantConfig[];
  marketing: AssistantConfig[];
  sales: AssistantConfig[];
  management_strategy: AssistantConfig[];
  customer_support: AssistantConfig[];
  personal_assistant: AssistantConfig[];
  finance: AssistantConfig[];
  product_dev: AssistantConfig[];
}

export interface OnboardingFlowConfig {
  business_types: BusinessTypeConfig[];
  departments: DepartmentConfig[];
  personalization: PersonalizationConfig;
  assistants: AssistantsCatalogConfig;
  flow: {
    total_steps: number;
    step_titles: string[];
  };
}

class OnboardingConfigLoader {
  private static instance: OnboardingConfigLoader;
  private onboardingFlow: OnboardingFlowConfig | null = null;
  private loaded = false;

  private constructor() {}

  static getInstance(): OnboardingConfigLoader {
    if (!OnboardingConfigLoader.instance) {
      OnboardingConfigLoader.instance = new OnboardingConfigLoader();
    }
    return OnboardingConfigLoader.instance;
  }

  /**
   * Load onboarding flow configuration from YAML
   */
  async loadOnboardingFlow(): Promise<OnboardingFlowConfig> {
    if (this.onboardingFlow) {
      return this.onboardingFlow;
    }

    try {
      const response = await fetch('/config/onboarding-flow.yaml');
      if (!response.ok) {
        throw new Error(`Failed to fetch onboarding-flow.yaml: ${response.status}`);
      }

      const yamlContent = await response.text();
      const config = yaml.load(yamlContent) as OnboardingFlowConfig;

      if (config && config.business_types && config.departments && config.assistants) {
        this.onboardingFlow = config;
        return config;
      }

      throw new Error('Invalid onboarding flow configuration');
    } catch (error) {
      console.error('Failed to load onboarding flow config:', error);
      throw error;
    }
  }

  /**
   * Get business types for Step 1
   */
  async getBusinessTypes(): Promise<BusinessTypeConfig[]> {
    const config = await this.loadOnboardingFlow();
    return config.business_types;
  }

  /**
   * Get departments for Step 2
   */
  async getDepartments(): Promise<DepartmentConfig[]> {
    const config = await this.loadOnboardingFlow();
    return config.departments;
  }

  /**
   * Get assistants for a specific department (Step 3)
   */
  async getAssistantsForDepartment(departmentId: string): Promise<AssistantConfig[]> {
    const config = await this.loadOnboardingFlow();
    return config.assistants[departmentId as keyof AssistantsCatalogConfig] || [];
  }

  /**
   * Get all assistants organized by department
   */
  async getAllAssistantsByDepartment(): Promise<AssistantsCatalogConfig> {
    const config = await this.loadOnboardingFlow();
    return config.assistants;
  }

  /**
   * Get personalization options for Step 4
   */
  async getPersonalizationOptions(): Promise<PersonalizationConfig> {
    const config = await this.loadOnboardingFlow();
    return config.personalization;
  }

  /**
   * Get flow configuration (steps, titles, etc.)
   */
  async getFlowConfig(): Promise<{ total_steps: number; step_titles: string[] }> {
    const config = await this.loadOnboardingFlow();
    return config.flow;
  }

  /**
   * Get recommended assistants for a business type
   */
  async getRecommendedAssistants(businessTypeId: string): Promise<AssistantConfig[]> {
    const config = await this.loadOnboardingFlow();
    const recommended: AssistantConfig[] = [];

    // Get recommended assistants from all departments
    Object.values(config.assistants).forEach(departmentAssistants => {
      recommended.push(...departmentAssistants.filter(assistant => assistant.is_recommended));
    });

    return recommended;
  }

  /**
   * Link assistant to actual agent config
   */
  async getLinkedAgentConfig(assistantId: string): Promise<string | null> {
    const config = await this.loadOnboardingFlow();
    
    // Search through all departments to find the assistant
    for (const departmentAssistants of Object.values(config.assistants)) {
      const assistant = departmentAssistants.find(a => a.id === assistantId);
      if (assistant) {
        return assistant.agent_config || null;
      }
    }
    
    return null;
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.onboardingFlow = null;
    this.loaded = false;
  }
}

export default OnboardingConfigLoader;