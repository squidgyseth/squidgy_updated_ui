import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedFigmaData {
  html: string;
  css: string;
  title: string;
  styles: string[];
  structure: any;
}

export class FigmaScraperService {
  
  /**
   * Scrape deployed Figma site and extract HTML/CSS
   */
  async scrapeFigmaDeployedSite(url: string): Promise<ScrapedFigmaData> {
    console.log(`🕷️ Scraping deployed Figma site: ${url}`);
    
    try {
      // Fetch the HTML content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract title
      const title = $('title').text() || 'Figma Design';
      
      // Extract all CSS styles
      const styles: string[] = [];
      
      // Inline styles
      $('style').each((_, element) => {
        const css = $(element).html();
        if (css) styles.push(css);
      });
      
      // External stylesheets (get URLs)
      $('link[rel="stylesheet"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          console.log(`📎 Found external stylesheet: ${href}`);
        }
      });
      
      // Extract body content (main UI)
      const bodyHtml = $('body').html() || '';
      
      // Extract color palette from CSS
      const colorPalette = this.extractColors(styles.join('\n'));
      
      // Extract layout structure
      const structure = this.analyzeStructure($, bodyHtml);
      
      console.log(`✅ Scraped data:`, {
        title,
        stylesCount: styles.length,
        htmlLength: bodyHtml.length,
        colors: colorPalette.length
      });
      
      return {
        html: bodyHtml,
        css: styles.join('\n'),
        title,
        styles,
        structure: {
          ...structure,
          colors: colorPalette
        }
      };
      
    } catch (error: any) {
      console.error('Error scraping Figma deployed site:', error.message);
      throw new Error(`Failed to scrape deployed Figma site: ${error.message}`);
    }
  }
  
  /**
   * Extract color palette from CSS
   */
  private extractColors(css: string): string[] {
    const colors: Set<string> = new Set();
    
    // Match hex colors
    const hexMatches = css.match(/#[a-fA-F0-9]{3,8}/g);
    if (hexMatches) {
      hexMatches.forEach(color => colors.add(color.toLowerCase()));
    }
    
    // Match rgb/rgba colors
    const rgbMatches = css.match(/rgba?\([^)]+\)/g);
    if (rgbMatches) {
      rgbMatches.forEach(color => {
        // Convert to hex for consistency
        const hex = this.rgbToHex(color);
        if (hex) colors.add(hex);
      });
    }
    
    return Array.from(colors).slice(0, 10); // Limit to 10 colors
  }
  
  /**
   * Analyze HTML structure for layout information
   */
  private analyzeStructure($: cheerio.CheerioAPI): any {
    const structure = {
      hasHeader: false,
      hasFooter: false,
      hasSidebar: false,
      layoutType: 'unknown',
      mainSections: [] as string[],
      formElements: [] as string[],
      buttons: [] as string[]
    };
    
    // Detect common UI patterns
    if ($('header, .header, [role="banner"]').length > 0) {
      structure.hasHeader = true;
    }
    
    if ($('footer, .footer, [role="contentinfo"]').length > 0) {
      structure.hasFooter = true;
    }
    
    if ($('aside, .sidebar, .side-nav').length > 0) {
      structure.hasSidebar = true;
    }
    
    // Detect layout type based on CSS classes/structure
    if ($('.flex, .d-flex').length > 0) {
      structure.layoutType = 'flexbox';
    } else if ($('.grid, .d-grid').length > 0) {
      structure.layoutType = 'grid';
    }
    
    // Extract form elements
    $('input, textarea, select, button').each((_, element) => {
      const tag = element.tagName.toLowerCase();
      const type = $(element).attr('type') || tag;
      structure.formElements.push(type);
    });
    
    // Extract button text
    $('button, .btn, [role="button"]').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length < 50) {
        structure.buttons.push(text);
      }
    });
    
    return structure;
  }
  
  /**
   * Convert RGB to Hex (simplified)
   */
  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  /**
   * Generate design tokens from scraped data
   */
  generateDesignTokens(scrapedData: ScrapedFigmaData): any {
    return {
      colors: scrapedData.structure.colors || [],
      title: scrapedData.title,
      layout: {
        type: scrapedData.structure.layoutType,
        hasHeader: scrapedData.structure.hasHeader,
        hasSidebar: scrapedData.structure.hasSidebar,
        hasFooter: scrapedData.structure.hasFooter
      },
      components: {
        buttons: scrapedData.structure.buttons || [],
        formElements: scrapedData.structure.formElements || []
      },
      css: scrapedData.css,
      originalHtml: scrapedData.html
    };
  }
}
