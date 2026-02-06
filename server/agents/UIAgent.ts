import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import type { 
  CodeGenerationRequest, 
  GeneratedCode, 
  ValidationError, 
  UIAgentCapabilities 
} from '../types/agentSystemTypes.ts';

export class UIAgent {
  private openai: OpenAI;
  private capabilities: UIAgentCapabilities;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please check your .env file.');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });

    this.capabilities = {
      name: 'UI Code Generation Agent',
      description: 'Generates React components from Figma designs and screenshots',
      inputTypes: ['screenshots', 'figma_data', 'error_feedback'],
      outputTypes: ['react_component'],
      maxProcessingTime: 60000, // 60 seconds
      version: '1.0.0',
      supportedFrameworks: ['React', 'TypeScript', 'Tailwind CSS'],
      designAnalysisFeatures: ['color_extraction', 'layout_analysis', 'component_identification'],
      codeGenerationFeatures: ['responsive_design', 'accessibility', 'modern_react_patterns']
    };
  }

  /**
   * Generate React component code from design sources
   */
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {

    try {
      let componentCode: string;
      let confidence: number;
      let reasoning: string;

      if (request.sourceType === 'figma_deployed' && request.screenshots) {
        const result = await this.generateFromScreenshots(request);
        componentCode = result.code;
        confidence = result.confidence;
        reasoning = result.reasoning;
      } else if (request.sourceType === 'figma_api' && request.figmaData) {
        const result = await this.generateFromFigmaData(request);
        componentCode = result.code;
        confidence = result.confidence;
        reasoning = result.reasoning;
      } else {
        throw new Error('Invalid request: missing required source data');
      }

      // Clean and validate the generated code
      const cleanedCode = this.cleanGeneratedCode(componentCode);
      const dependencies = this.extractDependencies(cleanedCode);
      const imports = this.extractImports(cleanedCode);

      return {
        componentCode: cleanedCode,
        fileName: this.generateFileName(request.agentId, request.pageName),
        filePath: this.generateFilePath(request.agentId, request.pageName),
        dependencies,
        imports,
        confidence,
        reasoning
      };

    } catch (error: any) {
      console.error('🚨 UI Agent Error:', error.message);
      throw new Error(`UI Agent failed: ${error.message}`);
    }
  }

  /**
   * Generate code from screenshots using OpenAI with restricted prompts
   */
  private async generateFromScreenshots(request: CodeGenerationRequest): Promise<{
    code: string;
    confidence: number;
    reasoning: string;
  }> {
    if (!request.screenshots || request.screenshots.length === 0) {
      throw new Error('No screenshots provided');
    }

    const prompt = this.buildScreenshotPrompt(request);

    // Prepare messages with screenshots as images for vision model
    const messages: any[] = [
      { role: "system", content: this.getRestrictedSystemPrompt() },
      {
        role: "user", 
        content: [
          { type: "text", text: prompt },
          ...this.encodeScreenshotsForVision(request.screenshots)
        ]
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // Use full vision model to analyze screenshots
      messages: messages,
      max_tokens: 3000,
      temperature: 0.1,
      top_p: 0.3
    });

    const generatedContent = response.choices[0].message.content || '';
    const extractedCode = this.extractCodeFromResponse(generatedContent);

    return {
      code: extractedCode,
      confidence: this.calculateConfidence(generatedContent, request),
      reasoning: this.extractReasoning(generatedContent)
    };
  }

  /**
   * Generate code from Figma API data
   */
  private async generateFromFigmaData(request: CodeGenerationRequest): Promise<{
    code: string;
    confidence: number;
    reasoning: string;
  }> {
    const prompt = this.buildFigmaPrompt(request);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: this.getRestrictedSystemPrompt() },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.0,
      top_p: 0.1
    });

    const generatedContent = response.choices[0].message.content || '';
    const extractedCode = this.extractCodeFromResponse(generatedContent);

    return {
      code: extractedCode,
      confidence: this.calculateConfidence(generatedContent, request),
      reasoning: this.extractReasoning(generatedContent)
    };
  }

  /**
   * Build prompt for screenshot-based generation
   */
  private buildScreenshotPrompt(request: CodeGenerationRequest): string {
    const iterationContext = request.iteration && request.iteration > 1 
      ? this.buildIterationContext(request) 
      : '';

    const screenshotCount = request.screenshots?.length || 0;

    return `CRITICAL: Analyze the ${screenshotCount} screenshots provided and recreate the EXACT design shown.

IMPORTANT: These screenshots show DIFFERENT PARTS of the SAME PAGE (scrolled positions).
You must combine ALL elements from ALL screenshots to create the COMPLETE page.

DO NOT CREATE A GENERIC TEMPLATE!
Recreate EXACTLY what you see in the screenshots, including:
- All text content as shown
- All form layouts and inputs
- All buttons and their labels
- The exact color scheme and styling
- Every UI element from every screenshot

TECHNICAL TEMPLATE - Copy this exactly and only modify the JSX:

import React, { useState } from 'react';
import { Send, Mail, Users, TrendingUp, Star, Calendar, ArrowRight, Mic } from 'lucide-react';
import { useUser } from '../../../hooks/useUser';
import { sendToN8nWorkflow } from '../../../lib/n8nService';

export default function ${this.generateComponentName(request.agentId, request.pageName)}() {
  const { userId, sessionId } = useUser();
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    await sendToN8nWorkflow(userId, message, '${request.agentId}', sessionId, {});
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* REPLACE THIS ENTIRE JSX WITH THE EXACT DESIGN FROM THE SCREENSHOTS */}
      <div className="p-6">
        <h1>Recreate the exact design from screenshots</h1>
      </div>
    </div>
  );
}

CRITICAL: 
1. ANALYZE ALL SCREENSHOTS CAREFULLY
2. RECREATE THE EXACT DESIGN - every element, text, color, layout
3. DO NOT use generic templates - build what you see in the screenshots
4. Return ONLY the template above with the JSX replaced to match screenshots exactly`;
  }

  /**
   * Build iteration context for error fixing
   */
  private buildIterationContext(request: CodeGenerationRequest): string {
    if (!request.previousErrors || request.previousErrors.length === 0) {
      return '';
    }

    const errorSummary = request.previousErrors
      .map(error => `- ${error.type}: ${error.message}${error.suggestion ? ` (Suggestion: ${error.suggestion})` : ''}`)
      .join('\n');

    return `
PREVIOUS ITERATION FAILED - PLEASE FIX THESE ERRORS:
${errorSummary}

CRITICAL: Fix the errors and use this template - ANALYZE SCREENSHOTS TO RECREATE THE EXACT DESIGN:

import React, { useState } from 'react';
import { Send, Mail, Users, TrendingUp, Star, Calendar, ArrowRight, Mic } from 'lucide-react';
import { useUser } from '../../../hooks/useUser';
import { sendToN8nWorkflow } from '../../../lib/n8nService';

export default function ${this.generateComponentName(request.agentId, request.pageName)}() {
  const { userId, sessionId } = useUser();
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    await sendToN8nWorkflow(userId, message, '${request.agentId}', sessionId, {});
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* RECREATE THE EXACT DESIGN FROM SCREENSHOTS - ANALYZE ALL SCREENSHOTS */}
    </div>
  );
}

Do not use generic templates. Look at the screenshots and recreate exactly what you see.
`;
  }

  /**
   * Build prompt for Figma API data
   */
  private buildFigmaPrompt(request: CodeGenerationRequest): string {
    return `You are a senior React developer. Generate a React component based on this Figma design data.

FIGMA DATA:
${JSON.stringify(request.figmaData, null, 2)}

COMPONENT REQUIREMENTS:
- Component Name: ${this.generateComponentName(request.agentId, request.pageName)}
- Use exact colors and typography from Figma data
- Implement the layout structure shown in the data
- Use TypeScript and Tailwind CSS

Generate ONLY the complete React component code:`;
  }

  /**
   * Get system prompt for UI Agent
   */
  private getUIAgentSystemPrompt(): string {
    return `You are an expert React developer and UI specialist. Your job is to generate pixel-perfect, production-ready React components.

EXPERTISE:
- 10+ years React/TypeScript experience
- Expert in Tailwind CSS
- Modern React patterns (hooks, functional components)
- Accessibility best practices
- Responsive design
- Code quality and maintainability

STYLE:
- Clean, readable code
- Proper TypeScript types
- Semantic HTML
- Tailwind CSS only (no custom styles)
- Modern React patterns
- Performance optimized

OUTPUT FORMAT:
- Generate ONLY React component code
- No explanations or comments
- Start with imports, end with export default
- Ensure code compiles without errors
- NO import.meta.env or environment variables
- Keep components simple and focused on UI`;
  }

  /**
   * Encode screenshots as base64 for vision model
   */
  private encodeScreenshotsForVision(screenshots: string[]): any[] {
    const encodedImages: any[] = [];
    
    for (const screenshotPath of screenshots) {
      try {
        const imageBuffer = fs.readFileSync(screenshotPath);
        const base64Image = imageBuffer.toString('base64');
        
        encodedImages.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${base64Image}`,
            detail: "high"
          }
        });
      } catch (error) {
        console.error(`Failed to encode screenshot ${screenshotPath}:`, error);
      }
    }
    
    return encodedImages;
  }

  /**
   * Get restricted system prompt that forces template compliance
   */
  private getRestrictedSystemPrompt(): string {
    return `You are a React code generator that creates PIXEL-PERFECT replicas of designs from screenshots.

CRITICAL REQUIREMENT: You are given MULTIPLE SCREENSHOTS that represent DIFFERENT SCROLL POSITIONS of the SAME PAGE.
You MUST analyze ALL screenshots and combine ALL elements to recreate the COMPLETE page design.

ANALYSIS INSTRUCTIONS:
1. Screenshot 0: Top section of the page
2. Screenshot 1: Middle section (scrolled down)
3. Screenshot 2: Bottom section (scrolled further)
4. Combine ALL sections to create the FULL page

DO NOT CREATE GENERIC TEMPLATES! Recreate the EXACT design shown including:
- All text content exactly as shown
- All form fields and inputs
- All buttons and interactive elements
- Exact colors, spacing, and layout
- Every single UI element visible in ANY screenshot

STRICT RULES:
1. ONLY modify the JSX inside the return statement
2. NEVER add import.meta, process.env, or any environment variables
3. NEVER add configuration objects or complex logic
4. NEVER add extra imports beyond what's provided
5. Output ONLY valid TypeScript React code
6. Follow the template EXACTLY

You are forbidden from adding:
- import.meta.env
- process.env
- configuration objects
- environment variables
- complex state logic
- external API calls
- additional imports

Create the EXACT design from the screenshots, not a generic template.`;
  }


  /**
   * Extract clean React code from AI response
   */
  private extractCodeFromResponse(response: string): string {
    // Check for AI refusal
    if (response.includes("I'm sorry") || response.includes("I can't assist") || response.includes("I cannot")) {
      throw new Error('AI refused to generate code. The request may have triggered content policy filters.');
    }
    
    // Remove markdown code blocks
    let code = response.replace(/```(?:tsx?|javascript|jsx?)?\n?/g, '');
    
    // Remove any explanatory text before imports
    const importMatch = code.match(/^[\s\S]*?(import[\s\S]*)/);
    if (importMatch) {
      code = importMatch[1];
    }

    // POST-PROCESSING: Remove forbidden patterns that AI keeps generating
    code = this.cleanForbiddenPatterns(code);

    // Ensure it ends with export default
    if (!code.includes('export default')) {
      throw new Error('Generated code missing export default statement');
    }

    return code.trim();
  }

  /**
   * Clean forbidden patterns from AI-generated code
   */
  private cleanForbiddenPatterns(code: string): string {
    // Remove import.meta.env usage and replace with simple values
    code = code.replace(/import\.meta\.env\.[A-Z_]+/g, '""');
    
    // Remove process.env usage
    code = code.replace(/process\.env\.[A-Z_]+/g, '""');
    
    // Remove configuration objects
    code = code.replace(/const\s+config\s*=\s*\{[^}]*\}/gm, '');
    
    // Remove environment variable imports
    code = code.replace(/import\s*\{\s*[^}]*env[^}]*\}\s*from[^;]+;/gi, '');
    
    // Remove complex API configuration
    code = code.replace(/const\s+api[A-Z][a-zA-Z]*\s*=\s*[^;]+;/gm, '');
    
    // Remove any remaining import.meta references
    code = code.replace(/import\.meta[^\s]*/g, '""');
    
    // Clean up empty lines
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return code;
  }

  /**
   * Clean and format generated code
   */
  private cleanGeneratedCode(code: string): string {
    // Remove any trailing characters after the last }
    const lines = code.split('\n');
    let lastBraceIndex = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('export default') || lines[i].trim() === '}') {
        lastBraceIndex = i;
        break;
      }
    }
    
    if (lastBraceIndex > -1) {
      code = lines.slice(0, lastBraceIndex + 1).join('\n');
    }

    return code;
  }

  /**
   * Extract dependencies from generated code
   */
  private extractDependencies(code: string): string[] {
    const dependencies = ['react'];
    
    if (code.includes('lucide-react')) dependencies.push('lucide-react');
    if (code.includes('react-router-dom')) dependencies.push('react-router-dom');
    if (code.includes('@radix-ui')) dependencies.push('@radix-ui/react-slot');
    
    return [...new Set(dependencies)];
  }

  /**
   * Extract imports from generated code
   */
  private extractImports(code: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * Calculate confidence score for generated code
   */
  private calculateConfidence(response: string, request: CodeGenerationRequest): number {
    let confidence = 50; // Base confidence
    
    // Higher confidence for successful previous iterations
    if (request.iteration === 1) confidence += 20;
    
    // Check code quality indicators
    if (response.includes('TypeScript')) confidence += 10;
    if (response.includes('useState') || response.includes('useEffect')) confidence += 10;
    if (response.includes('className=')) confidence += 10;
    if (response.includes('export default')) confidence += 10;
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * Extract reasoning from AI response
   */
  private extractReasoning(response: string): string {
    // Look for reasoning patterns in the response
    const reasoningPatterns = [
      /reasoning[:\s]+(.*?)(?:\n|$)/i,
      /approach[:\s]+(.*?)(?:\n|$)/i,
      /design[:\s]+(.*?)(?:\n|$)/i
    ];

    for (const pattern of reasoningPatterns) {
      const match = response.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Generated React component based on design analysis';
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
   * Generate file name
   */
  private generateFileName(agentId: string, pageName: string): string {
    return `${pageName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.tsx`;
  }

  /**
   * Generate file path
   */
  private generateFilePath(agentId: string, pageName: string): string {
    return path.join(
      process.cwd(),
      'client',
      'pages',
      'agents',
      agentId,
      this.generateFileName(agentId, pageName)
    );
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): UIAgentCapabilities {
    return this.capabilities;
  }
}
