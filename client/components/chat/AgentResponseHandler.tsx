import React from 'react';
import type { N8nResponse } from '../../types/n8n.types';
import HTMLPreview from './HTMLPreview';
import QuestionPrompt from './QuestionPrompt';

interface AgentResponseHandlerProps {
  response: N8nResponse;
  onAnswerQuestion?: (answer: string) => void;
  className?: string;
}

/**
 * Handles different agent response types based on agent_status
 * - Ready: Shows HTML preview for generated content
 * - Waiting: Shows question prompt for user input
 * - Nothing: Shows idle state
 */
export default function AgentResponseHandler({ 
  response, 
  onAnswerQuestion,
  className = ''
}: AgentResponseHandlerProps) {
  
  // Handle different agent statuses
  switch (response.agent_status) {
    case 'Ready':
      // For Ready status, agent_response contains HTML to preview
      return (
        <div className={`agent-response ready-state ${className}`}>
          <HTMLPreview content={response.agent_response} />
        </div>
      );
      
    case 'Waiting':
      // For Waiting status, agent_response contains a question
      return (
        <div className={`agent-response waiting-state ${className}`}>
          <QuestionPrompt 
            question={response.agent_response}
            onAnswer={onAnswerQuestion}
          />
        </div>
      );
      
    case 'Nothing':
      // For Nothing status, show idle or default state
      return (
        <div className={`agent-response idle-state ${className}`}>
          <div className="text-gray-500 text-sm italic">
            Agent is idle. Send a message to start.
          </div>
        </div>
      );
      
    default:
      // Fallback for any unexpected status
      return (
        <div className={`agent-response default-state ${className}`}>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{response.agent_response}</p>
          </div>
        </div>
      );
  }
}