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
 * @param conversationState - Optional conversation state for multi-turn agents (newsletter_multi)
 * @returns Promise<N8nResponse | null>
 */
export const sendToN8nWorkflow = async (
  userId: string,
  userMessage: string,
  agentName: string,
  sessionId?: string,
  requestId?: string,
  webhookUrl?: string,
  newsletterId?: string,
  conversationState?: Record<string, unknown>
): Promise<N8nResponse | null> => {
  // Use the provided webhook URL or fall back to the environment variable for Personal Assistant
  const n8nWebhookUrl = webhookUrl || N8N_WEBHOOK_BASE;
  
  if (!n8nWebhookUrl || n8nWebhookUrl === 'https://your-n8n-webhook-url') {
    
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
    ...(newsletterId && { newsletter_id: newsletterId }), // Include newsletter_id only if provided
    ...(conversationState && { state: conversationState }) // Include state for multi-turn conversations
  };
  
  try {
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
    
    console.log('🔍 n8nService: Raw response text (first 500 chars):', responseText.substring(0, 500));
    
    if (!responseText || !responseText.trim()) {
      console.log('🔍 n8nService: Empty response received');
      return null;
    }
    
    try {
      // Check if response is NDJSON (Newline Delimited JSON) - multiple JSON objects per line
      // This is common with n8n streaming responses
      const lines = responseText.trim().split('\n');
      
      if (lines.length > 1) {
        console.log('🔍 n8nService: Detected NDJSON format with', lines.length, 'lines');
        
        // Parse all lines and collect content
        let collectedContent = '';
        let finalResponse: N8nResponse | null = null;
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line.trim());
            
            // Handle streaming format: {"type":"item","content":"..."} contains the actual content
            if (parsed.type === 'item' && parsed.content !== undefined) {
              collectedContent += parsed.content;
            }
            
            // If this looks like a complete N8nResponse (has agent_response), use it
            if (parsed.agent_response !== undefined) {
              finalResponse = parsed;
            }
          } catch {
            // Skip lines that aren't valid JSON
            continue;
          }
        }
        
        // If we collected streaming content, build a response from it
        if (collectedContent) {
          console.log('✅ n8nService: Collected streaming content:', collectedContent.substring(0, 200));
          
          // The collected content may contain mixed text and JSON objects
          // Find all JSON objects with agent_response and use the last one
          const jsonMatches: N8nResponse[] = [];
          
          // Find all JSON objects in the content using regex to locate { ... } blocks
          const jsonRegex = /\{[^{}]*"agent_response"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
          let match;
          
          // Also try to find complete JSON objects by scanning for balanced braces
          let braceDepth = 0;
          let jsonStart = -1;
          
          for (let i = 0; i < collectedContent.length; i++) {
            const char = collectedContent[i];
            if (char === '{') {
              if (braceDepth === 0) jsonStart = i;
              braceDepth++;
            } else if (char === '}') {
              braceDepth--;
              if (braceDepth === 0 && jsonStart !== -1) {
                const jsonCandidate = collectedContent.substring(jsonStart, i + 1);
                try {
                  const parsed = JSON.parse(jsonCandidate);
                  if (parsed.agent_response !== undefined) {
                    jsonMatches.push(parsed);
                    console.log('✅ n8nService: Found JSON with agent_response:', parsed.agent_response.substring(0, 100));
                  }
                } catch {
                  // Not valid JSON, skip
                }
                jsonStart = -1;
              }
            }
          }
          
          // Use the last valid JSON object with agent_response
          if (jsonMatches.length > 0) {
            const lastMatch = jsonMatches[jsonMatches.length - 1];
            console.log('✅ n8nService: Using last JSON match with agent_response');
            return {
              agent_response: lastMatch.agent_response,
              agent_status: lastMatch.agent_status || 'Ready',
              user_id: lastMatch.user_id || '',
              session_id: lastMatch.session_id || '',
              agent_name: lastMatch.agent_name || '',
              timestamp_of_call_made: lastMatch.timestamp_of_call_made || new Date().toISOString(),
              request_id: lastMatch.request_id || '',
              actions_performed: lastMatch.actions_performed,
              actions_todo: lastMatch.actions_todo,
              routing: lastMatch.routing,
              state: lastMatch.state,
              execution_id: lastMatch.execution_id,
              workflow_id: lastMatch.workflow_id
            } as N8nResponse;
          }
          
          // Try to parse the whole content as JSON (fallback)
          try {
            const contentParsed = JSON.parse(collectedContent);
            if (contentParsed.agent_response !== undefined) {
              return {
                agent_response: contentParsed.agent_response,
                agent_status: contentParsed.agent_status || 'Ready',
                user_id: contentParsed.user_id || '',
                session_id: contentParsed.session_id || '',
                agent_name: contentParsed.agent_name || '',
                timestamp_of_call_made: contentParsed.timestamp_of_call_made || new Date().toISOString(),
                request_id: contentParsed.request_id || '',
                actions_performed: contentParsed.actions_performed,
                actions_todo: contentParsed.actions_todo,
                routing: contentParsed.routing,
                state: contentParsed.state,
                execution_id: contentParsed.execution_id,
                workflow_id: contentParsed.workflow_id
              } as N8nResponse;
            }
          } catch {
            // Content is not valid JSON
          }
          
          // Last resort: return collected content as agent_response (plain text case)
          // But first, try to clean it up by removing any JSON blocks
          let cleanedContent = collectedContent
            .replace(/```json[\s\S]*?```/g, '') // Remove markdown JSON blocks
            .replace(/\{[\s\S]*?"agent_response"[\s\S]*?\}/g, '') // Remove JSON objects
            .trim();
          
          // If cleaned content is empty, use original
          if (!cleanedContent) {
            cleanedContent = collectedContent;
          }
          
          return {
            agent_response: cleanedContent,
            agent_status: 'Ready',
            user_id: '',
            session_id: '',
            agent_name: '',
            timestamp_of_call_made: new Date().toISOString(),
            request_id: ''
          } as N8nResponse;
        }
        
        // If we found a complete response object, return it
        if (finalResponse) {
          return finalResponse;
        }
      }
      
      // Single JSON object - parse normally
      let jsonToParse = responseText.trim();
      
      // Try to extract valid JSON if there's extra content after it
      const firstBrace = jsonToParse.indexOf('{');
      const firstBracket = jsonToParse.indexOf('[');
      const startIndex = firstBrace === -1 ? firstBracket : 
                         firstBracket === -1 ? firstBrace : 
                         Math.min(firstBrace, firstBracket);
      
      if (startIndex > 0) {
        jsonToParse = jsonToParse.substring(startIndex);
      }
      
      // Find matching closing bracket/brace
      if (jsonToParse.startsWith('[') || jsonToParse.startsWith('{')) {
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let endIndex = -1;
        
        for (let i = 0; i < jsonToParse.length; i++) {
          const char = jsonToParse[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\' && inString) {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{' || char === '[') depth++;
            if (char === '}' || char === ']') {
              depth--;
              if (depth === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
        }
        
        if (endIndex > 0) {
          jsonToParse = jsonToParse.substring(0, endIndex);
        }
      }
      
      console.log('🔍 n8nService: JSON to parse (first 300 chars):', jsonToParse.substring(0, 300));
      const parsedResponse = JSON.parse(jsonToParse);
      console.log('✅ n8nService: Parsed response:', parsedResponse);

      // N8N often returns responses wrapped in an array - unwrap if needed
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        const unwrapped = parsedResponse[0];
        console.log('✅ n8nService: Unwrapped from array:', unwrapped);
        return unwrapped;
      }

      return parsedResponse;
    } catch (parseError) {
      console.error('❌ n8nService: JSON parse error:', parseError);
      console.error('❌ n8nService: Failed response text:', responseText.substring(0, 500));
      // Return plain text response if not JSON - cast as partial N8nResponse
      return { 
        response: responseText, 
        agent_response: responseText,
        agent_status: 'Ready',
        user_id: '',
        session_id: '',
        agent_name: '',
        timestamp_of_call_made: new Date().toISOString(),
        request_id: ''
      } as N8nResponse;
    }
  } catch (error) {
    console.error('Error sending to n8n workflow:', error);
    return null;
  }
};

