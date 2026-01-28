import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import LeftNavigation from "./LeftNavigation";
import CategorizedAgentSidebar from "./CategorizedAgentSidebar";
import GroupChatArea from "./GroupChatArea";
import { SidebarProvider, useSidebar } from "../../contexts/SidebarContext";

interface GroupChat {
  id: string;
  name: string;
  participants: string[];
  created_at: string;
}

function GroupChatLayoutContent() {
  const { groupId } = useParams<{ groupId: string }>();
  const { isSidebarOpen } = useSidebar();
  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroupChat(groupId);
    }
  }, [groupId]);

  const loadGroupChat = async (id: string) => {
    try {
      console.log('🔍 Loading group chat:', id);
      const groupChatService = (await import('../../services/groupChatService')).default.getInstance();
      
      const chat = await groupChatService.getGroupChat(id);
      if (chat) {
        setGroupChat(chat);
        console.log('✅ Loaded group chat:', chat);
      } else {
        console.warn('⚠️ Group chat not found');
      }
    } catch (error) {
      console.error('❌ Failed to load group chat:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading group chat...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      {/* Left Navigation - Fixed positioned */}
      <div className="hidden sm:block">
        <LeftNavigation currentPage="chat" />
      </div>

      {/* Main content area with left margin to account for fixed nav */}
      <div className="ml-[60px] h-screen flex">
        {/* Enhanced Categorized Agent Sidebar */}
        {isSidebarOpen && (
          <div className="hidden lg:block transition-all duration-300 ease-in-out">
            <CategorizedAgentSidebar />
          </div>
        )}

        {/* Group Chat Area */}
        <div className="flex-1 flex flex-col">
          <GroupChatArea groupId={groupId} groupChat={groupChat} />
        </div>
      </div>
    </div>
  );
}

export default function GroupChatLayout() {
  return (
    <SidebarProvider>
      <GroupChatLayoutContent />
    </SidebarProvider>
  );
}
