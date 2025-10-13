import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AgentConfigService } from '../services/agentConfigService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AgentSettingsPage {
  name: string;
  path: string;
  order: number;
  generatedComponent?: string;
}

export default function AgentSettings() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [pages, setPages] = useState<AgentSettingsPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgentConfig = async () => {
      if (!agentId) {
        setError('No agent ID provided');
        setLoading(false);
        return;
      }

      try {
        const configService = AgentConfigService.getInstance();
        const config = await configService.loadAgentConfig(agentId);
        
        if (config) {
          setAgentConfig(config);
          
          // Extract pages from ui_use section
          const uiUsePages = config.ui_use?.pages || [];
          const sortedPages = uiUsePages.sort((a: AgentSettingsPage, b: AgentSettingsPage) => a.order - b.order);
          setPages(sortedPages);
          
          console.log('Agent Settings - Loaded pages:', sortedPages);
        } else {
          setError(`Failed to load configuration for agent: ${agentId}`);
        }
      } catch (error) {
        console.error('Error loading agent config:', error);
        setError(`Error loading agent configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadAgentConfig();
  }, [agentId]);

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePageClick = (index: number) => {
    setCurrentPageIndex(index);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Configuration Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Configuration Pages</h2>
          <p className="text-gray-500">This agent doesn't have any configuration pages available.</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={agentConfig?.agent?.avatar || "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64"} 
              alt={agentConfig?.agent?.name || 'Agent'} 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {agentConfig?.agent?.name} Settings
              </h1>
              <p className="text-sm text-gray-600">
                {agentConfig?.agent?.tagline || agentConfig?.agent?.description}
              </p>
            </div>
          </div>
          
          {/* Page Navigation */}
          {pages.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPageIndex === 0}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex gap-1">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageClick(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentPageIndex 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === pages.length - 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              
              <span className="ml-2 text-sm text-gray-600">
                {currentPageIndex + 1} of {pages.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          <div className="bg-white rounded-lg border border-gray-200 h-full shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">{currentPage.name}</h2>
              <p className="text-sm text-gray-600 mt-1">Configuration page {currentPageIndex + 1} of {pages.length}</p>
            </div>
            
            <div className="p-6 h-full overflow-auto">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Configuration Interface</h3>
                <p className="text-gray-600 mb-4">
                  This is where the dynamic configuration interface for "{currentPage.name}" would be displayed.
                </p>
                <div className="text-left bg-white p-4 rounded border text-sm text-gray-700">
                  <strong>Page Details:</strong><br />
                  <span className="text-gray-600">Name:</span> {currentPage.name}<br />
                  <span className="text-gray-600">Path:</span> {currentPage.path}<br />
                  <span className="text-gray-600">Order:</span> {currentPage.order}<br />
                  {currentPage.generatedComponent && (
                    <>
                      <span className="text-gray-600">Component:</span> {currentPage.generatedComponent.split('/').pop()}<br />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}