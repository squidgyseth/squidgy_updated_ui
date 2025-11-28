import React from 'react';
import type { N8nResponse } from '../../types/n8n.types';
import HTMLPreview from './HTMLPreview';
import SocialMediaLink from './SocialMediaLink';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';

interface AgentResponseHandlerProps {
  response: N8nResponse;
  className?: string;
}

/**
 * Handles different agent response types based on agent_status
 * - Ready: Shows HTML preview for generated content
 * - Waiting: Shows agent's question as a regular message
 * - Nothing: Shows idle state
 */
export default function AgentResponseHandler({ 
  response, 
  className = ''
}: AgentResponseHandlerProps) {
  
  // Check if response is social media content
  const isSocialMediaContent = () => {
    try {
      const parsed = JSON.parse(response.agent_response);
      // Check for ContentRepurposerPosts structure
      if (Array.isArray(parsed) && parsed[0] && parsed[0].ContentRepurposerPosts) {
        return true;
      }
      if (parsed && parsed.ContentRepurposerPosts) {
        return true;
      }
      // Also check for direct social media keys
      if (parsed && (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle different agent statuses
  switch (response.agent_status) {
    case 'Ready':
      // Check if it's social media content
      if (isSocialMediaContent()) {
        return (
          <div className={`agent-response ready-state ${className}`}>
            <SocialMediaLink content={response.agent_response} />
          </div>
        );
      }
      // For other Ready status, agent_response contains HTML to preview
      return (
        <div className={`agent-response ready-state ${className}`}>
          <HTMLPreview content={response.agent_response} />
        </div>
      );
      
    case 'Waiting':
      // For Waiting status, display the question as a normal message
      // The user will respond using the regular chat input
      return (
        <div className={`agent-response waiting-state ${className}`}>
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <LinkDetectingTextArea 
              content={response.agent_response}
              className="text-text-primary whitespace-pre-wrap"
            />
          </div>
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
            <LinkDetectingTextArea 
              content={response.agent_response}
              className="text-gray-700"
            />
          </div>
        </div>
      );
  }
}