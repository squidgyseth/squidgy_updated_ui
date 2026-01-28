import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Trash2, RefreshCw, FileText } from 'lucide-react';
import { ChatHistoryService, ChatSession } from '../../services/chatHistoryService';
import { FileUploadService } from '../../services/fileUploadService';

interface ChatHistoryProps {
  userId: string;
  agentId: string;
  agentName: string;
  onSessionSelect?: (sessionId: string) => void;
  className?: string;
}

/**
 * Chat History Component
 * Shows previous chat sessions for a specific agent
 */
export default function ChatHistory({
  userId,
  agentId,
  agentName,
  onSessionSelect,
  className = ''
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatHistoryService = ChatHistoryService.getInstance();
  const fileUploadService = FileUploadService.getInstance();

  // Utility function to detect if message contains file URL
  const parseFileInfo = (message: string) => {
    const fileUrlMatch = message.match(/URL:\s*(https?:\/\/[^\s]+)/);
    const fileNameMatch = message.match(/File:\s*([^\n]+)/);
    
    if (fileUrlMatch && fileNameMatch) {
      return {
        hasFile: true,
        fileName: fileNameMatch[1].trim(),
        fileUrl: fileUrlMatch[1].trim(),
        messageText: message.split('\n\nFile:')[0] // Get the text before file info
      };
    }
    
    return {
      hasFile: false,
      messageText: message
    };
  };

  useEffect(() => {
    loadSessions();
  }, [userId, agentId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionData = await chatHistoryService.getUserAgentSessions(userId, agentId, 10);
      setSessions(sessionData);
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        const success = await chatHistoryService.deleteSession(sessionId);
        if (success) {
          setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        } else {
          alert('Failed to delete conversation');
        }
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete conversation');
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-600">Loading chat history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-red-500 text-sm">{error}</div>
        <button
          onClick={loadSessions}
          className="mt-2 text-blue-500 text-sm hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No previous conversations</p>
          <p className="text-xs text-gray-400 mt-1">Start chatting to see your history here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Previous {agentName} Chats</h3>
        <button
          onClick={loadSessions}
          className="p-1 text-gray-500 hover:text-gray-700 rounded"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sessions List */}
      <div className="max-h-96 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            onClick={() => onSessionSelect?.(session.session_id)}
            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(session.last_timestamp)}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {(() => {
                    const fileInfo = parseFileInfo(session.last_message);
                    if (fileInfo.hasFile) {
                      return (
                        <div className="flex items-center gap-2">
                          {fileUploadService.getFileTypeIcon(fileInfo.fileName)}
                          <span className="truncate">{truncateMessage(fileInfo.messageText)}</span>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            File
                          </span>
                        </div>
                      );
                    }
                    return <p className="truncate">{truncateMessage(fileInfo.messageText)}</p>;
                  })()}
                </div>
              </div>
              
              <button
                onClick={(e) => handleDeleteSession(session.session_id, e)}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {sessions.length >= 10 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <span className="text-xs text-gray-500">
            Showing last 10 conversations
          </span>
        </div>
      )}
    </div>
  );
}
