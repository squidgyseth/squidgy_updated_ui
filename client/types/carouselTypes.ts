// Carousel System Types for Multi-Page Agents

export interface AgentPage {
  name: string;
  path: string;
  order: number;
  component?: string;
  generatedComponent?: string;
  validated?: boolean;
}

export interface CarouselState {
  currentPageIndex: number;
  totalPages: number;
  isTransitioning: boolean;
  autoAdvance: boolean;
  showNavigation: boolean;
}

export interface AgentCarouselConfig {
  agentId: string;
  agentName: string;
  category: string;
  pages: AgentPage[];
  defaultPage?: string;
  navigationStyle: 'arrows' | 'dots' | 'both' | 'none';
  autoAdvance?: boolean;
  transitionDuration?: number;
}

export interface PageViewProps {
  agentId: string;
  pageName: string;
  pageComponent: React.ComponentType;
  isActive: boolean;
  onInteraction?: () => void;
}

export interface CarouselControls {
  goToNext: () => void;
  goToPrevious: () => void;
  goToPage: (index: number) => void;
  getCurrentPage: () => number;
  getTotalPages: () => number;
}

export interface CarouselNavigation {
  showPrevious: boolean;
  showNext: boolean;
  showDots: boolean;
  showPageInfo: boolean;
  position: 'top' | 'bottom' | 'both';
}
