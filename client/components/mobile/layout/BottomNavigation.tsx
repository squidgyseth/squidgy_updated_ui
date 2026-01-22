import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Grid3x3, TrendingUp, User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    icon: MessageSquare,
    label: 'Chats',
    path: '/chats',
  },
  {
    icon: Grid3x3,
    label: 'Dashboard',
    path: '/dashboard',
  },
  /*
    {
      icon: TrendingUp,
      label: 'Leads',
      path: '/leads',
    },
  */
  {
    icon: User,
    label: 'Account',
    path: '/account',
  },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    // Handle exact matches and sub-routes
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    // Smooth navigation with loading state
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-12 rounded-lg transition-all duration-200',
                'relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {/* Icon with badge */}
              <div className="relative mb-1">
                <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-0"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium leading-none',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}