import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, Bell, Shield, CreditCard, HelpCircle, 
  LogOut, ChevronRight, Moon, Sun, Smartphone, Mail, 
  Lock, Globe, Palette, Database, Download, Trash2,
  Crown, Gift
} from 'lucide-react';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { useUser } from '../../../hooks/useUser';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

interface MobileAccountProps {
  onNavigate?: (path: string) => void;
}

export function MobileAccount({ onNavigate }: MobileAccountProps) {
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    handleNavigate('/login');
  };

  const handleExportData = () => {
    toast.success('Data export started - you\'ll receive an email when ready');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires verification - check your email');
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          subtitle: 'Update your personal information',
          icon: User,
          onClick: () => handleNavigate('/account-settings')
        },
        {
          id: 'security',
          title: 'Security & Privacy',
          subtitle: 'Password, 2FA, data settings',
          icon: Shield,
          onClick: () => handleNavigate('/account-settings')
        },
        {
          id: 'billing',
          title: 'Billing & Subscription',
          subtitle: 'Manage your plan and payments',
          icon: CreditCard,
          onClick: () => handleNavigate('/billing-settings')
        },
        {
          id: 'referrals',
          title: 'Referral Hub',
          subtitle: 'Share and earn rewards',
          icon: Gift,
          onClick: () => handleNavigate('/referrals'),
          badge: 'Earn Credits'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get updates on your phone',
          icon: Bell,
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
        {
          id: 'email',
          title: 'Email Updates',
          subtitle: 'Newsletter and product updates',
          icon: Mail,
          toggle: true,
          value: emailUpdates,
          onChange: setEmailUpdates
        },
        {
          id: 'appearance',
          title: 'Dark Mode',
          subtitle: 'Switch to dark theme',
          icon: darkMode ? Moon : Sun,
          toggle: true,
          value: darkMode,
          onChange: setDarkMode
        },
        {
          id: 'language',
          title: 'Language & Region',
          subtitle: 'English (US)',
          icon: Globe,
          onClick: () => handleNavigate('/account-settings')
        }
      ]
    },
    {
      title: 'Business',
      items: [
        {
          id: 'team',
          title: 'Team Management',
          subtitle: 'Manage team members and roles',
          icon: User,
          onClick: () => handleNavigate('/team-settings')
        },
        {
          id: 'integrations',
          title: 'Integrations',
          subtitle: 'Connect your favorite tools',
          icon: Smartphone,
          onClick: () => handleNavigate('/integrations-settings')
        },
        {
          id: 'branding',
          title: 'Company Branding',
          subtitle: 'Customize your brand appearance',
          icon: Palette,
          onClick: () => handleNavigate('/business-settings')
        },
        {
          id: 'data',
          title: 'Data Management',
          subtitle: 'Export, backup, and manage data',
          icon: Database,
          onClick: () => handleNavigate('/account-settings')
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          icon: HelpCircle,
          onClick: () => handleNavigate('/help')
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve Squidgy',
          icon: Mail,
          onClick: () => toast.success('Feedback form opened')
        }
      ]
    },
    {
      title: 'Data',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Download your data',
          icon: Download,
          onClick: handleExportData
        },
        {
          id: 'delete',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          icon: Trash2,
          onClick: handleDeleteAccount,
          danger: true
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border">
        <h1 className="text-2xl font-bold text-primary text-center">Account</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4">
          <MobileCard className="p-4 border border-border">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} alt={user?.email} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                  {user?.email?.slice(0, 2).toUpperCase() || 'SQ'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {profile?.company_name || 'Your Company'}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro Plan
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    🔥 12 referrals
                  </Badge>
                </div>
              </div>

              <TouchButton
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('/account-settings')}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </TouchButton>
            </div>
          </MobileCard>
        </div>

        {/* Menu Sections */}
        <div className="px-4 pb-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                {section.title}
              </h3>
              <MobileCard className="border border-border overflow-hidden">
                {section.items.map((item, index) => (
                  <div key={item.id}>
                    <div
                      className={cn(
                        'flex items-center gap-3 p-4 transition-colors',
                        item.onClick && 'active:bg-muted cursor-pointer',
                        item.danger && 'text-red-500'
                      )}
                      onClick={item.onClick}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        item.danger ? 'bg-red-100 text-red-500' : 'bg-muted'
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            'font-medium text-sm',
                            item.danger ? 'text-red-500' : 'text-foreground'
                          )}>
                            {item.title}
                          </h4>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>

                      {item.toggle ? (
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                          className="ml-2"
                        />
                      ) : item.onClick ? (
                        <ChevronRight className={cn(
                          'h-4 w-4',
                          item.danger ? 'text-red-400' : 'text-muted-foreground'
                        )} />
                      ) : null}
                    </div>
                    
                    {index < section.items.length - 1 && (
                      <div className="border-b border-border ml-[58px]" />
                    )}
                  </div>
                ))}
              </MobileCard>
            </div>
          ))}

          {/* Logout Button */}
          <MobileCard className="border border-border">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer active:bg-muted transition-colors"
              onClick={handleLogout}
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-red-500">Sign Out</h4>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400" />
            </div>
          </MobileCard>

          {/* App Version */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Squidgy Mobile v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
