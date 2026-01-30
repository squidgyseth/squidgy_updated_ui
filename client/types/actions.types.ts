/**
 * Action Types and Metadata Structures
 *
 * This file documents all supported action types in actions_todo
 * and their expected metadata structures.
 */

/**
 * Base action structure
 */
export interface BaseAction {
  action: string;
  details?: string;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

/**
 * USER_ROUTED - Redirect user to another agent's chat
 *
 * When to use: Agent determines user should be redirected to a different agent
 *
 * Example:
 * {
 *   action: 'user_routed',
 *   details: 'Redirect user to Social Media Manager',
 *   metadata: {
 *     target_agent: 'social_media_agent',
 *     target_url: '/chat/social_media_agent',
 *     user_intent: 'start_chat'
 *   }
 * }
 */
export interface UserRoutedAction extends BaseAction {
  action: 'user_routed';
  metadata: {
    target_agent: string;      // Agent ID (e.g., 'social_media_agent')
    target_url: string;         // URL to navigate to (e.g., '/chat/social_media_agent')
    user_intent?: string;       // Original user intent (e.g., 'start_chat', 'create_newsletter')
  };
}

/**
 * AGENT_ENABLED - Notify UI that a new agent was enabled
 *
 * When to use: Personal Assistant enables a new agent during onboarding
 *
 * Example:
 * {
 *   action: 'agent_enabled',
 *   details: 'Social Media Manager enabled',
 *   metadata: {
 *     agent_id: 'social_media_agent',
 *     agent_name: 'Social Media Manager',
 *     communication_tone: 'professional',
 *     target_audience: 'b2b',
 *     primary_goals: ['Lead generation']
 *   }
 * }
 */
export interface AgentEnabledAction extends BaseAction {
  action: 'agent_enabled';
  metadata: {
    agent_id: string;              // Agent ID
    agent_name: string;            // Human-readable agent name
    communication_tone?: string;   // Brand voice preference
    target_audience?: string;      // Target audience
    primary_goals?: string[];      // User's goals
    reused_settings?: boolean;     // Whether settings were reused from another agent
    [key: string]: any;            // Additional agent-specific settings
  };
}

/**
 * SHOW_PREVIEW - Display a preview (image, PDF, etc.)
 *
 * When to use: Agent generated content that should be previewed
 *
 * Example:
 * {
 *   action: 'show_preview',
 *   details: 'Show rendered template preview',
 *   metadata: {
 *     preview_url: 'https://...',
 *     preview_type: 'image',
 *     template_id: 'template-123'
 *   }
 * }
 */
export interface ShowPreviewAction extends BaseAction {
  action: 'show_preview';
  metadata: {
    preview_url: string;           // URL of the preview
    preview_type?: 'image' | 'pdf' | 'video' | 'html';
    template_id?: string;          // Template ID if applicable
    [key: string]: any;
  };
}

/**
 * AWAITING_SELECTION - Waiting for user input
 *
 * When to use: Agent is waiting for user to make a selection
 *
 * Example:
 * {
 *   action: 'awaiting_selection',
 *   details: 'User needs to select brand voice',
 *   priority: 'high'
 * }
 */
export interface AwaitingSelectionAction extends BaseAction {
  action: 'awaiting_selection';
  priority?: 'high' | 'medium' | 'low';
}

/**
 * REFRESH_AGENT_LIST - Trigger agent list refresh in sidebar
 *
 * When to use: After enabling/disabling agents
 *
 * Example:
 * {
 *   action: 'refresh_agent_list',
 *   details: 'Refresh sidebar after enabling new agent'
 * }
 */
export interface RefreshAgentListAction extends BaseAction {
  action: 'refresh_agent_list';
}

/**
 * Union type of all supported actions
 */
export type ActionTodo =
  | UserRoutedAction
  | AgentEnabledAction
  | ShowPreviewAction
  | AwaitingSelectionAction
  | RefreshAgentListAction
  | BaseAction; // Fallback for unknown actions

/**
 * Type guard to check if action is user_routed
 */
export function isUserRoutedAction(action: BaseAction): action is UserRoutedAction {
  return action.action === 'user_routed' && !!action.metadata?.target_url;
}

/**
 * Type guard to check if action is agent_enabled
 */
export function isAgentEnabledAction(action: BaseAction): action is AgentEnabledAction {
  return action.action === 'agent_enabled' && !!action.metadata?.agent_id;
}

/**
 * Type guard to check if action is show_preview
 */
export function isShowPreviewAction(action: BaseAction): action is ShowPreviewAction {
  return action.action === 'show_preview' && !!action.metadata?.preview_url;
}
