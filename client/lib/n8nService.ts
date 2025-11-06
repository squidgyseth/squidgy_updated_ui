// src/lib/n8nService.ts
/**
 * Service for communicating with n8n workflows
 */

import type { N8nRequest, N8nResponse } from '../types/n8n.types';

// Base URL for n8n webhook
const N8N_WEBHOOK_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

/**
 * Send message to Seth agent specifically
 * @param userId - The user ID
 * @param userMessage - The user message
 * @param sessionId - Optional session ID
 */
export const sendToSethAgent = async (
  userId: string,
  userMessage: string,
  sessionId?: string
) => {
  return sendToN8nWorkflow(userId, userMessage, 'PersonalAssistant', sessionId);
};

/**
 * Legacy function for backward compatibility
 * @param response - The response message
 * @param agentType - The type of agent (e.g., 'Seth')
 * @param sessionId - The current session/conversation ID
 */
export const processAgentResponse = async (
  response: string,
  agentType: string, 
  sessionId: string
) => {
  // This function is kept for backward compatibility
  // In the new format, we don't need to process agent responses separately
  console.log('processAgentResponse called (legacy):', { response, agentType, sessionId });
  return null;
};

/**
 * Generate a unique request ID
 */
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

/**
 * Generate a session ID in the format: userId_agentName_timestamp
 */
const generateSessionId = (userId: string, agentName: string): string => {
  return `${userId}_${agentName}_${Date.now()}`;
};

/**
 * Send a message to n8n workflow with proper typing
 * @param userId - The user ID
 * @param userMessage - The user message content
 * @param agentName - The agent name from YAML (e.g., 'newsletter', 'personal_assistant')
 * @param sessionId - Optional session ID, will be generated if not provided
 * @param requestId - Optional request ID, will be generated if not provided
 * @param webhookUrl - Optional webhook URL from agent config, defaults to env variable
 * @param newsletterId - Optional newsletter ID for content_repurposer agent
 * @returns Promise<N8nResponse | null>
 */
export const sendToN8nWorkflow = async (
  userId: string,
  userMessage: string,
  agentName: string,
  sessionId?: string,
  requestId?: string,
  webhookUrl?: string,
  newsletterId?: string
): Promise<N8nResponse | null> => {
  // Use the provided webhook URL or fall back to the environment variable for Personal Assistant
  const n8nWebhookUrl = webhookUrl || N8N_WEBHOOK_BASE;
  
  if (!n8nWebhookUrl || n8nWebhookUrl === 'https://your-n8n-webhook-url') {
    console.warn('N8N webhook URL not configured, using development simulation');
    
    // Development mode simulation
    return new Promise((resolve) => {
      setTimeout(() => {
        const simulatedResponses: Record<string, { response: string; status: 'Ready' | 'Waiting' | 'Nothing' }> = {
          newsletter: {
            response: userMessage.toLowerCase().includes('create') 
              ? '<h2>Newsletter Template</h2><p>Your newsletter content would appear here...</p>'
              : 'What type of newsletter would you like to create?',
            status: userMessage.toLowerCase().includes('create') ? 'Ready' : 'Waiting'
          },
          personal_assistant: {
            response: "I'm your personal assistant. How can I help you today?",
            status: 'Waiting'
          },
          smm_assistant: {
            response: "Ready to help with your social media marketing!",
            status: 'Waiting'
          }
        };
        
        const agentSimulation = simulatedResponses[agentName] || {
          response: `Hello from ${agentName}!`,
          status: 'Waiting' as const
        };
        
        const response: N8nResponse = {
          user_id: userId,
          session_id: sessionId || generateSessionId(userId, agentName),
          agent_name: agentName,
          timestamp_of_call_made: new Date().toISOString(),
          request_id: requestId || generateRequestId(),
          agent_response: agentSimulation.response,
          agent_status: agentSimulation.status
        };
        
        resolve(response);
      }, 1000 + Math.random() * 2000); // 1-3 second delay to simulate real response
    });
  }
  
  // Generate IDs if not provided
  const finalSessionId = sessionId || generateSessionId(userId, agentName);
  const finalRequestId = requestId || generateRequestId();
  
  // Create the exact payload structure
  const payload: N8nRequest = {
    user_id: userId,
    user_mssg: userMessage,
    session_id: finalSessionId,
    agent_name: agentName,
    timestamp_of_call_made: new Date().toISOString(),
    request_id: finalRequestId,
    ...(newsletterId && { newsletter_id: newsletterId }) // Include newsletter_id only if provided
  };
  
  try {
    console.log(`Sending to n8n webhook for ${agentName}:`, n8nWebhookUrl);
    const result = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!result.ok) {
      throw new Error(`HTTP error! Status: ${result.status}`);
    }
    
    const responseText = await result.text();
    
    if (!responseText || !responseText.trim()) {
      return null;
    }
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Return plain text response if not JSON
      return { response: responseText };
    }
  } catch (error) {
    console.error('Error sending to n8n workflow:', error);
    return null;
  }
};

// Export individual functions
export { generateRequestId, generateSessionId };

const n8nService = {
  sendToN8nWorkflow,
  sendToSethAgent,
  processAgentResponse,
  generateRequestId,
  generateSessionId
};

export default n8nService;
