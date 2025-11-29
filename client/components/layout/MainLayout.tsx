import { useState } from "react";
import { useLocation } from "react-router-dom";
import LeftNavigation from "./LeftNavigation";
import CategorizedAgentSidebar from "./CategorizedAgentSidebar";
import EnhancedChatArea from "./EnhancedChatArea";
import AssistantDetails from "./AssistantDetails";
import { SidebarProvider, useSidebar } from "../../contexts/SidebarContext";

function MainLayoutContent() {
  const location = useLocation();
  const [selectedAssistant, setSelectedAssistant] = useState("SMM Assistant");
  const { isSidebarOpen } = useSidebar();
  
  // Check if we're on a specific agent page that uses UniversalChatLayout
  const isOnAgentPage = location.pathname.includes('/chat/') && location.pathname !== '/chat';
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(!isOnAgentPage);

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

        {/* Enhanced Chat Area with Carousel Support */}
        <div className="flex-1 flex flex-col">
          <EnhancedChatArea />
        </div>

        {/* Assistant Details Panel - Disabled when on specific agent pages */}
        {isDetailsPanelOpen && !isOnAgentPage && (
          <div className="hidden xl:block">
            <AssistantDetails
              assistant={selectedAssistant}
              onClose={() => setIsDetailsPanelOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
}
