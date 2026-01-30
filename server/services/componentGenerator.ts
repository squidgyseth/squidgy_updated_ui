import * as fs from 'fs';
import * as path from 'path';
import { FigmaService } from './figmaService.ts';
import { FigmaScraperService } from './figmaScraperService.ts';
import { PlaywrightScreenshotService } from './playwrightScreenshotService.ts';
import { ScreenshotAnalysisService, type DesignAnalysis } from './screenshotAnalysisService.ts';

export class ComponentGenerator {
  private figmaService: FigmaService;
  private screenshotService: PlaywrightScreenshotService;
  private analysisService: ScreenshotAnalysisService;
  
  constructor(figmaToken: string) {
    this.figmaService = new FigmaService(figmaToken);
    this.screenshotService = new PlaywrightScreenshotService();
    this.analysisService = new ScreenshotAnalysisService();
  }

  /**
   * Generate React component from deployed Figma URL (NEW METHOD)
   */
  async generateFromDeployedFigma(
    agentId: string,
    agentName: string,
    deployedUrl: string,
    n8nWebhookUrl: string
  ): Promise<string> {
    console.log(`🎨 Generating component from deployed Figma: ${agentName}...`);
    
    try {
      // Step 1: Capture screenshots
      console.log('📸 Capturing screenshots...');
      const screenshotData = await this.screenshotService.captureDeployedFigmaScreenshots(
        deployedUrl,
        agentId
      );
      
      // Step 2: Analyze screenshots with LLM
      console.log('🧠 Analyzing screenshots with AI...');
      const designAnalysis = await this.analysisService.analyzeScreenshots(screenshotData.screenshots);
      
      // Step 3: Combine analysis with screenshot data
      const enhancedData = {
        pageInfo: screenshotData.pageInfo,
        designAnalysis,
        screenshots: screenshotData.screenshots,
        deployedUrl
      };
      
      console.log(`🎨 AI Design Analysis completed:`, {
        sections: designAnalysis.sections.length,
        components: designAnalysis.components.length,
        overallStyle: designAnalysis.overallStyle,
        screenshotCount: screenshotData.screenshots.length
      });
      
      // Step 4: Generate component code using AI analysis
      const componentCode = this.generateComponentFromAnalysis(
        agentId,
        agentName,
        enhancedData,
        n8nWebhookUrl
      );
      
      // Step 5: Save component to file
      const componentPath = this.saveComponent(agentId, componentCode);
      
      // Step 6: Cleanup screenshots (optional - keep for debugging)
      // await this.screenshotService.cleanupScreenshots(agentId);
      
      return componentPath;
      
    } catch (error: any) {
      console.error('Error generating from deployed Figma:', error.message);
      throw error;
    } finally {
      await this.screenshotService.close();
    }
  }

  /**
   * Generate React component from Figma URL (ORIGINAL METHOD)
   */
  async generateFromFigma(
    agentId: string,
    agentName: string,
    figmaUrl: string,
    n8nWebhookUrl: string
  ): Promise<string> {
    console.log(`🎨 Fetching Figma design for ${agentName}...`);
    
    // Fetch Figma data
    const figmaData = await this.figmaService.fetchFigmaFile(figmaUrl);
    
    // Extract design tokens
    const tokens = this.figmaService.generateDesignTokens(figmaData);
    
    console.log(`🎨 Extracted design tokens:`, {
      colors: Object.keys(tokens.colors).length,
      typography: tokens.typography.length
    });
    
    // Generate component code
    const componentCode = this.generateComponentCode(
      agentId,
      agentName,
      tokens,
      n8nWebhookUrl
    );
    
    // Save component to file
    const componentPath = this.saveComponent(agentId, componentCode);
    
    return componentPath;
  }

