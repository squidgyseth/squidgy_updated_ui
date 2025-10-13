import { useState } from "react";
import LeftNavigation from "./LeftNavigation";
import CategorizedAgentSidebar from "./CategorizedAgentSidebar";
import EnhancedChatArea from "./EnhancedChatArea";
import AssistantDetails from "./AssistantDetails";

export default function MainLayout() {
  const [selectedAssistant, setSelectedAssistant] = useState("SMM Assistant");
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

        {/* Assistant Details Panel - Fixed width, collapsible */}
        {isDetailsPanelOpen && (
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
