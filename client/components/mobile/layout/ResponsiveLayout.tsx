import { ReactNode } from 'react';
import { useMobileContext } from '../../../hooks/mobile/useMobileContext';
import { MobileLayout } from './MobileLayout';

interface ResponsiveLayoutProps {
  children: ReactNode;
  
  // Desktop layout props
  desktopLayout?: ReactNode;
  
  // Mobile layout props
  mobileHeaderTitle?: string;
  showMobileHeader?: boolean;
  showBottomNav?: boolean;
  mobileBackButton?: boolean;
  mobileHeaderAction?: ReactNode;
  
  // Common props
  className?: string;
}

export function ResponsiveLayout({
  children,
  desktopLayout,
  mobileHeaderTitle,
  showMobileHeader = false,
  showBottomNav = true,
  mobileBackButton = false,
  mobileHeaderAction,
  className,
}: ResponsiveLayoutProps) {
  const { deviceInfo } = useMobileContext();

  // Render mobile layout for mobile devices
  if (deviceInfo.isMobile) {
    return (
      <MobileLayout
        showHeader={showMobileHeader}
        showBottomNav={showBottomNav}
        headerTitle={mobileHeaderTitle}
        backButton={mobileBackButton}
        headerAction={mobileHeaderAction}
        className={className}
      >
        {children}
      </MobileLayout>
    );
  }

  // Render desktop layout for larger screens
  if (desktopLayout) {
    return <>{desktopLayout}</>;
  }

  // Default: render children as-is for desktop
  return <div className={className}>{children}</div>;
}
