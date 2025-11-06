/**
 * N8N Workflow Types
 * Defines the structure for all n8n workflow communication
 */

/**
 * Request structure sent to n8n workflows
 */
export interface N8nRequest {
  user_id: string;
  user_mssg: string;
  session_id: string;
  agent_name: string;
  timestamp_of_call_made: string;
  request_id: string;
  newsletter_id?: string; // Optional newsletter ID for content_repurposer agent
}

/**
 * Response structure received from n8n workflows
 */
export interface N8nResponse {
  user_id: string;
  session_id: string;
  agent_name: string;
  timestamp_of_call_made: string;
  request_id: string;
  agent_response: string; // Can be plain text or HTML
  agent_status: 'Ready' | 'Waiting' | 'Nothing';
}

/**
 * Agent status types
 */
export type AgentStatus = 'Ready' | 'Waiting' | 'Nothing';

/**
 * File upload information for chat messages
 */
export interface FileUploadInfo {
  fileName: string;
  fileUrl: string;
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  agentId: string;
  agentName: string;
  extractedText?: string;
  errorMessage?: string;
}

/**
 * Message types for chat interface
 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: AgentStatus;
  isHtml?: boolean;
  fileUpload?: FileUploadInfo;
}