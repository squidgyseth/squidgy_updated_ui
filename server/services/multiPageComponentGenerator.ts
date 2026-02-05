import * as fs from 'fs';
import * as path from 'path';
import type { AgentConfig, GeneratedPage, MultiPageGenerationResult, PageConfig } from '../types/agentTypes.ts';
import { ComponentGenerator } from './componentGenerator.ts';
import { PlaywrightScreenshotService } from './playwrightScreenshotService.ts';
import { ScreenshotAnalysisService } from './screenshotAnalysisService.ts';
import { MultiAgentCoordinator } from '../agents/MultiAgentCoordinator.ts';
import type { CodeGenerationRequest } from '../types/agentSystemTypes.ts';

export class MultiPageComponentGenerator {
  private componentGenerator: ComponentGenerator;
  private screenshotService: PlaywrightScreenshotService;
  private analysisService: ScreenshotAnalysisService;

  constructor(figmaToken?: string) {
    this.componentGenerator = new ComponentGenerator(figmaToken || '');
    this.screenshotService = new PlaywrightScreenshotService();
    this.analysisService = new ScreenshotAnalysisService();
  }

  /**
   * Generate all pages for a multi-page agent
   */
  async generateAgentPages(config: AgentConfig): Promise<MultiPageGenerationResult> {
    
    const result: MultiPageGenerationResult = {
      agentId: config.agent.id,
      agentName: config.agent.name,
      category: config.agent.category,
      pages: [],
      folderPath: '',
      success: false,
      errors: []
    };

    try {
      // Create agent folder structure
      const agentFolder = await this.createAgentFolder(config.agent.id);
      result.folderPath = agentFolder;

      // Get pages from parsed config
      const pages = config.ui?.pages || [];
      
      if (pages.length === 0) {
        throw new Error('No pages found in configuration');
      }


      // Generate each page
      for (const [index, pageConfig] of pages.entries()) {
        
        try {
          const generatedPage = await this.generateSinglePage(
            config,
            pageConfig,
            agentFolder
          );
          
          result.pages.push(generatedPage);
          
        } catch (pageError: any) {
          console.error(`❌ Failed to generate ${pageConfig.name}:`, pageError.message);
          result.errors?.push(`Page ${pageConfig.name}: ${pageError.message}`);
        }
      }

      // Generate index file for the agent
      await this.generateAgentIndex(config, result.pages, agentFolder);

      result.success = result.pages.length > 0;
      
      
    } catch (error: any) {
      console.error('❌ Error generating agent pages:', error.message);
      result.errors?.push(error.message);
    } finally {
      await this.screenshotService.close();
    }

    return result;
  }

  /**
   * Generate a single page component
   */
  private async generateSinglePage(
    config: AgentConfig,
    pageConfig: PageConfig,
    agentFolder: string
  ): Promise<GeneratedPage> {
    const source = pageConfig.source;
    if (!source) {
      throw new Error(`No source URL for page: ${pageConfig.name}`);
    }

    let componentCode: string;

    if (source.type === 'figma_deployed') {
      // Generate from deployed Figma URL
      componentCode = await this.generateFromDeployedUrl(
        config,
        pageConfig,
        source.url
      );
    } else if (source.type === 'figma_api') {
      // Generate from Figma API
      componentCode = await this.generateFromFigmaApi(
        config,
        pageConfig,
        source.url
      );
    } else {
      throw new Error(`Unknown source type: ${source.type}`);
    }

    // Clean page name for file naming
    const cleanPageName = pageConfig.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    // Save component to file
    const fileName = `${cleanPageName}.tsx`;
    const filePath = path.join(agentFolder, fileName);
    
    fs.writeFileSync(filePath, componentCode, 'utf8');

    return {
      agentId: config.agent.id,
      pageName: pageConfig.name,
      filePath: filePath,
      sourceUrl: source.url,
      sourceType: source.type,
      componentCode: componentCode
    };
  }

  /**
   * Generate component from deployed Figma URL using Python multi-agent system
   */
  private async generateFromDeployedUrl(
    config: AgentConfig,
    pageConfig: PageConfig,
    url: string
  ): Promise<string> {
    
    // Capture screenshots
    const screenshotData = await this.screenshotService.captureDeployedFigmaScreenshots(
      url,
      `${config.agent.id}_${pageConfig.name}`
    );

    
    if (screenshotData.screenshots.length === 0) {
      throw new Error('No screenshots captured - cannot generate page');
    }

    // Try Python multi-agent system first
    try {
      return await this.generateWithPythonAgents(config, pageConfig, screenshotData.screenshots);
    } catch (error: any) {
      console.error('❌ Python multi-agent system failed:', error.message);
      
      // Fallback to TypeScript system
      return this.generateWithTypeScriptAgents(config, pageConfig, screenshotData.screenshots, url);
    }
  }

