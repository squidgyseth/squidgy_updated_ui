import { ReactNode, forwardRef } from 'react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { Loader2 } from 'lucide-react';

interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'touch';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      children,
      onClick,
      variant = 'default',
      size = 'touch',
      className,
      disabled = false,
      loading = false,
      fullWidth = false,
      icon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          // Base touch-friendly styling
          'transition-all duration-200 active:scale-[0.98]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

          // Size variants optimized for touch
          size === 'touch' && 'h-11 px-6 py-2 text-base min-w-[44px]', // 44px minimum touch target
          size === 'sm' && 'h-9 px-4 text-sm min-w-[36px]',
          size === 'lg' && 'h-12 px-8 text-base min-w-[48px]',

          // Gradient variant (matching mobile designs)
          variant === 'gradient' && [
            'bg-gradient-to-r from-red-500 to-purple-600',
            'hover:from-red-600 hover:to-purple-700',
            'text-white border-none shadow-lg hover:shadow-xl',
            'disabled:from-gray-400 disabled:to-gray-500',
          ],

          // Full width option
          fullWidth && 'w-full',

          // Loading state
          loading && 'cursor-not-allowed',

          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          {/* Loading spinner */}
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {/* Icon */}
          {!loading && icon && (
            <span className="flex items-center">
              {icon}
            </span>
          )}

          {/* Content */}
          <span className={cn(loading && 'opacity-70')}>
            {children}
          </span>
        </div>
      </Button>
    );
  }
);

TouchButton.displayName = 'TouchButton';