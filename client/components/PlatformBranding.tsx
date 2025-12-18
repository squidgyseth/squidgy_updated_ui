/**
 * Platform Branding Component
 * 
 * Displays platform-specific branding elements like logo and name.
 * Uses the platform context for whitelabel support.
 */

import { usePlatform, usePlatformTheme } from '../contexts/PlatformContext'

interface PlatformLogoProps {
  className?: string
  variant?: 'default' | 'light'
  showName?: boolean
}

/**
 * Platform Logo Component
 * Displays the current platform's logo
 */
export function PlatformLogo({ className = '', variant = 'default', showName = false }: PlatformLogoProps) {
  const { platform } = usePlatform()
  const theme = usePlatformTheme()
  
  const logoSrc = variant === 'light' ? theme.logoLight : theme.logo
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSrc} 
        alt={`${platform.displayName} logo`}
        className="h-8 w-auto"
        onError={(e) => {
          // Fallback to text if logo fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
      {showName && (
        <span className="font-semibold text-lg">{platform.displayName}</span>
      )}
    </div>
  )
}

/**
 * Platform Name Component
 * Displays the current platform's display name
 */
export function PlatformName({ className = '' }: { className?: string }) {
  const { platform } = usePlatform()
  
  return (
    <span className={className}>{platform.displayName}</span>
  )
}

/**
 * Platform Gradient Text
 * Applies the platform's gradient to text
 */
export function PlatformGradientText({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span 
      className={`bg-platform-gradient bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Platform Primary Button
 * A button styled with the platform's primary color
 */
export function PlatformButton({ 
  children, 
  className = '',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`bg-platform-primary hover:opacity-90 text-white px-4 py-2 rounded-button transition-opacity ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Platform Badge
 * A badge styled with the platform's colors
 */
export function PlatformBadge({ 
  children, 
  variant = 'primary',
  className = '' 
}: { 
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent'
  className?: string 
}) {
  const variantClasses = {
    primary: 'bg-platform-primary/10 text-platform-primary',
    secondary: 'bg-platform-secondary/10 text-platform-secondary',
    accent: 'bg-platform-accent/10 text-platform-accent',
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

/**
 * Platform Switcher (for development/testing)
 * Allows switching between platforms in development mode
 */
export function PlatformSwitcher({ className = '' }: { className?: string }) {
  const { platform, platformId, setPlatformId } = usePlatform()
  
  // Only show in development
  if (import.meta.env.VITE_APP_ENV !== 'development' && import.meta.env.PROD) {
    return null
  }
  
  const platforms = ['squidgy', 'yeaa', 'fanatiq', 'trades', 'finance']
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500">Platform:</span>
      <select
        value={platformId}
        onChange={(e) => setPlatformId(e.target.value)}
        className="text-sm border rounded px-2 py-1"
      >
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
      <span 
        className="w-4 h-4 rounded-full" 
        style={{ backgroundColor: platform.theme.primaryColor }}
        title={`Current: ${platform.displayName}`}
      />
    </div>
  )
}
