import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../hooks/useUser';
import { useCompanyBranding } from '../../../hooks/useCompanyBranding';
import { MobileCard } from '../layout/MobileCard';
import { TouchButton } from '../layout/TouchButton';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
  MessageSquare,
  Users,
  DollarSign,
  Activity,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor: string;
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, iconColor, onClick }: MetricCardProps) {
  return (
    <MobileCard
      variant="interactive"
      onClick={onClick}
      className="p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </MobileCard>
  );
}

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface RecentLead {
  id: string;
  name: string;
  company: string;
  value: string;
  score: number;
  avatar?: string;
}

export function MobileDashboard() {
  const { user } = useUser();
  const { companyName } = useCompanyBranding();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Follow up with Sarah Johnson', completed: false, priority: 'high' },
    { id: '2', title: 'Prepare quote for Green Energy Co', completed: false, priority: 'medium' },
    { id: '3', title: 'Review monthly performance', completed: true, priority: 'low' },
  ]);

  const recentLeads: RecentLead[] = [
    { id: '1', name: 'Emma Williams', company: 'EcoFriendly Ltd', value: '£12,000', score: 92 },
    { id: '2', name: 'David Thompson', company: 'Residential', value: '£7,800', score: 78 },
    { id: '3', name: 'Sarah Johnson', company: 'Green Home Solutions', value: '£8,500', score: 85 },
  ];

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-500 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">{getGreeting()}, {userName}!</h1>
            <p className="text-sm opacity-90">{companyName || 'Your Dashboard'}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-white/20 text-white">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Social Posts"
            value="XX"
            subtitle="this week"
            icon={MessageSquare}
            trend={{ value: '+12.5%', isPositive: true }}
            iconColor="bg-blue-500"
          />
          <MetricCard
            title="Time Saved"
            value="XXX"
            subtitle="hours"
            icon={Clock}
            trend={{ value: '+8.2%', isPositive: true }}
            iconColor="bg-green-500"
          />
          <MetricCard
            title="Customer Satisfaction"
            value="X.X/X"
            subtitle="avg rating"
            icon={CheckCircle}
            trend={{ value: '+2.1%', isPositive: true }}
            iconColor="bg-purple-500"
          />
          <MetricCard
            title="Engagement Rate"
            value="X.X%"
            subtitle="avg"
            icon={TrendingUp}
            trend={{ value: '+2.1%', isPositive: true }}
            iconColor="bg-red-500"
          />
        </div>

        {/* Priority Tasks */}
        <MobileCard title="Priority Tasks" className="p-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => toggleTask(task.id)}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${task.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-muted-foreground hover:border-primary'
                    }`}
                >
                  {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span
                  className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                >
                  {task.title}
                </span>
                <Badge
                  variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
            <TouchButton
              variant="outline"
              size="sm"
              className="w-full mt-3"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Task
            </TouchButton>
          </div>
        </MobileCard>

        {/* Recent High-Priority Leads - Blurred */}
        <MobileCard title="High-Priority Leads" className="p-4 blur-sm pointer-events-none select-none">
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={lead.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white text-xs">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{lead.value}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{lead.score}%</span>
                  </div>
                </div>
              </div>
            ))}
            <TouchButton
              variant="ghost"
              size="sm"
              className="w-full mt-3"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              View All Leads
            </TouchButton>
          </div>
        </MobileCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4">
          <TouchButton
            variant="gradient"
            className="h-16 flex-col gap-1"
            onClick={() => navigate('/chats')}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Start Chat</span>
          </TouchButton>
        </div>

        {/* Performance Insight - Blurred */}
        <MobileCard title="This Week's Performance" className="p-4 blur-sm pointer-events-none select-none">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Revenue Goal</span>
                <span className="text-sm font-medium">£45,000 / £50,000</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Deals Closed</span>
                <span className="text-sm font-medium">12 / 15</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
          </div>
        </MobileCard>
      </div>
    </div>
  );
}