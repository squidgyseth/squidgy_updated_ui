import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ChatInterface } from './ChatInterface';

interface DynamicAgentPageProps {
  agentId: string;
  agentName: string;
  pageType?: string;
  componentPath?: string;
}

export default function DynamicAgentPage({ 
  agentId, 
  agentName, 
  pageType, 
  componentPath 
}: DynamicAgentPageProps) {
  const [DynamicComponent, setDynamicComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (pageType === 'figma' && componentPath) {
      // Dynamically import the generated component
      const loadComponent = async () => {
        try {
          // Extract just the filename from the path
          const fileName = componentPath.split('/').pop()?.replace('.tsx', '');
          if (fileName) {
            const module = await import(`../pages/agents/${fileName}`);
            setDynamicComponent(() => module.default);
          }
        } catch (error) {
          console.error('Failed to load dynamic component:', error);
          // Fall back to standard chat interface
          setDynamicComponent(null);
        }
      };
      loadComponent();
    }
  }, [pageType, componentPath]);

  // Loading state
  const LoadingComponent = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  // If we have a Figma-generated component, use it
  if (DynamicComponent) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <DynamicComponent />
      </Suspense>
    );
  }

  // Otherwise, use the standard chat interface
  return (
    <ChatInterface
      agentName={agentName}
      agentDescription={`AI Assistant - ${agentId}`}
      context={agentId}
    />
  );
}