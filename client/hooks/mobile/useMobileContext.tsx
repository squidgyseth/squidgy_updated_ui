import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  platform: 'android' | 'ios' | 'desktop';
}

interface MobileContextType {
  deviceInfo: DeviceInfo;
  isConnected: boolean;
}

const MobileContext = createContext<MobileContextType | null>(null);

// Breakpoints matching tailwind config
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

function detectPlatform(): 'android' | 'ios' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  return 'desktop';
}

function detectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isTouch: false,
      screenSize: 'desktop',
      orientation: 'landscape',
      platform: 'desktop',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const orientation = height > width ? 'portrait' : 'landscape';
  const platform = detectPlatform();

  let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) screenSize = 'mobile';
  else if (isTablet) screenSize = 'tablet';

  return {
    isMobile,
    isTablet,
    isTouch,
    screenSize,
    orientation,
    platform,
  };
}

interface MobileProviderProps {
  children: ReactNode;
}

export function MobileProvider({ children }: MobileProviderProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDeviceInfo);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDeviceInfo());
    };

    const updateConnectionStatus = () => {
      setIsConnected(navigator.onLine);
    };

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    // Listen for connection changes
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    // Initial setup
    updateDeviceInfo();
    updateConnectionStatus();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  return (
    <MobileContext.Provider value={{ deviceInfo, isConnected }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobileContext() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
}

// Convenience hooks for common use cases
export function useIsMobile() {
  const { deviceInfo } = useMobileContext();
  return deviceInfo.isMobile;
}

export function useIsTablet() {
  const { deviceInfo } = useMobileContext();
  return deviceInfo.isTablet;
}

export function useIsTouch() {
  const { deviceInfo } = useMobileContext();
  return deviceInfo.isTouch;
}

export function useOrientation() {
  const { deviceInfo } = useMobileContext();
  return deviceInfo.orientation;
}

export function usePlatform() {
  const { deviceInfo } = useMobileContext();
  return deviceInfo.platform;
}
