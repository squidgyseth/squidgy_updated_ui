import * as fs from 'fs';
import * as path from 'path';
import type { AgentConfig, GeneratedPage, MultiPageGenerationResult } from '../types/agentTypes.ts';
import type { CodeGenerationRequest } from '../types/agentSystemTypes.ts';
import { MultiAgentCoordinator } from '../agents/MultiAgentCoordinator.ts';
import { PlaywrightScreenshotService } from './playwrightScreenshotService.ts';

export class EnhancedMultiPageGenerator {
  private coordinator: MultiAgentCoordinator;
  private screenshotService: PlaywrightScreenshotService;

  constructor() {
    this.coordinator = new MultiAgentCoordinator(5); // Max 5 iterations
    this.screenshotService = new PlaywrightScreenshotService();
  }

  /**
   * Generate all pages for a multi-page agent using multi-agent system
   */
  async generateAgentPages(config: AgentConfig): Promise<MultiPageGenerationResult> {
    console.log(`\n🤖 ENHANCED MULTI-AGENT GENERATION`);
    console.log(`📱 Agent: ${config.agent.name}`);
    console.log(`📁 Category: ${config.agent.category}`);
    console.log('='.repeat(60));
    
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

      console.log(`📄 Generating ${pages.length} pages with multi-agent system...`);

      // Generate each page using multi-agent approach
      for (const [index, pageConfig] of pages.entries()) {
        console.log(`\n📄 PAGE ${index + 1}/${pages.length}: ${pageConfig.name}`);
        console.log('-'.repeat(40));
        
        try {
          const generatedPage = await this.generateSinglePageWithAgents(
            config,
            pageConfig,
            agentFolder
          );
          
          result.pages.push(generatedPage);
          console.log(`✅ Successfully generated: ${generatedPage.filePath}`);
          
        } catch (pageError: any) {
          console.error(`❌ Failed to generate ${pageConfig.name}:`, pageError.message);
          result.errors?.push(`Page ${pageConfig.name}: ${pageError.message}`);
        }
      }

      // Generate index file for the agent
      if (result.pages.length > 0) {
        await this.generateAgentIndex(config, result.pages, agentFolder);
      }

      result.success = result.pages.length > 0;
      
      console.log(`\n✨ GENERATION COMPLETE: ${result.pages.length}/${pages.length} pages successful`);
      
    } catch (error: any) {
      console.error('❌ Error in enhanced generation:', error.message);
      result.errors?.push(error.message);
    } finally {
      await this.screenshotService.close();
    }

    return result;
  }

  /**
   * Generate a single page using the multi-agent system
   */
  private async generateSinglePageWithAgents(
    config: AgentConfig,
    pageConfig: any,
    agentFolder: string
  ): Promise<GeneratedPage> {
    const source = pageConfig.source;
    if (!source) {
      throw new Error(`No source URL for page: ${pageConfig.name}`);
    }

    // Prepare request for multi-agent system
    const request: CodeGenerationRequest = {
      agentId: config.agent.id,
      pageName: pageConfig.name,
      sourceType: source.type,
      sourceUrl: source.url,
      requirements: [
        'Generate production-ready React component',
        'Use TypeScript and Tailwind CSS',
        'Include proper error handling',
        'Integrate with useUser() and sendToN8nWorkflow()',
        'Ensure responsive design',
        'Add loading states'
      ]
    };

    // Handle screenshot capture for deployed URLs
    if (source.type === 'figma_deployed') {
      console.log(`📸 Capturing screenshots from: ${source.url}`);
      const screenshotData = await this.screenshotService.captureDeployedFigmaScreenshots(
        source.url,
        `${config.agent.id}_${pageConfig.name}`
      );
      request.screenshots = screenshotData.screenshots;
    }

    // Run multi-agent generation process
    console.log(`🤖 Starting multi-agent code generation...`);
    const session = await this.coordinator.generateAndValidateCode(request);

    if (session.status !== 'completed' || !session.finalCode) {
      const errorMsg = `Multi-agent generation failed after ${session.currentIteration} iterations`;
      console.error(`❌ ${errorMsg}`);
      
      // Include specific errors from the session
      const sessionErrors = session.iterations
        .flatMap(iter => iter.qaValidation?.errors || [])
        .map(error => error.message)
        .join('; ');
      
      throw new Error(`${errorMsg}. Errors: ${sessionErrors}`);
    }

    // Success! The file should already be written by the QA Agent
    console.log(`✅ Multi-agent generation completed successfully!`);
    console.log(`📊 Final confidence: ${session.finalCode.confidence}%`);
    console.log(`🔄 Iterations used: ${session.currentIteration}`);

    return {
      agentId: config.agent.id,
      pageName: pageConfig.name,
      filePath: session.finalCode.filePath,
      sourceUrl: source.url,
      sourceType: source.type,
      componentCode: session.finalCode.componentCode
    };
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
      console.log(`📁 Created folder: ${baseDir}`);
    } else {
      console.log(`📁 Using existing folder: ${baseDir}`);
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

    const componentName = config.agent.id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const indexContent = `// Enhanced Multi-Agent Generated Index: ${config.agent.name}
// Category: ${config.agent.category}
// Generated at: ${new Date().toISOString()}
// Pages: ${pages.length}
// Generated using Multi-Agent System (UI Agent + QA Agent)

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all validated pages
${pages.map(page => {
  const fileName = path.basename(page.filePath, '.tsx');
  const componentName = this.generateComponentName(page.pageName);
  return `import ${componentName} from './${fileName}';`;
}).join('\n')}

export default function ${componentName}Agent() {
  return (
    <Routes>
      ${pages.map((page, index) => {
        const componentName = this.generateComponentName(page.pageName);
        const routePath = this.generateRoutePath(page.pageName);
        
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
  generated: {
    timestamp: new Date().toISOString(),
    multiAgent: true,
    pagesCount: pages.length
  },
  pages: pages.map(p => ({
    name: p.pageName,
    path: this.generateRoutePath(p.pageName),
    sourceType: p.sourceType,
    sourceUrl: p.sourceUrl
  }))
}, null, 2)};
`;

    const indexPath = path.join(agentFolder, 'index.tsx');
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log(`📄 Generated enhanced index file: ${indexPath}`);
  }

  /**
   * Generate component name from page name
   */
  private generateComponentName(pageName: string): string {
    return pageName
      .split(/[_-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Generate route path from page name
   */
  private generateRoutePath(pageName: string): string {
    return pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Get coordinator health status
   */
  async getHealthStatus() {
    return await this.coordinator.healthCheck();
  }

  /**
   * Get system capabilities
   */
  getCapabilities() {
    return this.coordinator.getCapabilities();
  }
}