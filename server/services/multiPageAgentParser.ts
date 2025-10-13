import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type { AgentConfig, PageConfig } from '../types/agentTypes.ts';

export class MultiPageAgentParser {
  /**
   * Parse YAML file with multi-page support
   */
  parseYamlFile(filePath: string): AgentConfig {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      let config = yaml.load(fileContents) as AgentConfig;
      
      // Validate required fields
      this.validateConfig(config);
      
      // Process environment variables
      config = this.processEnvVars(config);
      
      // Parse multiple URLs if present
      config = this.parseMultipleUrls(config);
      
      return config;
    } catch (error: any) {
      throw new Error(`Failed to parse YAML file: ${error.message}`);
    }
  }

  /**
   * Parse comma-separated URLs into page configurations
   */
  private parseMultipleUrls(config: AgentConfig): AgentConfig {
    const ui = config.agent.ui || config.ui;
    
    if (!ui) return config;

    const pages: PageConfig[] = [];
    let pageIndex = 0;

    // Parse Figma API URLs
    if (ui.figma_url) {
      const urls = ui.figma_url.split(',').map(url => url.trim()).filter(url => url);
      urls.forEach((url, index) => {
        const pageName = this.generatePageNameFromFigmaUrl(config.agent.id, url, pageIndex + 1);
        pages.push({
          name: pageName,
          path: `/agents/${config.agent.id}/${pageName}`,
          order: pageIndex + 1,
          source: {
            type: 'figma_api',
            url: url
          }
        });
        pageIndex++;
      });
    }

    // Parse deployed Figma URLs
    if (ui.figma_deployed_url) {
      const urls = ui.figma_deployed_url.split(',').map(url => url.trim()).filter(url => url);
      urls.forEach((url, index) => {
        const pageName = this.generatePageNameFromDeployedUrl(config.agent.id, url, pageIndex + 1);
        pages.push({
          name: pageName,
          path: `/agents/${config.agent.id}/${pageName}`,
          order: pageIndex + 1,
          source: {
            type: 'figma_deployed',
            url: url
          }
        });
        pageIndex++;
      });
    }

    // Store parsed pages in the config
    if (pages.length > 0) {
      ui.pages = pages;
      
      // Set page type to multi_page if multiple pages exist
      if (pages.length > 1) {
        ui.page_type = 'multi_page';
      }
    }

    return config;
  }

  /**
   * Validate agent configuration
   */
  private validateConfig(config: any): void {
    if (!config.agent) {
      throw new Error('Missing "agent" section in config');
    }
    
    const agent = config.agent;
    
    if (!agent.id) throw new Error('Missing agent.id');
    if (!agent.name) throw new Error('Missing agent.name');
    if (!agent.category) throw new Error('Missing agent.category');
    
    // Validate category
    const validCategories = ['MARKETING', 'SALES', 'HR', 'SUPPORT', 'OPERATIONS', 'CUSTOM'];
    if (!validCategories.includes(agent.category.toUpperCase())) {
      throw new Error(`Invalid category: ${agent.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Check for N8N configuration
    if (!config.n8n?.webhook_url && !agent.n8n?.webhook_url) {
      console.warn('⚠️ No N8N webhook URL configured for agent:', agent.id);
    }

    // UI config is now in root or agent
    const ui = config.ui || agent.ui;
    if (ui) {
      // Check for at least one Figma URL if page_type is figma
      if (ui.page_type === 'figma' && !ui.figma_url && !ui.figma_deployed_url) {
        throw new Error('Figma page type requires either figma_url or figma_deployed_url');
      }
    }
  }

  /**
   * Process environment variables in config
   */
  private processEnvVars(config: any): any {
    const configStr = JSON.stringify(config);
    const processed = configStr.replace(/\${([^}]+)}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });
    return JSON.parse(processed);
  }

  /**
   * Generate default page names based on agent name
   */
  generatePageNames(agentName: string, pageCount: number): string[] {
    const basePages = ['dashboard', 'analytics', 'settings', 'reports', 'content'];
    const pageNames: string[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      if (i < basePages.length) {
        pageNames.push(basePages[i]);
      } else {
        pageNames.push(`page_${i + 1}`);
      }
    }
    
    return pageNames;
  }

  /**
   * Generate page name from Figma API URL
   * Example: https://www.figma.com/file/abc123/SMM-Dashboard
   * Result: smm_assistant_abc123_SMM-Dashboard_page1
   */
  private generatePageNameFromFigmaUrl(agentId: string, url: string, pageNumber: number): string {
    try {
      // Extract file ID and name from Figma URL
      const urlPattern = /figma\.com\/file\/([^\/]+)\/([^\/\?]+)/;
      const match = url.match(urlPattern);
      
      if (match) {
        const fileId = match[1];
        const fileName = match[2];
        return `${agentId}_${fileId}_${fileName}_page${pageNumber}`;
      } else {
        // Fallback if URL doesn't match expected pattern
        return `${agentId}_figma_page${pageNumber}`;
      }
    } catch (error) {
      return `${agentId}_figma_page${pageNumber}`;
    }
  }

  /**
   * Generate page name from deployed Figma URL
   * Example: https://liquid-blanch-17032840.figma.site/
   * Result: smm_assistant_liquid-blanch-17032840_page1
   */
  private generatePageNameFromDeployedUrl(agentId: string, url: string, pageNumber: number): string {
    try {
      // Extract subdomain from deployed URL
      const urlPattern = /https?:\/\/([^\.]+)\.figma\.site/;
      const match = url.match(urlPattern);
      
      if (match) {
        const subdomain = match[1];
        return `${agentId}_${subdomain}_page${pageNumber}`;
      } else {
        // Fallback for other domain patterns
        const hostname = new URL(url).hostname.replace(/\./g, '-');
        return `${agentId}_${hostname}_page${pageNumber}`;
      }
    } catch (error) {
      return `${agentId}_deployed_page${pageNumber}`;
    }
  }

  /**
   * Update YAML file with generated page information
   */
  async updateYamlWithPages(
    filePath: string, 
    generatedPages: PageConfig[]
  ): Promise<void> {
    try {
      const config = this.parseYamlFile(filePath);
      
      // Add ui_use section with generated pages
      config.ui_use = {
        pages: generatedPages,
        default_page: generatedPages[0]?.path,
        navigation_type: generatedPages.length > 1 ? 'tabs' : undefined
      };
      
      // Write back to YAML
      const yamlStr = yaml.dump(config, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true 
      });
      
      fs.writeFileSync(filePath, yamlStr, 'utf8');
      console.log(`✅ Updated YAML with ${generatedPages.length} generated pages`);
      
    } catch (error: any) {
      console.error('Failed to update YAML:', error.message);
      throw error;
    }
  }
}