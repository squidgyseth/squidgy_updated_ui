import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { useMobileContext } from '../../../hooks/mobile/useMobileContext';
import { BottomNavigation } from './BottomNavigation';
import { MobileHeader } from './MobileHeader';

interface MobileLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerTitle?: string;
  backButton?: boolean;
  headerAction?: ReactNode;
  className?: string;
}

export function MobileLayout({
  children,
  showHeader = false,
  showBottomNav = true,
  headerTitle,
  backButton = false,
  headerAction,
  className,
}: MobileLayoutProps) {
  const { deviceInfo } = useMobileContext();

  // Only render mobile layout on mobile devices
  if (!deviceInfo.isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      {showHeader && (
        <MobileHeader
          title={headerTitle}
          showBackButton={backButton}
          action={headerAction}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-hidden',
          showBottomNav && 'pb-16', // Account for bottom navigation
          showHeader && 'pt-0', // Header handles its own spacing
          className
        )}
      >
        <div className="h-full overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
