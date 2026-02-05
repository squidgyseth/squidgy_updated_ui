import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Layers, Clock, CheckCircle } from 'lucide-react';
import type { 
  AgentCarouselConfig, 
  CarouselState, 
  CarouselControls,
  AgentPage 
} from '../types/carouselTypes';

interface AgentPageCarouselProps {
  config: AgentCarouselConfig;
  className?: string;
}

export default function AgentPageCarousel({ config, className = '' }: AgentPageCarouselProps) {
  const [carouselState, setCarouselState] = useState<CarouselState>({
    currentPageIndex: 0,
    totalPages: config.pages.length,
    isTransitioning: false,
    autoAdvance: config.autoAdvance || false,
    showNavigation: config.pages.length > 1
  });

  const [loadedComponents, setLoadedComponents] = useState<Map<string, React.ComponentType>>(new Map());

  // Load page components dynamically
  useEffect(() => {
    loadPageComponents();
  }, [config.pages]);

  // Auto-advance functionality
  useEffect(() => {
    if (carouselState.autoAdvance && carouselState.totalPages > 1) {
      const interval = setInterval(() => {
        goToNext();
      }, config.transitionDuration || 10000); // 10 seconds default

      return () => clearInterval(interval);
    }
  }, [carouselState.autoAdvance, carouselState.currentPageIndex]);

  /**
   * Dynamically load page components
   */
  const loadPageComponents = async () => {
    const components = new Map<string, React.ComponentType>();

    for (const page of config.pages) {
      // Extract the page filename from the path in YAML
      const pathParts = page.path.split('/');
      const pageName = pathParts[pathParts.length - 1];
      
      // Fix the mismatch between hyphens in path and underscores in filename
      const fileName = pageName.replace(/-/g, '_');
      
      // Build the import path - this must match the actual file location
      const importPath = `../pages/agents/${config.agentId}/${fileName}`;
      
      
      try {
        // Dynamically import the component
        const Component = lazy(() => import(/* @vite-ignore */ importPath));
        components.set(page.name, Component);
      } catch (error) {
        console.error(`Failed to load component for ${page.name}:`, error);
        // No fallback - component must exist
      }
    }

    setLoadedComponents(components);
  };

  /**
   * Carousel Controls
   */
  const controls: CarouselControls = {
    goToNext: () => {
      if (carouselState.isTransitioning) return;
      
      setCarouselState(prev => ({
        ...prev,
        isTransitioning: true
      }));

      setTimeout(() => {
        setCarouselState(prev => ({
          ...prev,
          currentPageIndex: (prev.currentPageIndex + 1) % prev.totalPages,
          isTransitioning: false
        }));
      }, 150);
    },

    goToPrevious: () => {
      if (carouselState.isTransitioning) return;
      
      setCarouselState(prev => ({
        ...prev,
        isTransitioning: true
      }));

      setTimeout(() => {
        setCarouselState(prev => ({
          ...prev,
          currentPageIndex: prev.currentPageIndex === 0 ? prev.totalPages - 1 : prev.currentPageIndex - 1,
          isTransitioning: false
        }));
      }, 150);
    },

    goToPage: (index: number) => {
      if (index >= 0 && index < carouselState.totalPages && !carouselState.isTransitioning) {
        setCarouselState(prev => ({
          ...prev,
          isTransitioning: true
        }));

        setTimeout(() => {
          setCarouselState(prev => ({
            ...prev,
            currentPageIndex: index,
            isTransitioning: false
          }));
        }, 150);
      }
    },

    getCurrentPage: () => carouselState.currentPageIndex,
    getTotalPages: () => carouselState.totalPages
  };

  const currentPage = config.pages[carouselState.currentPageIndex];
  const CurrentComponent = loadedComponents.get(currentPage?.name);

  const goToNext = controls.goToNext;
  const goToPrevious = controls.goToPrevious;

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Agent Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{config.agentName}</h2>
              <p className="text-white/80 text-sm">{config.category}</p>
            </div>
          </div>
          
          {/* Page Indicator */}
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
            Page {carouselState.currentPageIndex + 1} of {carouselState.totalPages}
          </div>
        </div>

        {/* Page Navigation Tabs */}
        {carouselState.showNavigation && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {config.pages.map((page, index) => (
              <button
                key={page.name}
                onClick={() => controls.goToPage(index)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  index === carouselState.currentPageIndex
                    ? 'bg-white text-purple-600 font-semibold'
                    : 'bg-white/20 text-white/90 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {page.validated && <CheckCircle className="w-4 h-4" />}
                  <span>{page.name.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Page Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            carouselState.isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {CurrentComponent ? (
            <Suspense fallback={<PageLoadingFallback pageName={currentPage.name} />}>
              <CurrentComponent />
            </Suspense>
          ) : (
            <PageNotFoundFallback pageName={currentPage?.name || 'Unknown'} />
          )}
        </div>

        {/* Navigation Arrows */}
        {carouselState.showNavigation && carouselState.totalPages > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={carouselState.isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={goToNext}
              disabled={carouselState.isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      {carouselState.showNavigation && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            {/* Page Dots */}
            <div className="flex items-center gap-2">
              {config.pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => controls.goToPage(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === carouselState.currentPageIndex
                      ? 'bg-purple-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Current Page Info */}
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{currentPage?.name.replace(/[_-]/g, ' ')}</span>
              {currentPage?.validated && (
                <span className="ml-2 text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Validated
                </span>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={goToPrevious}
                disabled={carouselState.isTransitioning}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={goToNext}
                disabled={carouselState.isTransitioning}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading fallback component
 */
function PageLoadingFallback({ pageName }: { pageName: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading {pageName}</h3>
        <p className="text-gray-500">Please wait while we load the page...</p>
      </div>
    </div>
  );
}

/**
 * Page not found fallback component
 */
function PageNotFoundFallback({ pageName }: { pageName: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Page Not Found</h3>
        <p className="text-gray-500 mb-4">Could not load: {pageName}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
