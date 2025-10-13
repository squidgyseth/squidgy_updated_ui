import axios from 'axios';

export interface FigmaFile {
  document: any;
  components: any;
  styles: any;
}

export interface FigmaConfig {
  fileUrl: string;
  nodeId?: string;
  accessToken: string;
}

export class FigmaService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken || process.env.FIGMA_ACCESS_TOKEN || '';
  }

  /**
   * Extract file ID from Figma URL
   */
  private extractFileId(url: string): string {
    // URL format: https://www.figma.com/file/FILE_ID/File-Name
    const match = url.match(/\/file\/([a-zA-Z0-9]+)\//);
    if (!match) {
      throw new Error('Invalid Figma URL format');
    }
    return match[1];
  }

  /**
   * Fetch Figma file data
   */
  async fetchFigmaFile(fileUrl: string, nodeId?: string): Promise<FigmaFile> {
    const fileId = this.extractFileId(fileUrl);
    
    const url = `https://api.figma.com/v1/files/${fileId}${nodeId ? `?ids=${nodeId}` : ''}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'X-Figma-Token': this.accessToken
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Figma file:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Figma file: ${error.message}`);
    }
  }

  /**
   * Extract colors from Figma file
   */
  extractColors(figmaData: FigmaFile): Record<string, string> {
    const colors: Record<string, string> = {};
    
    // Extract from styles
    if (figmaData.styles) {
      Object.entries(figmaData.styles).forEach(([key, style]: [string, any]) => {
        if (style.styleType === 'FILL' && style.fills?.[0]?.color) {
          const c = style.fills[0].color;
          const hex = this.rgbToHex(c.r, c.g, c.b);
          colors[style.name || key] = hex;
        }
      });
    }
    
    // Extract from document fills
    this.traverseNode(figmaData.document, (node: any) => {
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'SOLID' && fill.color) {
            const hex = this.rgbToHex(fill.color.r, fill.color.g, fill.color.b);
            colors[`color_${Object.keys(colors).length + 1}`] = hex;
          }
        });
      }
    });
    
    return colors;
  }

  /**
   * Extract typography from Figma file
   */
  extractTypography(figmaData: FigmaFile): any[] {
    const typography: any[] = [];
    
    this.traverseNode(figmaData.document, (node: any) => {
      if (node.type === 'TEXT' && node.style) {
        typography.push({
          name: node.name,
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
          fontWeight: node.style.fontWeight,
          lineHeight: node.style.lineHeightPx,
          letterSpacing: node.style.letterSpacing
        });
      }
    });
    
    return typography;
  }

  /**
   * Extract layout structure
   */
  extractLayout(figmaData: FigmaFile): any {
    const layout: any = {
      type: 'root',
      children: []
    };
    
    const processNode = (node: any): any => {
      const processed: any = {
        name: node.name,
        type: node.type,
        bounds: node.absoluteBoundingBox
      };
      
      if (node.layoutMode) {
        processed.layout = {
          mode: node.layoutMode,
          padding: {
            top: node.paddingTop,
            right: node.paddingRight,
            bottom: node.paddingBottom,
            left: node.paddingLeft
          },
          gap: node.itemSpacing
        };
      }
      
      if (node.children) {
        processed.children = node.children.map(processNode);
      }
      
      return processed;
    };
    
    if (figmaData.document.children) {
      layout.children = figmaData.document.children.map(processNode);
    }
    
    return layout;
  }

  /**
   * Helper: Traverse Figma node tree
   */
  private traverseNode(node: any, callback: (node: any) => void) {
    callback(node);
    if (node.children) {
      node.children.forEach((child: any) => this.traverseNode(child, callback));
    }
  }

  /**
   * Helper: Convert RGB to Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Generate design tokens from Figma
   */
  generateDesignTokens(figmaData: FigmaFile): any {
    return {
      colors: this.extractColors(figmaData),
      typography: this.extractTypography(figmaData),
      layout: this.extractLayout(figmaData)
    };
  }
}