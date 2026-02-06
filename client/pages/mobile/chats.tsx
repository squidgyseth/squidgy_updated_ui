import { MobileLayout, MobileChatList } from '../../components/mobile';

/**
 * Mobile Chats Page - Shows list of enabled agents
 * When an agent is selected, it navigates to /chat/:agentId which uses the full chat interface
 */
export default function MobileChatsPage() {
  return (
    <MobileLayout showBottomNav={true}>
      <MobileChatList />
    </MobileLayout>
  );
}
