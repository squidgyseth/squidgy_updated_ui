import React from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import LinkDetectingTextArea from '../ui/LinkDetectingTextArea';
import HTMLPreview from './HTMLPreview';
import SocialMediaPreview from './SocialMediaPreview';
import FileMessage from './FileMessage';
import { createProxyUrl } from '../../utils/urlMasking';

export interface ChatMessageBubbleProps {
  message: string;
  sender: 'user' | 'agent' | 'User';
  timestamp: string | Date;
  agentName?: string;
  agentId?: string;
  agentAvatar?: string;
  fileUpload?: {
    fileName: string;
    fileUrl: string;
    fileId?: string;
    status?: string;
  };
  className?: string;
  showAvatar?: boolean;
  readOnly?: boolean;
}

/**
 * Shared ChatMessageBubble component for displaying chat messages.
 * Used by both the main chat interface (for history) and admin chat history view.
 * This is a read-only component without streaming - for live streaming, use StreamingAgentMessage.
 */
export default function ChatMessageBubble({
  message,
  sender,
  timestamp,
  agentName,
  agentId,
  agentAvatar,
  fileUpload,
  className = '',
  showAvatar = true,
  readOnly = true
}: ChatMessageBubbleProps) {
  const isUser = sender === 'user' || sender === 'User';
  
  // Format timestamp
  const formatTime = (ts: string | Date) => {
    const date = ts instanceof Date ? ts : new Date(ts);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if content is HTML (for newsletter agent)
  const hasHTMLContent = (content: string): boolean => {
    const htmlPatterns = [
      /<html[\s>]/i,
      /<body[\s>]/i,
      /<table[\s>]/i,
      /<style[\s>]/i,
      /<!DOCTYPE/i
    ];
    return htmlPatterns.some(pattern => pattern.test(content));
  };

  // Check if content is social media JSON (for content_repurposer agent)
  const hasSocialMediaContent = (content: string): boolean => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.error && parsed.raw) {
        try {
          const rawContent = parsed.raw.replace(/```json\n|\n```/g, '');
          const innerParsed = JSON.parse(rawContent);
          if (innerParsed && (innerParsed.LinkedIn || innerParsed.InstagramFacebook || innerParsed.TikTokReels || innerParsed.GeneralAssets)) {
            return true;
          }
        } catch {
          // Continue
        }
      }
      if (Array.isArray(parsed) && parsed[0] && parsed[0].ContentRepurposerPosts) {
        return true;
      }
      if (parsed && parsed.ContentRepurposerPosts) {
        return true;
      }
      if (parsed && (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels || parsed.GeneralAssets)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Parse file info from message content
  const parseFileInfo = (content: string) => {
    const fileNameMatch = content.match(/File:\s*([^\r\n]+)/);
    const fileUrlMatch = content.match(/URL:\s*(https?:\/\/\S+)/m) ||
                         content.match(/URL:\s*(?:\r?\n)+\s*(https?:\/\/\S+)/m);

    if (fileUrlMatch && fileNameMatch) {
      const fileUrl = (fileUrlMatch[1] || fileUrlMatch[0]).toString().replace(/^URL:\s*/i, '').trim();
      const parts = content.split(/(?:\r?\n)+File:\s*/);
      return {
        hasFile: true,
        fileName: fileNameMatch[1].trim(),
        fileUrl,
        messageText: parts[0].trim()
      };
    }

    return {
      hasFile: false,
      messageText: content
    };
  };

  // Render agent message content based on type
  const renderAgentContent = () => {
    // Check for HTML content (newsletter)
    if ((agentId === 'newsletter' || agentId === 'newsletter_multi') && hasHTMLContent(message)) {
      return <HTMLPreview content={message} agentName={agentId} />;
    }

    // Check for social media content (content_repurposer)
    if ((agentId === 'content_repurposer' || agentId === 'content_repurposer_multi') && hasSocialMediaContent(message)) {
      return <SocialMediaPreview content={message} historyId="" />;
    }

    // Check for embedded file info
    const fileInfo = parseFileInfo(message);
    if (fileInfo.hasFile) {
      return (
        <div>
          <LinkDetectingTextArea 
            content={fileInfo.messageText} 
            className="text-gray-900 whitespace-pre-wrap"
          />
          <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-flex items-center gap-1">
            📎 {fileInfo.fileName}
          </div>
        </div>
      );
    }

    // Default: plain text/markdown
    return (
      <LinkDetectingTextArea 
        content={message} 
        className="text-gray-900 whitespace-pre-wrap"
      />
    );
  };

  // Render user message content
  const renderUserContent = () => {
    // Check for file upload
    if (fileUpload) {
      return (
        <FileMessage 
          fileInfo={{
            fileName: fileUpload.fileName,
            fileUrl: fileUpload.fileUrl,
            fileId: fileUpload.fileId || `file_${Date.now()}`,
            status: (fileUpload.status as 'completed' | 'pending' | 'processing' | 'failed') || 'completed',
            agentId: agentId || '',
            agentName: agentName || ''
          }} 
          timestamp={timestamp instanceof Date ? timestamp : new Date(timestamp)} 
        />
      );
    }

    // Check for embedded file info in message
    const fileInfo = parseFileInfo(message);
    if (fileInfo.hasFile) {
      return (
        <div>
          <p className="text-white whitespace-pre-wrap">{fileInfo.messageText}</p>
          <div className="mt-2 text-xs text-purple-200 bg-purple-700 px-2 py-1 rounded inline-flex items-center gap-1">
            📎 {fileInfo.fileName}
          </div>
        </div>
      );
    }

    // Default: plain text
    return <p className="text-white whitespace-pre-wrap">{message}</p>;
  };

  if (isUser) {
    // User message - right aligned, blue/purple background
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[80%]">
          <div className="bg-purple-600 text-white rounded-lg px-4 py-2">
            {renderUserContent()}
          </div>
          <span className="text-xs text-gray-500 mt-1 block text-right">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Agent message - left aligned, gray background
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex items-start gap-3 max-w-[80%]">
        {showAvatar && agentAvatar && (
          <img
            src={createProxyUrl(agentAvatar, 'avatar')}
            alt={agentName || 'Agent'}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}
        {showAvatar && !agentAvatar && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-700">
              {agentName || sender}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(timestamp)}
            </span>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            {renderAgentContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
