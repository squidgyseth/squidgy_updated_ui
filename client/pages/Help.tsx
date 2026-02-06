import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, FileText, MessageCircle } from 'lucide-react';
import { MobileLayout } from '../components/mobile/layout/MobileLayout';
import { MobileCard } from '../components/mobile/layout/MobileCard';
import { TouchButton } from '../components/mobile/layout/TouchButton';
import { useMobileContext } from '../hooks/mobile/useMobileContext';

export default function Help() {
  const navigate = useNavigate();
  const { deviceInfo } = useMobileContext();

  const helpSections = [
    {
      title: 'Getting Started',
      icon: HelpCircle,
      description: 'Learn the basics of using Squidgy',
      onClick: () => window.open('https://squidgy.ai/docs/getting-started', '_blank')
    },
    {
      title: 'Contact Support',
      icon: Mail,
      description: 'Get in touch with our support team',
      onClick: () => window.open('mailto:support@squidgy.ai', '_blank')
    },
    {
      title: 'Documentation',
      icon: FileText,
      description: 'Browse our comprehensive guides',
      onClick: () => window.open('https://squidgy.ai/docs', '_blank')
    },
    {
      title: 'Live Chat',
      icon: MessageCircle,
      description: 'Chat with our support team',
      onClick: () => window.open('https://squidgy.ai/chat', '_blank')
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border flex items-center gap-3">
        <TouchButton
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </TouchButton>
        <h1 className="text-2xl font-bold text-primary">Help & Support</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-muted-foreground text-sm mb-4">
          Need assistance? We're here to help! Choose from the options below.
        </p>

        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <MobileCard
              key={section.title}
              variant="interactive"
              onClick={section.onClick}
              className="p-4 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </MobileCard>
          );
        })}

        {/* Quick Info */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Quick Info</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Email:</strong> support@squidgy.ai</p>
            <p><strong>Hours:</strong> Mon-Fri, 9am-6pm GMT</p>
            <p><strong>Response Time:</strong> Within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );

  // On mobile, wrap in MobileLayout
  if (deviceInfo.isMobile) {
    return (
      <MobileLayout showBottomNav={true}>
        {content}
      </MobileLayout>
    );
  }

  // On desktop, show simple layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        {content}
      </div>
    </div>
  );
}
