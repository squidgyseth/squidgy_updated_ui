import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssistantOption } from '@/types/onboarding.types';

interface AssistantCardProps {
  assistant: AssistantOption;
  isSelected: boolean;
  onSelect: (assistantId: string) => void;
  className?: string;
}

export function AssistantCard({ 
  assistant, 
  isSelected, 
  onSelect, 
  className 
}: AssistantCardProps) {
  const handleClick = () => {
    onSelect(assistant.id);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-2 relative",
        isSelected
          ? "border-[#6017E8] bg-purple-50"
          : "border-gray-200 hover:border-gray-300",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        {/* Header with icon and badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: assistant.iconColor || '#6017E8' }}
            >
              {assistant.icon}
            </div>
            
            {/* Selection checkbox */}
            <div className={cn(
              "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
              isSelected 
                ? "bg-[#6017E8] border-[#6017E8]" 
                : "border-gray-300 hover:border-gray-400"
            )}>
              {isSelected && (
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 14 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M11.6667 3.5L5.25 9.91667L2.33333 7" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-1">
            {assistant.isRecommended && (
              <Badge 
                variant="secondary" 
                className="bg-[#6017E8] text-white text-xs px-2 py-1 font-['Open_Sans']"
              >
                Recommended
              </Badge>
            )}
            {assistant.isPopular && (
              <Badge 
                variant="secondary" 
                className="bg-[#FB252A] text-white text-xs px-2 py-1 font-['Open_Sans']"
              >
                Popular
              </Badge>
            )}
          </div>
        </div>

        {/* Assistant name and description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
            {assistant.name}
          </h3>
          <p className="text-sm text-gray-600 font-['Open_Sans'] leading-5">
            {assistant.description}
          </p>
        </div>

        {/* Key capabilities */}
        {assistant.keyCapabilities.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 font-['Open_Sans']">
              KEY CAPABILITIES
            </p>
            <ul className="space-y-1">
              {assistant.keyCapabilities.slice(0, 4).map((capability, index) => (
                <li 
                  key={index}
                  className="text-sm text-gray-600 font-['Open_Sans'] flex items-center"
                >
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                  {capability.name}
                </li>
              ))}
              {assistant.keyCapabilities.length > 4 && (
                <li className="text-sm text-gray-500 font-['Open_Sans'] italic">
                  +{assistant.keyCapabilities.length - 4} more capabilities
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}