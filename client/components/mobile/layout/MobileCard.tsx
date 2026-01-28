import { ReactNode, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../../lib/utils';

interface MobileCardProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'interactive' | 'elevated';
}

export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  (
    {
      children,
      title,
      description,
      footer,
      className,
      onClick,
      disabled = false,
      variant = 'default',
    },
    ref
  ) => {
    const isClickable = !!onClick && !disabled;

    return (
      <Card
        ref={ref}
        onClick={isClickable ? onClick : undefined}
        className={cn(
          // Base mobile card styling
          'w-full transition-all duration-200',
          
          // Variant styles
          variant === 'interactive' && [
            'cursor-pointer hover:shadow-md active:scale-[0.98] active:shadow-sm',
            'border-border hover:border-primary/20',
          ],
          
          variant === 'elevated' && [
            'shadow-sm hover:shadow-md',
            'bg-card border-border/50',
          ],

          // Interactive states
          isClickable && [
            'cursor-pointer select-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          ],

          // Disabled state
          disabled && [
            'opacity-60 cursor-not-allowed',
            'hover:shadow-none active:scale-100',
          ],

          // Mobile-specific spacing and sizing
          'min-h-[44px]', // Ensure minimum touch target
          
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <CardHeader className="pb-3">
            {title && (
              <CardTitle className="text-base font-semibold leading-tight">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}

        {/* Content */}
        {children && (
          <CardContent className={cn(!title && !description && 'pt-6')}>
            {children}
          </CardContent>
        )}

        {/* Footer */}
        {footer && (
          <CardFooter className="pt-3">
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

MobileCard.displayName = 'MobileCard';