  /**
   * Generate React component code from LLM analysis (ENHANCED METHOD)
   */
  private generateComponentFromAnalysis(
    agentId: string,
    agentName: string,
    enhancedData: {
      pageInfo: any;
      designAnalysis: DesignAnalysis;
      screenshots: string[];
      deployedUrl: string;
    },
    n8nWebhookUrl: string
  ): string {
    const componentName = agentId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    const { designAnalysis, deployedUrl, screenshots } = enhancedData;

    // Generate component structure based on LLM analysis
    const componentStructure = this.generateComponentStructure(designAnalysis);
    const customStyles = this.generateCustomStyles(designAnalysis);

    return `// Auto-generated from Deployed Figma: ${agentName}
// Source: ${deployedUrl}
// Generated at: ${new Date().toISOString()}
// Screenshots analyzed: ${screenshots.length}
// Design Analysis: ${designAnalysis.sections.length} sections, ${designAnalysis.components.length} components

import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Image } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { sendToN8nWorkflow } from '../../lib/n8nService';

export default function ${componentName}Agent() {
  const { userId, sessionId } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Custom styling extracted from LLM design analysis
  const customStyles = \`
    <style>
      :root {
        --primary-color: ${designAnalysis.colorScheme.primary};
        --secondary-color: ${designAnalysis.colorScheme.secondary};
        --background-color: ${designAnalysis.colorScheme.background};
        --text-color: ${designAnalysis.colorScheme.text};
        --accent-color: ${designAnalysis.colorScheme.accent || designAnalysis.colorScheme.primary};
      }
      .ai-generated-layout {
        background: var(--background-color);
        color: var(--text-color);
      }
      .ai-primary-gradient {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      }
      .ai-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      }
      ${customStyles}
    </style>
  \`;

  useEffect(() => {
    // Add initial message
    setMessages([{
      type: 'agent',
      content: "👋 Hello! I'm ${agentName}. This interface was generated from your deployed Figma design at ${deployedUrl}. I can see it has ${designAnalysis.sections.length} main sections with a ${designAnalysis.overallStyle} design style.",
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to N8N webhook: ${n8nWebhookUrl}
      const response = await sendToN8nWorkflow(
        userId,
        inputMessage,
        '${agentId}',
        sessionId
      );

      if (response?.response) {
        const agentMessage = {
          type: 'agent',
          content: response.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="h-full flex flex-col ai-generated-layout">
        {/* Header Section - Based on AI Analysis */}
        <div className="ai-primary-gradient px-6 py-4 border-b shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">${agentName}</h2>
              <p className="text-white/80 text-sm">AI-Generated from ${designAnalysis.overallStyle} Design</p>
            </div>
          </div>
        </div>

        {/* Messages Area - ${designAnalysis.layout.type} layout with ${designAnalysis.layout.spacing} spacing */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: 'var(--background-color)' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={\`flex \${message.type === 'user' ? 'justify-end' : 'justify-start'}\`}
            >
              <div
                className={\`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm \${
                  message.type === 'user'
                    ? 'ai-primary-gradient text-white'
                    : 'ai-card text-gray-800'
                }\`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={\`text-xs mt-1 \${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-400'
                }\`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Styled from AI Analysis */}
        <div className="border-t ai-card px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ focusRingColor: 'var(--primary-color)' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-2.5 ai-primary-gradient text-white rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}`;
  }

  /**
   * Generate component structure based on LLM analysis
   */
  private generateComponentStructure(analysis: DesignAnalysis): any {
    return {
      layout: analysis.layout.type,
      sections: analysis.sections,
      components: analysis.components,
      spacing: analysis.layout.spacing
    };
  }

  /**
   * Generate custom CSS styles from design analysis
   */
  private generateCustomStyles(analysis: DesignAnalysis): string {
    const { colorScheme, typography, layout } = analysis;
    
    return `
      .ai-typography-heading {
        font-size: ${typography.fontSizes[0] || '1.5rem'};
        font-weight: 700;
        line-height: 1.2;
      }
      .ai-typography-body {
        font-size: ${typography.fontSizes[2] || '1rem'};
        line-height: 1.6;
      }
      .ai-spacing-${layout.spacing} {
        gap: ${layout.spacing === 'tight' ? '0.5rem' : layout.spacing === 'spacious' ? '2rem' : '1rem'};
      }
      .ai-component-button {
        background: var(--primary-color);
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        transition: all 0.2s;
      }
      .ai-component-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
    `;
  }

