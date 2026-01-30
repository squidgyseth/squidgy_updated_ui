import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SelectableCardProps {
  id: string;
  title: string;
  description: string;
  icon?: string | React.ReactNode;
  iconColor?: string;
  isSelected?: boolean;
  isRecommended?: boolean;
  isPopular?: boolean;
  onClick?: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function SelectableCard({
  id,
  title,
  description,
  icon,
  iconColor = '#6017E8',
  isSelected = false,
  isRecommended = false,
  isPopular = false,
  onClick,
  className,
  children
}: SelectableCardProps) {
  const handleClick = () => {
    onClick?.(id);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        "border-2 hover:border-gray-300",
        isSelected
          ? "border-[#6017E8] bg-purple-50"
          : "border-gray-200",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-6 relative">
        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isRecommended && (
            <Badge 
              variant="secondary" 
              className="bg-[#6017E8] text-white text-xs px-2 py-1 font-['Open_Sans']"
            >
              Recommended
            </Badge>
          )}
          {isPopular && (
            <Badge 
              variant="secondary" 
              className="bg-[#FB252A] text-white text-xs px-2 py-1 font-['Open_Sans']"
            >
              Popular
            </Badge>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className="mb-4">
            {typeof icon === 'string' ? (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: iconColor + '20', color: iconColor }}
              >
                <span className="text-2xl">{icon}</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 left-4">
            <div className="w-6 h-6 rounded-full bg-[#6017E8] flex items-center justify-center">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M13.3333 4L6 11.3333L2.66667 8" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn("space-y-2", isSelected && "pl-8")}>
          <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] leading-6">
            {title}
          </h3>
          <p className="text-sm text-gray-600 font-['Open_Sans'] leading-5">
            {description}
          </p>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
