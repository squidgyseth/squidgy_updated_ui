import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import GroupChatInterface from '../chat/GroupChatInterface';

interface GroupChat {
  id: string;
  name: string;
  participants: string[];
  created_at: string;
}

interface GroupChatAreaProps {
  groupId?: string;
  groupChat?: GroupChat | null;
  className?: string;
}

export default function GroupChatArea({ groupId, groupChat, className = '' }: GroupChatAreaProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBackToChats = () => {
    navigate('/chat');
  };

  if (!groupId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Group Chat Selected</h3>
          <p className="text-gray-500">Create or select a group chat to start collaborating with multiple AI assistants.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToChats}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-squidgy-primary/10">
              <Users className="h-5 w-5 text-squidgy-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {groupChat?.name || `Group Chat ${groupId}`}
              </h1>
              <p className="text-sm text-gray-500">
                {groupChat?.participants?.length || 0} AI assistants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Group Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <GroupChatInterface 
          groupId={groupId} 
          groupChat={groupChat}
        />
      </div>
    </div>
  );
}