/**
 * Streaming version of sendToN8nWorkflow that provides real-time updates
 * @param onStreamUpdate - Callback function called with each streaming text update
 * @returns Promise<N8nResponse | null>
 */
export const sendToN8nWorkflowStreaming = async (
  userId: string,
  userMessage: string,
  agentName: string,
  onStreamUpdate: (text: string) => void,
  sessionId?: string,
  requestId?: string,
  webhookUrl?: string,
  newsletterId?: string,
  conversationState?: Record<string, unknown>
): Promise<N8nResponse | null> => {
  const n8nWebhookUrl = webhookUrl || N8N_WEBHOOK_BASE;
  
  if (!n8nWebhookUrl || n8nWebhookUrl === 'https://your-n8n-webhook-url') {
    // Development mode - no streaming simulation
    return sendToN8nWorkflow(userId, userMessage, agentName, sessionId, requestId, webhookUrl, newsletterId, conversationState);
  }
  
  const finalSessionId = sessionId || generateSessionId(userId, agentName);
  const finalRequestId = requestId || generateRequestId();
  
  const payload: N8nRequest = {
    user_id: userId,
    user_mssg: userMessage,
    session_id: finalSessionId,
    agent_name: agentName,
    timestamp_of_call_made: new Date().toISOString(),
    request_id: finalRequestId,
    ...(newsletterId && { newsletter_id: newsletterId }),
    ...(conversationState && { state: conversationState })
  };
  
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      // Fallback to non-streaming
      return sendToN8nWorkflow(userId, userMessage, agentName, sessionId, requestId, webhookUrl, newsletterId, conversationState);
    }
    
    const decoder = new TextDecoder();
    let fullText = '';
    let streamingText = '';
    const jsonMatches: N8nResponse[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      
      // Parse each line for streaming content (JSONL format)
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          
          // Handle n8n streaming chunk types: message, item, begin, end
          if ((parsed.type === 'message' || parsed.type === 'item') && parsed.content !== undefined) {
            // Accumulate streaming text token by token
            streamingText += parsed.content;
            // Send accumulated text to UI (filter out JSON-looking content)
            if (!parsed.content.trim().startsWith('{') && !parsed.content.trim().startsWith('```')) {
              onStreamUpdate(streamingText);
            }
          }
          
          // Check for complete response (final JSON with agent_response)
          if (parsed.agent_response !== undefined) {
            jsonMatches.push(parsed);
          }
        } catch {
          // Not valid JSON, skip (could be partial chunk)
        }
      }
    }
    
    // Process the full response to extract the final agent_response
    // Use the same logic as the non-streaming version
    if (jsonMatches.length > 0) {
      const lastMatch = jsonMatches[jsonMatches.length - 1];
      return {
        agent_response: lastMatch.agent_response,
        agent_status: lastMatch.agent_status || 'Ready',
        user_id: lastMatch.user_id || userId,
        session_id: lastMatch.session_id || finalSessionId,
        agent_name: lastMatch.agent_name || agentName,
        timestamp_of_call_made: lastMatch.timestamp_of_call_made || new Date().toISOString(),
        request_id: lastMatch.request_id || finalRequestId,
        actions_performed: lastMatch.actions_performed,
        actions_todo: lastMatch.actions_todo,
        routing: lastMatch.routing,
        state: lastMatch.state,
        execution_id: lastMatch.execution_id,
        workflow_id: lastMatch.workflow_id
      } as N8nResponse;
    }
    
    // Fallback: try to find JSON in the streaming text
    let braceDepth = 0;
    let jsonStart = -1;
    
    for (let i = 0; i < streamingText.length; i++) {
      const char = streamingText[i];
      if (char === '{') {
        if (braceDepth === 0) jsonStart = i;
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && jsonStart !== -1) {
          const jsonCandidate = streamingText.substring(jsonStart, i + 1);
          try {
            const parsed = JSON.parse(jsonCandidate);
            if (parsed.agent_response !== undefined) {
              return {
                agent_response: parsed.agent_response,
                agent_status: parsed.agent_status || 'Ready',
                user_id: parsed.user_id || userId,
                session_id: parsed.session_id || finalSessionId,
                agent_name: parsed.agent_name || agentName,
                timestamp_of_call_made: parsed.timestamp_of_call_made || new Date().toISOString(),
                request_id: parsed.request_id || finalRequestId,
                actions_performed: parsed.actions_performed,
                actions_todo: parsed.actions_todo,
                routing: parsed.routing,
                state: parsed.state,
                execution_id: parsed.execution_id,
                workflow_id: parsed.workflow_id
              } as N8nResponse;
            }
          } catch {
            // Not valid JSON
          }
          jsonStart = -1;
        }
      }
    }
    
    // Last resort: return streaming text as response
    return {
      agent_response: streamingText,
      agent_status: 'Ready',
      user_id: userId,
      session_id: finalSessionId,
      agent_name: agentName,
      timestamp_of_call_made: new Date().toISOString(),
      request_id: finalRequestId
    } as N8nResponse;
    
  } catch (error) {
    console.error('Error in streaming n8n workflow:', error);
    return null;
  }
};

// Export individual functions
export { generateRequestId, generateSessionId };

const n8nService = {
  sendToN8nWorkflow,
  sendToN8nWorkflowStreaming,
  sendToSethAgent,
  processAgentResponse,
  generateRequestId,
  generateSessionId
};

export default n8nService;
