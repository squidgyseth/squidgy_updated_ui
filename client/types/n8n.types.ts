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
  state?: Record<string, unknown>; // Conversation state for multi-turn agents (newsletter_multi)
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
  // Conversation state for multi-turn agents (newsletter_multi)
  state?: {
    phase: 'topic_selection' | 'gathering' | 'ready';
    selected_topics: string[];
    current_topic_index: number;
    current_question_index: number;
    answers: Record<string, Record<string, string>>;
  };
  // Template preview fields
  preview?: string;
  template_options?: Array<{
    id: string;
    name: string;
    thumbnail: string;
    description?: string;
  }>;
  // Routing fields for Master Agent redirects
  routing?: {
    should_redirect: boolean;
    target_agent: string;
    target_url: string;
    context_to_pass?: Record<string, unknown>;
  };
  // Actions tracking (SOURCE OF TRUTH for tools executed)
  actions_performed?: Array<{
    action: string;
    input?: Record<string, any>;
    result?: 'success' | 'pending' | 'error';
    details?: string;
    metadata?: Record<string, any>;
  }>;
  /**
   * Actions that the UI needs to perform
   * Each action type has different metadata requirements:
   *
   * - user_routed: { target_agent, target_url, user_intent }
   * - agent_enabled: { agent_id, agent_name, communication_tone, ... }
   * - show_preview: { preview_url, preview_type, ... }
   * - awaiting_selection: { ... }
   * - refresh_agent_list: { ... }
   *
   * Metadata structure varies per action type - check action handler for requirements
   */
  actions_todo?: Array<{
    action: string;
    details?: string;
    priority?: string;
    metadata?: Record<string, any>; // Flexible metadata - structure depends on action type
  }>;
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
  type?: 'demo_stream' | 'regular';
  isStreaming?: boolean;
  fileUpload?: FileUploadInfo;
  content_repurposer_history_id?: string; // Database record ID for content repurposer
}
