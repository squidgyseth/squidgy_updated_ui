import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { chatSessionService, ChatSession } from '../../services/chatSessionService';
import { useUser } from '../../hooks/useUser';

interface PreviousSessionsProps {
  agentId: string;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  className?: string;
  hideHeader?: boolean;
}

export default function PreviousSessions({
  agentId,
  currentSessionId,
  onSessionSelect,
  className = '',
  hideHeader = false
}: PreviousSessionsProps) {
  const { userId } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreviousSessions();
  }, [userId, agentId, currentSessionId]); // Reload when current session changes

  const loadPreviousSessions = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch 3 sessions to ensure we have 2 previous sessions after filtering out current
      const recentSessions = await chatSessionService.getRecentSessions(userId, agentId, 3);

      // Filter out the current session from previous sessions list
      const previousSessions = currentSessionId
        ? recentSessions.filter(session => session.session_id !== currentSessionId)
        : recentSessions;

      // Keep only the 2 most recent previous sessions
      setSessions(previousSessions.slice(0, 2));

    } catch (error) {
      console.error('Error loading previous sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  if (loading) {
    return (
      <div className={`previous-sessions-loading ${className}`}>
        <div className="p-1">
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
        <div className="p-2">
          <div className="text-center text-gray-500 text-[10px] py-2">
            <p>No history</p>
            <p className="text-xs mt-1">Start chatting to see your history here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`previous-sessions-container ${className}`}>
      <div className="p-1">
        {!hideHeader && <h3 className="text-sm font-bold text-gray-900 pl-1 mb-2">Previous Sessions</h3>}
        <div className="space-y-1">
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
                className={`w-full p-1.5 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group ${currentSessionId === session.session_id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-start gap-1">
                  <div className={`p-0.5 rounded mt-0.5 group-hover:bg-purple-200 transition-colors ${currentSessionId === session.session_id
                    ? 'bg-purple-200'
                    : 'bg-purple-100'
                    }`}>
                    <MessageSquare size={10} className="text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-900 truncate mb-0">
                      {(() => {
                        const getSessionTitle = (): string => {
                          const date = formatDate(session.last_message_timestamp);
                          const preview = session.last_message_preview;

                          if (preview.trim().startsWith('{')) {
                            try {
                              const parsed = JSON.parse(preview);
                              if (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels) {
                                return `${date} - Social Posts`;
                              }
                            } catch { }
                          }

                          if (preview.includes('<html>') || preview.includes('<table>') || preview.includes('Newsletter')) {
                            return `${date} - Newsletter`;
                          }
                          return `${date} - Session ${index + 1}`;
                        };

                        return getSessionTitle();
                      })()}
                    </p>
                    <p className="text-[9px] text-gray-500 line-clamp-1 italic">
                      {formatDate(session.last_message_timestamp)}
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