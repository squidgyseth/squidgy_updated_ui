import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface DesignAnalysis {
  sections: DesignSection[];
  colorScheme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent?: string;
  };
  layout: {
    type: 'single-column' | 'two-column' | 'multi-section' | 'dashboard';
    components: string[];
    spacing: 'tight' | 'normal' | 'spacious';
  };
  typography: {
    headingStyle: string;
    bodyStyle: string;
    fontSizes: string[];
  };
  components: ComponentAnalysis[];
  overallStyle: 'modern' | 'classic' | 'minimal' | 'colorful' | 'professional';
}

export interface DesignSection {
  position: 'top' | 'middle' | 'bottom';
  content: string;
  elements: string[];
  purpose: string;
}

export interface ComponentAnalysis {
  type: string;
  description: string;
  styling: string;
  functionality: string;
}

export class ScreenshotAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze multiple screenshots using OpenAI Vision API
   */
  async analyzeScreenshots(screenshotPaths: string[]): Promise<DesignAnalysis> {

    // Prepare images for OpenAI
    const imageMessages = await this.prepareScreenshotsForAnalysis(screenshotPaths);

    const systemPrompt = `You are an expert UI/UX designer and React developer. Analyze these screenshots of a web interface and provide a comprehensive design analysis.

The screenshots show different sections of the same page (top, middle, bottom sections). Please analyze:

1. **Visual Design**: Colors, typography, spacing, layout structure
2. **Components**: Identify all UI components (buttons, forms, cards, etc.)
3. **Layout Pattern**: How sections are organized and flow together
4. **Content Structure**: What information is displayed and how it's organized
5. **Interactive Elements**: Forms, buttons, inputs, and their styling
6. **Overall Design Language**: Modern, minimal, professional, etc.

Provide a detailed JSON response that will be used to generate a React component that matches this design exactly.`;

    const userPrompt = `Analyze these screenshots and provide a comprehensive design analysis in the following JSON format:

{
  "sections": [
    {
      "position": "top|middle|bottom",
      "content": "description of what's in this section",
      "elements": ["list", "of", "ui", "elements"],
      "purpose": "what this section is for"
    }
  ],
  "colorScheme": {
    "primary": "#hex-color",
    "secondary": "#hex-color", 
    "background": "#hex-color",
    "text": "#hex-color",
    "accent": "#hex-color"
  },
  "layout": {
    "type": "single-column|two-column|multi-section|dashboard",
    "components": ["Header", "MainContent", "Sidebar", "Footer"],
    "spacing": "tight|normal|spacious"
  },
  "typography": {
    "headingStyle": "description of heading styles",
    "bodyStyle": "description of body text styles", 
    "fontSizes": ["xl", "lg", "md", "sm"]
  },
  "components": [
    {
      "type": "Button|Card|Form|Input|etc",
      "description": "detailed description",
      "styling": "CSS/Tailwind classes needed",
      "functionality": "what it does"
    }
  ],
  "overallStyle": "modern|classic|minimal|colorful|professional"
}

Focus on extracting exact colors, precise layout details, and specific styling that can be directly translated to Tailwind CSS classes.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Use vision model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: userPrompt },
            ...imageMessages
          ]}
        ],
        max_tokens: 4000,
        temperature: 0.1 // Low temperature for consistent analysis
      });

      const analysisText = response.choices[0].message.content;

      // Parse JSON response
      const analysis = this.parseAnalysisResponse(analysisText);
      
      return analysis;

    } catch (error: any) {
      console.error('❌ Error analyzing screenshots:', error.message);
      
      // Fallback to basic analysis if LLM fails
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Prepare screenshots for OpenAI Vision API
   */
  private async prepareScreenshotsForAnalysis(screenshotPaths: string[]): Promise<any[]> {
    const imageMessages = [];

    for (const screenshotPath of screenshotPaths) {
      if (fs.existsSync(screenshotPath) && !screenshotPath.includes('full_page.png')) {
        const imageBuffer = fs.readFileSync(screenshotPath);
        const base64Image = imageBuffer.toString('base64');
        
        const fileName = path.basename(screenshotPath);
        const sectionLabel = fileName.includes('screenshot_0') ? 'TOP SECTION' : 
                           fileName.includes('screenshot_1') ? 'MIDDLE SECTION' :
                           fileName.includes('screenshot_2') ? 'BOTTOM SECTION' : 
                           'ADDITIONAL SECTION';

        imageMessages.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${base64Image}`,
            detail: "high"
          }
        });

        imageMessages.push({
          type: "text", 
          text: `^ ${sectionLabel} of the interface`
        });
      }
    }

    return imageMessages;
  }

  /**
   * Parse the LLM response and handle potential JSON parsing issues
   */
  private parseAnalysisResponse(analysisText: string | null): DesignAnalysis {
    if (!analysisText) {
      return this.createFallbackAnalysis();
    }

    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const parsed = JSON.parse(jsonString);
        
        // Validate required fields
        if (parsed.sections && parsed.colorScheme && parsed.layout) {
          return parsed as DesignAnalysis;
        }
      }
      
      // If no valid JSON found, create structured analysis from text
      return this.extractAnalysisFromText(analysisText);
      
    } catch (error) {
      return this.extractAnalysisFromText(analysisText);
    }
  }

  /**
   * Extract analysis from text response when JSON parsing fails
   */
  private extractAnalysisFromText(text: string): DesignAnalysis {
    // Basic text analysis to extract key information
    const hasForm = text.toLowerCase().includes('form') || text.toLowerCase().includes('input');
    const hasCards = text.toLowerCase().includes('card');
    const hasButton = text.toLowerCase().includes('button');
    
    return {
      sections: [
        {
          position: 'top',
          content: 'Header and navigation area',
          elements: ['header', 'title'],
          purpose: 'Page introduction and navigation'
        },
        {
          position: 'middle', 
          content: 'Main content area with forms and inputs',
          elements: hasForm ? ['forms', 'inputs', 'buttons'] : ['content', 'text'],
          purpose: 'Primary user interaction area'
        },
        {
          position: 'bottom',
          content: 'Action buttons and footer',
          elements: ['buttons', 'actions'],
          purpose: 'User actions and completion'
        }
      ],
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#64748b', 
        background: '#ffffff',
        text: '#1f2937'
      },
      layout: {
        type: hasForm ? 'two-column' : 'single-column',
        components: ['Header', 'MainContent', 'ActionArea'],
        spacing: 'normal'
      },
      typography: {
        headingStyle: 'Large, bold headings',
        bodyStyle: 'Clean, readable body text',
        fontSizes: ['2xl', 'xl', 'lg', 'md']
      },
      components: [
        ...(hasForm ? [{
          type: 'Form',
          description: 'Input form with multiple fields',
          styling: 'border rounded-lg p-4',
          functionality: 'Data collection'
        }] : []),
        ...(hasButton ? [{
          type: 'Button',
          description: 'Primary action button',
          styling: 'bg-blue-500 text-white px-4 py-2 rounded',
          functionality: 'Submit or navigation'
        }] : []),
        ...(hasCards ? [{
          type: 'Card',
          description: 'Content cards with information',
          styling: 'bg-white border rounded-lg shadow p-6',
          functionality: 'Information display'
        }] : [])
      ],
      overallStyle: 'modern'
    };
  }

  /**
   * Create fallback analysis when LLM is unavailable
   */
  private createFallbackAnalysis(): DesignAnalysis {
    return {
      sections: [
        {
          position: 'top',
          content: 'Header section with title and navigation',
          elements: ['header', 'title', 'navigation'],
          purpose: 'Page header and branding'
        },
        {
          position: 'middle',
          content: 'Main content area',
          elements: ['content', 'cards', 'information'],
          purpose: 'Primary content display'
        },
        {
          position: 'bottom',
          content: 'Action area and footer',
          elements: ['buttons', 'actions', 'footer'],
          purpose: 'User actions and page completion'
        }
      ],
      colorScheme: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#f8fafc',
        text: '#1f2937',
        accent: '#10b981'
      },
      layout: {
        type: 'single-column',
        components: ['Header', 'MainContent', 'Footer'],
        spacing: 'normal'
      },
      typography: {
        headingStyle: 'Bold, modern headings',
        bodyStyle: 'Clean, readable text',
        fontSizes: ['text-2xl', 'text-xl', 'text-lg', 'text-base']
      },
      components: [
        {
          type: 'Header',
          description: 'Main page header',
          styling: 'bg-white border-b px-6 py-4',
          functionality: 'Page navigation and branding'
        },
        {
          type: 'Content',
          description: 'Main content area',
          styling: 'max-w-4xl mx-auto p-6',
          functionality: 'Display primary information'
        },
        {
          type: 'Button',
          description: 'Action buttons',
          styling: 'bg-blue-500 text-white px-4 py-2 rounded-lg',
          functionality: 'User interactions'
        }
      ],
      overallStyle: 'modern'
    };
  }
}
