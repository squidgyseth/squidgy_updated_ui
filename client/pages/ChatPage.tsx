import AgentRoutes from "../routes/AgentRoutes";
import { ResponsiveLayout } from "../components/mobile/layout/ResponsiveLayout";
import MobileChats from "./mobile/chats";

export default function ChatPage() {
  const desktopLayout = <AgentRoutes />;
  
  return (
    <ResponsiveLayout
      desktopLayout={desktopLayout}
      showBottomNav={true}
    >
      <MobileChats />
    </ResponsiveLayout>
  );
}
