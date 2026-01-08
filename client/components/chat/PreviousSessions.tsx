import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { chatSessionService, ChatSession } from '../../services/chatSessionService';
import { useUser } from '../../hooks/useUser';

interface PreviousSessionsProps {
  agentId: string;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  className?: string;
}

export default function PreviousSessions({ 
  agentId, 
  currentSessionId,
  onSessionSelect,
  className = '' 
}: PreviousSessionsProps) {
  const { userId } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreviousSessions();
  }, [userId, agentId]);

  const loadPreviousSessions = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const recentSessions = await chatSessionService.getRecentSessions(userId, agentId, 2);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Error loading previous sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    console.log(`🖱️ PreviousSessions: Session clicked: ${sessionId}`);
    onSessionSelect(sessionId);
  };

  if (loading) {
    return (
      <div className={`previous-sessions-loading ${className}`}>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous Sessions</h3>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`previous-sessions-empty ${className}`}>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous Sessions</h3>
          <div className="text-center text-gray-500 text-sm py-6">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No previous conversations</p>
            <p className="text-xs mt-1">Start chatting to see your history here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`previous-sessions-container ${className}`}>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous Sessions</h3>
        
        <div className="space-y-2">
          {sessions.map((session, index) => {
            // Format date as "Jan 2nd 2026"
            const formatDate = (timestamp: string): string => {
              const date = new Date(timestamp);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = months[date.getMonth()];
              const day = date.getDate();
              const year = date.getFullYear();
              
              // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
              const getOrdinalSuffix = (n: number) => {
                const s = ["th", "st", "nd", "rd"];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
              };
              
              return `${month} ${getOrdinalSuffix(day)} ${year}`;
            };

            return (
              <button
                key={session.session_id}
                onClick={() => handleSessionClick(session.session_id)}
                className={`w-full p-3 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group ${
                  currentSessionId === session.session_id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg group-hover:bg-purple-200 transition-colors ${
                    currentSessionId === session.session_id
                      ? 'bg-purple-200'
                      : 'bg-purple-100'
                  }`}>
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatDate(session.last_message_timestamp)} Session {index + 1}
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {(() => {
                        // Clean HTML tags and get readable text
                        const cleanPreview = (text: string): string => {
                          // Remove HTML tags
                          const withoutTags = text.replace(/<[^>]*>/g, ' ');
                          // Remove extra whitespace and normalize
                          const normalized = withoutTags.replace(/\s+/g, ' ').trim();
                          // Take first 80 characters for preview
                          return normalized.length > 80 ? normalized.substring(0, 80) + '...' : normalized;
                        };
                        
                        const cleanText = cleanPreview(session.last_message_preview);
                        return cleanText || 'No preview available';
                      })()}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}