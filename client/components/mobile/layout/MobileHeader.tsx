import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  action?: ReactNode;
  className?: string;
  onBack?: () => void;
}

export function MobileHeader({
  title,
  showBackButton = false,
  action,
  className,
  onBack,
}: MobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-4 bg-background border-b border-border',
        'sticky top-0 z-50 backdrop-blur-sm bg-background/95',
        className
      )}
    >
      {/* Left Side - Back Button */}
      <div className="flex items-center min-w-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 h-8 w-8 mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Title */}
        {title && (
          <h1 className="text-lg font-semibold truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right Side - Action */}
      {action && (
        <div className="flex items-center ml-2">
          {action}
        </div>
      )}
    </header>
  );
}