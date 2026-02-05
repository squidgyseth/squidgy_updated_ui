import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Users, Bot } from 'lucide-react';
import GroupChatService, { type GroupChat, type GroupChatMessage } from '../../services/groupChatService';
import OptimizedAgentService from '../../services/optimizedAgentService';
import { supabase } from '../../lib/supabase';
import { sendToN8nWorkflow, generateRequestId } from '../../lib/n8nService';
import StreamingChatMessage from './StreamingChatMessage';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';

interface GroupChatInterfaceProps {
  groupId: string;
  groupChat?: GroupChat | null;
  className?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  avatar?: string;
  webhookUrl?: string;
}

interface DisplayMessage extends GroupChatMessage {
  agent?: AgentConfig;
  type?: 'demo_stream' | 'regular';
  isStreaming?: boolean;
}

export default function GroupChatInterface({
  groupId,
  groupChat,
  className = ''
}: GroupChatInterfaceProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [agents, setAgents] = useState<Map<string, AgentConfig>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const groupChatService = GroupChatService.getInstance();
  const agentService = OptimizedAgentService.getInstance();

  useEffect(() => {
    getCurrentUser();
    loadAgents();
  }, []);

  useEffect(() => {
    if (groupId && userId) {
      loadMessages();
    }
  }, [groupId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced auto-scroll for streaming content using ResizeObserver
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const isAnyMessageStreaming = messages.some(m => m.isStreaming);
      if (isAnyMessageStreaming) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    });

    const scrollContent = scrollAreaRef.current.firstElementChild;
    if (scrollContent) {
      resizeObserver.observe(scrollContent);
    }

    return () => resizeObserver.disconnect();
  }, [messages]);

  const handleStreamComplete = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isStreaming: false } : msg
    ));
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadAgents = () => {
    const agentConfigs = agentService.getAllAgents();
    const agentMap = new Map<string, AgentConfig>();

    agentConfigs.forEach(config => {
      // Cast to any to access potentially missing properties in the type definition but present at runtime
      const agentData = config.agent as any;
      agentMap.set(agentData.id, {
        id: agentData.id,
        name: agentData.name,
        avatar: agentData.avatar,
        webhookUrl: agentData.webhookUrl
      });
    });

    setAgents(agentMap);
  };

  const loadMessages = async () => {
    const groupMessages = await groupChatService.getGroupMessages(groupId);

    // Enhance messages with agent info
    const enhancedMessages: DisplayMessage[] = groupMessages.map(msg => ({
      ...msg,
      agent: msg.sender_type === 'assistant' ? agents.get(msg.sender_id) : undefined
    }));

    // Add demo message ONLY with ?demo=1 flag
    const isDemoMode = new URLSearchParams(window.location.search).has('demo');
    if (isDemoMode) {
      const demoMessage: DisplayMessage = {
        id: 'demo-streaming-msg',
        group_id: groupId,
        user_id: userId,
        content: '',
        sender_type: 'assistant',
        sender_id: 'assistant',
        created_at: new Date().toISOString(),
        type: 'demo_stream'
      };
      setMessages([demoMessage, ...enhancedMessages]);
    } else {
      setMessages(enhancedMessages);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !userId || !groupChat) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Save user message
      const savedMessage = await groupChatService.saveGroupMessage(
        groupId,
        userId,
        'user',
        userId,
        userMessage
      );

      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
      }

      // Send message to each agent in the group
      const agentResponses = await Promise.allSettled(
        groupChat.participants.map(async (agentId) => {
          const agent = agents.get(agentId);
          if (!agent?.webhookUrl) {
            return;
          }

          try {
            const requestId = generateRequestId();
            // Fixed call to sendToN8nWorkflow (positional arguments)
            const response: any = await sendToN8nWorkflow(
              userId,
              userMessage,
              agent.name,
              groupId,
              requestId,
              agent.webhookUrl
            );

            if (response?.agent_response || response?.message) {
              const content = response.agent_response || response.message;
              // Save agent response
              const agentMessage = await groupChatService.saveGroupMessage(
                groupId,
                userId,
                'assistant',
                agentId,
                content
              );

              if (agentMessage) {
                setMessages(prev => [...prev, {
                  ...agentMessage,
                  agent,
                  isStreaming: true
                }]);
              }
            }
          } catch (error) {
            console.error(`Error sending to agent ${agentId}:`, error);

            // Save error message
            const errorMessage = await groupChatService.saveGroupMessage(
              groupId,
              userId,
              'assistant',
              agentId,
              `Sorry, I'm having trouble responding right now. Please try again later.`
            );

            if (errorMessage) {
              setMessages(prev => [...prev, {
                ...errorMessage,
                agent
              }]);
            }
          }
        })
      );


    } catch (error) {
      console.error('Error in group chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full bg-squidgy-primary/10 mb-4">
                <Users className="h-8 w-8 text-squidgy-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to {groupChat?.name || 'Group Chat'}
              </h3>
              <p className="text-gray-500 mb-4">
                Start a conversation with {groupChat?.participants?.length || 0} AI assistants
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {groupChat?.participants?.map(agentId => {
                  const agent = agents.get(agentId);
                  return agent ? (
                    <div key={agentId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                      {agent.avatar && (
                        <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-sm text-gray-700">{agent.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id} className="flex gap-4">
                  {message.sender_type === 'user' ? (
                    <>
                      {/* User Message */}
                      <div className="flex-1" />
                      <div className="flex flex-col items-end max-w-[70%]">
                        <div className="bg-squidgy-gradient text-white px-4 py-2 rounded-2xl rounded-br-sm">
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">You</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Assistant Message */}
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {message.agent?.avatar ? (
                          <img
                            src={message.agent.avatar}
                            alt={message.agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-squidgy-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-squidgy-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col max-w-[70%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.agent?.name || 'AI Assistant'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        {message.type === 'demo_stream' ? (
                          <StreamingChatMessage />
                        ) : (
                          <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm">
                            <LinkDetectingTextArea
                              content={message.content}
                              className="text-sm text-gray-900"
                              shouldStream={message.isStreaming}
                              onStreamComplete={() => handleStreamComplete(message.id)}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1" />
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Loader className="h-4 w-4 text-gray-500 animate-spin" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm">
                <p className="text-sm text-gray-500">AI assistants are thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message to the group..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-squidgy-primary focus:border-transparent"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 rounded-xl bg-squidgy-gradient text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
