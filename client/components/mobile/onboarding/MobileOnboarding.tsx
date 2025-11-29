import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Building, Users, Target, Zap, Bot, Crown } from 'lucide-react';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

interface BusinessType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  popular?: boolean;
  color: string;
}

const businessTypes: BusinessType[] = [
  {
    id: 'solar',
    name: 'Solar & Energy',
    description: 'Solar installations, energy consulting, green solutions',
    icon: '☀️',
    color: 'bg-yellow-500',
    features: ['Lead generation', 'Survey booking', 'Quote automation']
  },
  {
    id: 'saas',
    name: 'SaaS & Tech',
    description: 'Software companies, tech startups, digital products',
    icon: '💻',
    color: 'bg-blue-500',
    features: ['User onboarding', 'Support automation', 'Feature demos']
  },
  {
    id: 'agency',
    name: 'Marketing Agency',
    description: 'Digital marketing, advertising, creative services',
    icon: '📈',
    color: 'bg-purple-500',
    features: ['Client reporting', 'Campaign management', 'Content creation']
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online stores, retail, product sales',
    icon: '🛒',
    color: 'bg-green-500',
    features: ['Order management', 'Customer support', 'Inventory alerts']
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description: 'Business consulting, coaching, advisory services',
    icon: '💼',
    color: 'bg-indigo-500',
    features: ['Client intake', 'Session scheduling', 'Follow-ups']
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Tell us about your unique business',
    icon: '🎯',
    color: 'bg-gray-500',
    features: ['Custom setup', 'Flexible automation', 'Tailored solutions']
  }
];

const assistants: Assistant[] = [
  {
    id: 'sales',
    name: 'Sales Assistant',
    description: 'Generate and qualify leads, book appointments',
    icon: '💼',
    category: 'Sales',
    popular: true,
    color: 'bg-blue-500'
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Handle inquiries, provide instant responses',
    icon: '🎧',
    category: 'Support',
    popular: true,
    color: 'bg-green-500'
  },
  {
    id: 'content',
    name: 'Content Creator',
    description: 'Write social media posts and marketing content',
    icon: '🎨',
    category: 'Marketing',
    color: 'bg-purple-500'
  },
  {
    id: 'newsletter',
    name: 'Newsletter Writer',
    description: 'Create engaging email newsletters',
    icon: '📧',
    category: 'Marketing',
    color: 'bg-orange-500'
  },
  {
    id: 'scheduler',
    name: 'Appointment Scheduler',
    description: 'Manage calendars and book meetings',
    icon: '📅',
    category: 'Operations',
    color: 'bg-pink-500'
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Generate reports and business insights',
    icon: '📊',
    category: 'Analytics',
    color: 'bg-cyan-500'
  }
];

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with Squidgy' },
  { id: 'business', title: 'Business Type', description: 'What do you do?' },
  { id: 'company', title: 'Company Info', description: 'Tell us about yourself' },
  { id: 'assistants', title: 'Choose Assistants', description: 'Pick your AI helpers' },
  { id: 'setup', title: 'Setup', description: 'Configuring everything' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' }
];

interface MobileOnboardingProps {
  onComplete?: () => void;
}

export function MobileOnboarding({ onComplete }: MobileOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'business':
        return selectedBusinessType !== null;
      case 'company':
        return companyName.trim().length > 0;
      case 'assistants':
        return selectedAssistants.length > 0;
      case 'setup':
        return true;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  const toggleAssistant = (assistantId: string) => {
    if (selectedAssistants.includes(assistantId)) {
      setSelectedAssistants(prev => prev.filter(id => id !== assistantId));
    } else {
      setSelectedAssistants(prev => [...prev, assistantId]);
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to Squidgy</h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto">
              Your AI-powered business automation platform. Let's set up your workspace in just a few steps.
            </p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Choose your business type</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Select AI assistants</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Start automating</span>
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Building className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">What's your business type?</h2>
              <p className="text-muted-foreground">This helps us customize your AI assistants</p>
            </div>
            
            <div className="space-y-3">
              {businessTypes.map((type) => (
                <MobileCard
                  key={type.id}
                  variant="interactive"
                  onClick={() => setSelectedBusinessType(type)}
                  className={cn(
                    'p-4 border transition-all',
                    selectedBusinessType?.id === type.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary ring-opacity-20'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', type.color)}>
                      <span className="text-xl">{type.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{type.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {type.features.slice(0, 2).map((feature, index) => (
                          <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedBusinessType?.id === type.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">Tell us about your company</h2>
              <p className="text-muted-foreground">This information helps personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name *
                </label>
                <Input
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website (Optional)
                </label>
                <Input
                  placeholder="https://your-website.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brief Description (Optional)
                </label>
                <Textarea
                  placeholder="What does your company do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {selectedBusinessType && (
                <MobileCard className="p-3 border border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedBusinessType.icon}</span>
                    <span className="text-sm font-medium text-foreground">{selectedBusinessType.name}</span>
                  </div>
                </MobileCard>
              )}
            </div>
          </div>
        );

      case 'assistants':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Bot className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">Choose your AI assistants</h2>
              <p className="text-muted-foreground">Select the assistants that will help your business</p>
            </div>

            <div className="space-y-3">
              {assistants.map((assistant) => (
                <MobileCard
                  key={assistant.id}
                  variant="interactive"
                  onClick={() => toggleAssistant(assistant.id)}
                  className={cn(
                    'p-4 border transition-all',
                    selectedAssistants.includes(assistant.id)
                      ? 'border-primary bg-primary/5 ring-2 ring-primary ring-opacity-20'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', assistant.color)}>
                      <span className="text-xl">{assistant.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{assistant.name}</h3>
                        {assistant.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{assistant.description}</p>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md mt-1 inline-block">
                        {assistant.category}
                      </span>
                    </div>
                    <div className={cn(
                      'w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all',
                      selectedAssistants.includes(assistant.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}>
                      {selectedAssistants.includes(assistant.id) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>

            {selectedAssistants.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✨ You've selected {selectedAssistants.length} assistant{selectedAssistants.length > 1 ? 's' : ''}. 
                  You can add more later!
                </p>
              </div>
            )}
          </div>
        );

      case 'setup':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Setting up your workspace</h2>
            <p className="text-muted-foreground mb-8">
              We're configuring your AI assistants and workspace...
            </p>
            <div className="space-y-4 max-w-xs mx-auto">
              <div className="flex items-center gap-3 text-left">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Creating your workspace</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Setting up AI assistants</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                <span className="text-sm text-muted-foreground">Finalizing configuration</span>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">You're all set!</h1>
            <p className="text-muted-foreground mb-8">
              Your Squidgy workspace is ready. Start automating your business processes with AI.
            </p>
            <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Workspace created for {companyName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">{selectedAssistants.length} AI assistants configured</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Ready to start automating</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between mb-3">
          {currentStep > 0 && currentStepData.id !== 'setup' && currentStepData.id !== 'complete' && (
            <TouchButton
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </TouchButton>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{currentStepData.title}</h1>
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          </div>
          <div className="w-10 flex justify-end">
            <span className="text-sm text-muted-foreground">{currentStep + 1}/{steps.length}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {currentStepData.id !== 'setup' && (
        <div className="p-4 border-t border-border bg-background">
          <TouchButton
            variant="gradient"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-12"
          >
            {currentStepData.id === 'complete' ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Go to Dashboard
              </>
            ) : (
              <>
                {currentStepData.id === 'assistants' ? 'Setup Assistants' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </TouchButton>
        </div>
      )}
    </div>
  );
}