  /**
   * Generate component using Python multi-agent system
   */
  private async generateWithPythonAgents(
    config: AgentConfig,
    pageConfig: PageConfig,
    screenshots: string[]
  ): Promise<string> {
    const componentName = this.generateComponentName(config.agent.id, pageConfig.name);
    const screenshotDir = path.dirname(screenshots[0]);
    const tempOutputFile = path.join(screenshotDir, 'generated_component.tsx');
    
    // Run Python multi-agent system  
    const pythonScript = path.join(process.cwd(), 'server/agents/python/ui_development_agents.py');
    const { execSync } = require('child_process');
    
    const command = `python3 "${pythonScript}" "${screenshotDir}" "${componentName}" "${tempOutputFile}"`;
    
    const output = execSync(command, { 
      encoding: 'utf8',
      env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY },
      timeout: 300000 // 5 minutes timeout
    });
    
    
    // Read the generated component
    if (fs.existsSync(tempOutputFile)) {
      const generatedCode = fs.readFileSync(tempOutputFile, 'utf8');
      
      // Clean up temp file
      fs.unlinkSync(tempOutputFile);
      
      return generatedCode;
    } else {
      throw new Error('Python multi-agent system did not generate output file');
    }
  }

  /**
   * Fallback to TypeScript multi-agent system
   */
  private async generateWithTypeScriptAgents(
    config: AgentConfig,
    pageConfig: PageConfig,
    screenshots: string[],
    url: string
  ): Promise<string> {
    const coordinator = new MultiAgentCoordinator();
    
    const request: CodeGenerationRequest = {
      sourceType: 'figma_deployed',
      sourceUrl: url,
      screenshots: screenshots,
      agentId: config.agent.id,
      pageName: pageConfig.name
    };
    
    const result = await coordinator.processRequest(request);
    
    if (!result.success || !result.finalCode) {
      if (result.session.status === 'completed' && result.session.finalCode?.componentCode) {
        return result.session.finalCode.componentCode;
      }
      throw new Error(`Multi-Agent System failed to generate component: ${result.errors?.join(', ')}`);
    }
    
    return result.finalCode;
  }

  /**
   * Generate component from Figma API
   */
  private async generateFromFigmaApi(
    config: AgentConfig,
    pageConfig: PageConfig,
    url: string
  ): Promise<string> {
    throw new Error('Figma API generation requires multi-agent system. Please set OPENAI_API_KEY environment variable.');
  }


  /**
   * Generate component name from agent ID and page name
   */
  private generateComponentName(agentId: string, pageName: string): string {
    const cleanAgentId = agentId
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    const cleanPageName = pageName
      .split(/[_-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    return `${cleanAgentId}${cleanPageName}`;
  }

  /**
   * Create folder structure for agent pages
   */
  private async createAgentFolder(agentId: string): Promise<string> {
    const baseDir = path.join(
      process.cwd(),
      'client',
      'pages',
      'agents',
      agentId
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    } else {
    }

    return baseDir;
  }

  /**
   * Generate index file for the agent
   */
  private async generateAgentIndex(
    config: AgentConfig,
    pages: GeneratedPage[],
    agentFolder: string
  ): Promise<void> {
    if (pages.length === 0) return;

    const indexContent = `// Agent Index: ${config.agent.name}
// Category: ${config.agent.category}
// Generated at: ${new Date().toISOString()}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all pages
${pages.map(page => {
  const componentName = this.generateComponentName(config.agent.id, page.pageName);
  const fileName = page.pageName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `import ${componentName} from './${fileName}';`;
}).join('\n')}

export default function ${config.agent.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Agent() {
  return (
    <Routes>
      ${pages.map((page, index) => {
        const componentName = this.generateComponentName(config.agent.id, page.pageName);
        const routePath = page.pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        if (index === 0) {
          // First page is the default
          return `<Route path="/" element={<Navigate to="${routePath}" replace />} />
      <Route path="${routePath}" element={<${componentName} />} />`;
        }
        return `<Route path="${routePath}" element={<${componentName} />} />`;
      }).join('\n      ')}
    </Routes>
  );
}

export const agentConfig = ${JSON.stringify({
  id: config.agent.id,
  name: config.agent.name,
  category: config.agent.category,
  pages: pages.map(p => ({
    name: p.pageName,
    path: p.pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }))
}, null, 2)};
`;

    const indexPath = path.join(agentFolder, 'index.tsx');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
  }
}
