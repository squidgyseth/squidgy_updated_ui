import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotData {
  screenshots: string[];
  pageInfo: {
    title: string;
    url: string;
    dimensions: { width: number; height: number };
    totalHeight: number;
    screenshotCount: number;
  };
}

export class PlaywrightScreenshotService {
  private browser: Browser | null = null;

  /**
   * Initialize browser
   */
  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Capture screenshots of deployed Figma site by scrolling
   */
  async captureDeployedFigmaScreenshots(
    deployedUrl: string,
    agentId: string
  ): Promise<ScreenshotData> {
    
    await this.initialize();
    
    const page = await this.browser!.newPage();
    
    try {
      // Set viewport size for consistent screenshots
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // Navigate to the deployed Figma site
      await page.goto(deployedUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for any dynamic content to load
      await page.waitForTimeout(3000);
      
      // Get page info
      const title = await page.title();
      const url = page.url();
      const dimensions = page.viewportSize()!;
      
      // Get scrollable container and its height - specifically for Figma sites
      const scrollInfo = await page.evaluate(() => {
        // Find the main scrollable container (usually has overflow and large height)
        const containers = Array.from(document.querySelectorAll('*')).filter(el => {
          const element = el as HTMLElement;
          const style = getComputedStyle(element);
          return (
            element.scrollHeight > window.innerHeight && 
            (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll')
          );
        });
        
        // If no scrollable containers, find the largest element
        if (containers.length === 0) {
          const allElements = Array.from(document.querySelectorAll('*'));
          const largestElement = allElements.reduce((largest, current) => {
            const currentEl = current as HTMLElement;
            const largestEl = largest as HTMLElement;
            return currentEl.scrollHeight > largestEl.scrollHeight ? currentEl : largestEl;
          }, allElements[0]);
          containers.push(largestElement);
        }
        
        const mainContainer = containers[0] as HTMLElement;
        
        return {
          hasScrollableContainer: containers.length > 0,
          containerSelector: mainContainer ? mainContainer.tagName.toLowerCase() + 
            (mainContainer.className ? '.' + mainContainer.className.split(' ').join('.') : '') : null,
          containerHeight: mainContainer ? mainContainer.scrollHeight : document.body.scrollHeight,
          windowHeight: window.innerHeight,
          bodyHeight: document.body.scrollHeight
        };
      });
      
      const totalHeight = scrollInfo.containerHeight;
      
      
      // Create screenshots directory
      const screenshotsDir = path.join(
        process.cwd(),
        'temp',
        'screenshots',
        agentId
      );
      
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      
      const screenshots: string[] = [];
      const viewportHeight = dimensions.height;
      const scrollStep = Math.min(viewportHeight * 0.7, 500); // Smaller steps for better coverage
      let currentScroll = 0;
      let screenshotIndex = 0;
      
      // Reset scroll to top first
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
      
      // Capture screenshots by scrolling - improved logic
      do {
        
        // Scroll to position - scroll the container if it exists, otherwise scroll the window
        await page.evaluate(({ scrollY, scrollInfo }) => {
          if (scrollInfo.hasScrollableContainer) {
            // Find the container and scroll it
            const containers = Array.from(document.querySelectorAll('*')).filter(el => {
              const element = el as HTMLElement;
              const style = getComputedStyle(element);
              return (
                element.scrollHeight > window.innerHeight && 
                (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll')
              );
            });
            
            if (containers.length > 0) {
              const container = containers[0] as HTMLElement;
              container.scrollTop = scrollY;
            } else {
              window.scrollTo(0, scrollY);
            }
          } else {
            window.scrollTo(0, scrollY);
          }
        }, { scrollY: currentScroll, scrollInfo });
        
        // Wait for scroll to complete and content to stabilize
        await page.waitForTimeout(1500);
        
        // Take screenshot with agent_id prefix
        const screenshotPath = path.join(screenshotsDir, `${agentId}_screenshot_${screenshotIndex}.png`);
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: false, // Capture only viewport
          type: 'png'
        });
        
        screenshots.push(screenshotPath);
        screenshotIndex++;
        
        // Move to next scroll position
        currentScroll += scrollStep;
        
        // Safety limit to prevent infinite loops
        if (screenshotIndex > 25) {
          break;
        }
        
        // Check if we've reached the bottom - check container if it exists
        const isAtBottom = await page.evaluate(({ scrollInfo }) => {
          if (scrollInfo.hasScrollableContainer) {
            const containers = Array.from(document.querySelectorAll('*')).filter(el => {
              const element = el as HTMLElement;
              const style = getComputedStyle(element);
              return (
                element.scrollHeight > window.innerHeight && 
                (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll')
              );
            });
            
            if (containers.length > 0) {
              const container = containers[0] as HTMLElement;
              return (container.scrollTop + container.clientHeight) >= container.scrollHeight - 10;
            }
          }
          
          return (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 10;
        }, { scrollInfo });
        
        if (isAtBottom && currentScroll > totalHeight * 0.8) {
          break;
        }
        
      } while (currentScroll < totalHeight + viewportHeight); // Add extra buffer
      
      // Capture one full page screenshot as well with agent_id prefix
      const fullPagePath = path.join(screenshotsDir, `${agentId}_full_page.png`);
      await page.screenshot({ 
        path: fullPagePath,
        fullPage: true,
        type: 'png'
      });
      screenshots.push(fullPagePath);
      
      
      return {
        screenshots,
        pageInfo: {
          title,
          url,
          dimensions,
          totalHeight,
          screenshotCount: screenshots.length
        }
      };
      
    } catch (error: any) {
      console.error('Error capturing screenshots:', error.message);
      throw new Error(`Failed to capture screenshots: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Analyze screenshots and generate design insights
   */
  async analyzeScreenshots(screenshotData: ScreenshotData): Promise<any> {
    const { screenshots, pageInfo } = screenshotData;
    
    // Basic analysis from screenshot data
    const analysis = {
      pageInfo,
      screenshotPaths: screenshots,
      insights: {
        isLongPage: pageInfo.totalHeight > pageInfo.dimensions.height * 2,
        isWideLayout: pageInfo.dimensions.width > 1000,
        hasMultipleSections: screenshots.length > 3,
        suggestedLayout: this.suggestLayoutType(pageInfo, screenshots.length)
      }
    };
    
    
    return analysis;
  }

  /**
   * Suggest layout type based on page characteristics
   */
  private suggestLayoutType(pageInfo: any, screenshotCount: number): string {
    if (pageInfo.totalHeight > pageInfo.dimensions.height * 3) {
      return 'long-scroll';
    } else if (screenshotCount <= 2) {
      return 'single-page';
    } else {
      return 'multi-section';
    }
  }

  /**
   * Clean up temporary screenshot files
   */
  async cleanupScreenshots(agentId: string) {
    const screenshotsDir = path.join(
      process.cwd(),
      'temp',
      'screenshots',
      agentId
    );
    
    if (fs.existsSync(screenshotsDir)) {
      fs.rmSync(screenshotsDir, { recursive: true, force: true });
    }
  }
}