  /**
   * Generate React component code (ORIGINAL METHOD)
   */
  private generateComponentCode(
    agentId: string,
    agentName: string,
    tokens: any,
    n8nWebhookUrl: string
  ): string {
    // Extract primary colors
    const colors = tokens.colors;
    const primaryColor = colors[Object.keys(colors)[0]] || '#5E17EB';
    const secondaryColor = colors[Object.keys(colors)[1]] || '#8B5CF6';
    
    // Generate Tailwind config for custom colors
    const colorVars = Object.entries(colors)
      .slice(0, 5)
      .map(([name, value]) => `  --color-${name.replace(/\s+/g, '-').toLowerCase()}: ${value};`)
      .join('\n');
    
    const componentName = agentId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    return `// Auto-generated from Figma: ${agentName}
// Generated at: ${new Date().toISOString()}

import React, { useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { sendToN8nWorkflow } from '../../lib/n8nService';

export default function ${componentName}Agent() {
  const { userId, sessionId } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Custom colors from Figma
  const customStyles = \`
    <style>
      :root {
${colorVars}
      }
    </style>
  \`;

  useEffect(() => {
    // Add initial message
    setMessages([{
      type: 'agent',
      content: "👋 Hello! I'm ${agentName}. How can I help you today?",
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to N8N webhook
      const response = await sendToN8nWorkflow(
        userId,
        inputMessage,
        '${agentId}',
        sessionId
      );

      if (response?.response) {
        const agentMessage = {
          type: 'agent',
          content: response.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white">
        {/* Header with gradient from Figma */}
        <div 
          className="px-6 py-4 border-b"
          style={{
            background: \`linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 100%)\`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: \`${primaryColor}20\` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">${agentName}</h2>
              <p className="text-sm text-gray-500">AI Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={\`flex \${message.type === 'user' ? 'justify-end' : 'justify-start'}\`}
            >
              <div
                className={\`max-w-[70%] px-4 py-3 rounded-2xl \${
                  message.type === 'user'
                    ? 'text-white'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }\`}
                style={message.type === 'user' ? {
                  background: \`linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)\`
                } : {}}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={\`text-xs mt-1 \${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-400'
                }\`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ focusRingColor: primaryColor }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-2.5 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{
                background: \`linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)\`
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}`;
  }

  /**
   * Generate layout styles from design tokens
   */
  private getLayoutStyleFromTokens(designTokens: any): any {
    const layout = designTokens.layout || 'single-page';
    
    switch (layout) {
      case 'long-scroll':
        return {
          containerCSS: 'background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%);',
          messagesCSS: 'background-color: rgba(255, 255, 255, 0.8);',
          inputCSS: 'border-top: 2px solid #e2e8f0;'
        };
      case 'multi-section':
        return {
          containerCSS: 'background: #ffffff;',
          messagesCSS: 'background: linear-gradient(145deg, #f1f5f9 0%, #ffffff 100%);',
          inputCSS: 'background: #f8fafc; border-radius: 12px 12px 0 0;'
        };
      default:
        return {
          containerCSS: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
          messagesCSS: 'background-color: rgba(255, 255, 255, 0.95);',
          inputCSS: 'background: rgba(255, 255, 255, 0.9);'
        };
    }
  }

  /**
   * Generate color scheme from deployed URL
   */
  private generateColorSchemeFromURL(deployedUrl: string): any {
    // Extract color scheme based on URL or use default gradients
    const urlHash = deployedUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      { primary: '#667eea', secondary: '#764ba2' },
      { primary: '#f093fb', secondary: '#f5576c' },
      { primary: '#4facfe', secondary: '#00f2fe' },
      { primary: '#43e97b', secondary: '#38f9d7' },
      { primary: '#fa709a', secondary: '#fee140' }
    ];
    
    const colorIndex = Math.abs(urlHash) % colors.length;
    const selectedColors = colors[colorIndex];
    
    return {
      cssVars: `
        --primary-color: ${selectedColors.primary};
        --secondary-color: ${selectedColors.secondary};
      `,
      gradient: `background: linear-gradient(135deg, ${selectedColors.primary} 0%, ${selectedColors.secondary} 100%);`
    };
  }

  /**
   * Save component to file
   */
  private saveComponent(agentId: string, componentCode: string): string {
    const componentsDir = path.join(
      process.cwd(),
      'client',
      'pages',
      'agents'
    );
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Generate filename
    const fileName = `${agentId.charAt(0).toUpperCase() + agentId.slice(1)}Agent.tsx`;
    const filePath = path.join(componentsDir, fileName);
    
    // Write component to file
    fs.writeFileSync(filePath, componentCode);
    
    console.log(`✅ Component saved to: ${filePath}`);
    
    return `/client/pages/agents/${fileName}`;
  }
}
