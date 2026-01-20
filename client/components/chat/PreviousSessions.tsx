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
        <h3 className="text-sm font-bold text-gray-900 pl-1 mb-2">Previous Sessions</h3>
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
                className={`w-full p-2 border rounded hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group ${currentSessionId === session.session_id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-start gap-1.5">
                  <div className={`p-1 rounded mt-0.5 group-hover:bg-purple-200 transition-colors ${currentSessionId === session.session_id
                    ? 'bg-purple-200'
                    : 'bg-purple-100'
                    }`}>
                    <MessageSquare size={12} className="text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <p className="text-[11px] font-bold text-gray-900 truncate">
                        {(() => {
                          // Generate descriptive title based on content type
                          const getSessionTitle = (): string => {
                            const date = formatDate(session.last_message_timestamp);
                            const preview = session.last_message_preview;

                            // Check if it's social media content
                            if (preview.trim().startsWith('{')) {
                              try {
                                const parsed = JSON.parse(preview);
                                if (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels) {
                                  return `${date} - Social Media Posts`;
                                }
                              } catch { }
                            }

                            // Check if it's newsletter content  
                            if (preview.includes('<html>') || preview.includes('<table>') || preview.includes('Newsletter')) {
                              return `${date} - Newsletter`;
                            }

                            // Default session title
                            return `${date} Session ${index + 1}`;
                          };

                          return getSessionTitle();
                        })()}
                      </p>
                    </div>

                    <p className="text-[10px] text-gray-600 line-clamp-1">
                      {(() => {
                        // Clean HTML tags, JSON, and get readable text
                        const cleanPreview = (text: string): string => {
                          let cleanText = text;

                          // Try to extract readable content from JSON
                          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                            try {
                              const parsed = JSON.parse(text);

                              // For social media content, extract meaningful text
                              if (parsed.LinkedIn && parsed.LinkedIn.Post1 && parsed.LinkedIn.Post1.Caption) {
                                cleanText = parsed.LinkedIn.Post1.Caption;
                              } else if (parsed.InstagramFacebook && parsed.InstagramFacebook.Post1 && parsed.InstagramFacebook.Post1.Caption) {
                                cleanText = parsed.InstagramFacebook.Post1.Caption;
                              } else {
                                // Generic JSON - just show "Content generated" 
                                cleanText = "Social media content generated";
                              }
                            } catch {
                              // If JSON parsing fails, continue with text cleaning
                            }
                          }

                          // Remove HTML tags
                          const withoutTags = cleanText.replace(/<[^>]*>/g, ' ');
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