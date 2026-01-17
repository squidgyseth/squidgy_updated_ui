import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Search, Database, Globe, Zap } from 'lucide-react';

interface ActionItem {
  action: string;
  [key: string]: unknown;
}

interface ActionsDisplayProps {
  actionsPerformed?: ActionItem[];
  actionsTodo?: ActionItem[];
  className?: string;
  defaultExpanded?: boolean;
}

// Icon mapping for different action types
const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('search') || actionLower.includes('rag')) {
    return <Search className="w-3.5 h-3.5" />;
  }
  if (actionLower.includes('save') || actionLower.includes('update') || actionLower.includes('crud')) {
    return <Database className="w-3.5 h-3.5" />;
  }
  if (actionLower.includes('web') || actionLower.includes('analysis')) {
    return <Globe className="w-3.5 h-3.5" />;
  }
  if (actionLower.includes('tool')) {
    return <Zap className="w-3.5 h-3.5" />;
  }
  return <CheckCircle className="w-3.5 h-3.5" />;
};

// Format action name for display
const formatActionName = (action: string): string => {
  return action
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format action details
const formatActionDetails = (item: ActionItem): string => {
  const details: string[] = [];

  Object.entries(item).forEach(([key, value]) => {
    if (key === 'action') return; // Skip the action name itself

    if (typeof value === 'string' || typeof value === 'number') {
      details.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      details.push(`${key}: ${value.join(', ')}`);
    }
  });

  return details.join(' | ');
};

export default function ActionsDisplay({
  actionsPerformed = [],
  actionsTodo = [],
  className = '',
  defaultExpanded = false
}: ActionsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Don't render if no actions
  if (actionsPerformed.length === 0 && actionsTodo.length === 0) {
    return null;
  }

  const totalActions = actionsPerformed.length + actionsTodo.length;

  return (
    <div className={`mt-2 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        <span>
          {actionsPerformed.length > 0 && (
            <span className="text-green-600">{actionsPerformed.length} completed</span>
          )}
          {actionsPerformed.length > 0 && actionsTodo.length > 0 && ' · '}
          {actionsTodo.length > 0 && (
            <span className="text-amber-600">{actionsTodo.length} pending</span>
          )}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Actions Performed */}
          {actionsPerformed.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Completed:</div>
              {actionsPerformed.map((item, index) => (
                <div
                  key={`performed-${index}`}
                  className="flex items-start gap-2 text-xs bg-green-50 border border-green-100 rounded px-2 py-1.5"
                >
                  <span className="text-green-600 mt-0.5">
                    {getActionIcon(item.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-green-800">
                      {formatActionName(item.action)}
                    </span>
                    {Object.keys(item).length > 1 && (
                      <span className="text-green-600 ml-1.5">
                        — {formatActionDetails(item)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions Todo */}
          {actionsTodo.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Pending:</div>
              {actionsTodo.map((item, index) => (
                <div
                  key={`todo-${index}`}
                  className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 rounded px-2 py-1.5"
                >
                  <span className="text-amber-600 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-amber-800">
                      {formatActionName(item.action)}
                    </span>
                    {Object.keys(item).length > 1 && (
                      <span className="text-amber-600 ml-1.5">
                        — {formatActionDetails(item)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
