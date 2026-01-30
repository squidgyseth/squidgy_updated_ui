import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Bot, MessageSquare, Zap, Check } from 'lucide-react';
import { TouchButton } from '../layout/TouchButton';
import { MobileCard } from '../layout/MobileCard';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { cn } from '../../../lib/utils';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'business' | 'marketing' | 'support' | 'personal';
  features: string[];
  color: string;
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'Generate leads, follow up with prospects, and close deals',
    icon: '💼',
    category: 'business',
    features: ['Lead qualification', 'Follow-up automation', 'CRM integration'],
    color: 'bg-blue-500'
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Create engaging social media posts and marketing content',
    icon: '🎨',
    category: 'marketing',
    features: ['Social media posts', 'Blog articles', 'Ad copy'],
    color: 'bg-purple-500'
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Handle customer inquiries and provide instant support',
    icon: '🎧',
    category: 'support',
    features: ['24/7 availability', 'FAQ handling', 'Ticket routing'],
    color: 'bg-green-500'
  },
  {
    id: 'newsletter-writer',
    name: 'Newsletter Writer',
    description: 'Create compelling newsletters that engage your audience',
    icon: '📧',
    category: 'marketing',
    features: ['Content curation', 'Email templates', 'Audience insights'],
    color: 'bg-orange-500'
  },
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    description: 'Manage tasks, schedule meetings, and organize your day',
    icon: '🗓️',
    category: 'personal',
    features: ['Calendar management', 'Task tracking', 'Reminders'],
    color: 'bg-pink-500'
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Create a completely custom agent for your specific needs',
    icon: '⚙️',
    category: 'business',
    features: ['Full customization', 'Your own prompts', 'Unique workflow'],
    color: 'bg-gray-500'
  }
];

interface MobileCreateAgentProps {
  onBack?: () => void;
  onAgentCreated?: (agent: any) => void;
}

export function MobileCreateAgent({ onBack, onAgentCreated }: MobileCreateAgentProps) {
  const [step, setStep] = useState<'templates' | 'customize' | 'creating'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const navigate = useNavigate();

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentName(template.name);
    setAgentDescription(template.description);
    setStep('customize');
  };

  const handleCreateAgent = async () => {
    if (!selectedTemplate || !agentName.trim()) return;

    setStep('creating');
    
    // Simulate agent creation
    setTimeout(() => {
      const newAgent = {
        id: `agent-${Date.now()}`,
        name: agentName,
        description: agentDescription,
        template: selectedTemplate.id,
        instructions: agentInstructions,
        created: new Date().toISOString()
      };

      if (onAgentCreated) {
        onAgentCreated(newAgent);
      }

      // Navigate back to chats
      navigate('/chats');
    }, 2000);
  };

  const handleBack = () => {
    if (step === 'customize') {
      setStep('templates');
    } else if (onBack) {
      onBack();
    } else {
      navigate('/chats');
    }
  };

  if (step === 'creating') {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Creating Your Agent</h2>
          <p className="text-muted-foreground mb-8">
            We're setting up {agentName} with all the features you need...
          </p>
          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'customize') {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 bg-background border-b border-border">
          <div className="flex items-center justify-between">
            <TouchButton
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </TouchButton>
            <h1 className="text-lg font-semibold text-foreground">Customize Agent</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Selected Template */}
          <MobileCard className="p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', selectedTemplate?.color)}>
                <span className="text-xl">{selectedTemplate?.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedTemplate?.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTemplate?.features.map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md"
                >
                  {feature}
                </span>
              ))}
            </div>
          </MobileCard>

          {/* Agent Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Agent Name
              </label>
              <Input
                placeholder="Enter agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description
              </label>
              <Textarea
                placeholder="Describe what this agent does"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Special Instructions (Optional)
              </label>
              <Textarea
                placeholder="Any specific instructions or personality traits"
                value={agentInstructions}
                onChange={(e) => setAgentInstructions(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background">
          <TouchButton
            variant="gradient"
            size="lg"
            onClick={handleCreateAgent}
            disabled={!agentName.trim()}
            className="w-full h-12"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Agent
          </TouchButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between">
          <TouchButton
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </TouchButton>
          <h1 className="text-lg font-semibold text-foreground">Create New Agent</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Choose Your Agent Type</h2>
            <p className="text-muted-foreground">
              Select a template to get started, or create a custom agent from scratch
            </p>
          </div>

          <div className="space-y-3">
            {agentTemplates.map((template) => (
              <MobileCard
                key={template.id}
                variant="interactive"
                onClick={() => handleTemplateSelect(template)}
                className="p-4 border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0', template.color)}>
                    <span className="text-xl">{template.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.features.slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                      {template.features.length > 2 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{template.features.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 border-2 border-muted rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
