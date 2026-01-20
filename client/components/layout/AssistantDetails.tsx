import { useState, useEffect } from 'react';
import { ChatHistoryService, ChatSession } from '../../services/chatHistoryService';
import { AGENTS_BY_ID } from '../../data/agents';

interface AssistantDetailsProps {
  assistant: string;
  agentId?: string;
  userId?: string;
  onClose: () => void;
}

// Helper to map assistant display name to agent ID
const getAgentIdFromName = (name: string): string | null => {
  const nameToIdMap: Record<string, string> = {
    'Personal Assistant': 'personal_assistant',
    'SMM Assistant': 'smm_assistant',
    'Content Strategist': 'content_repurposer',
    'Newsletter Agent': 'newsletter',
    'Solar Sales Assistant': 'SOL',
    'Lead Generator': 'lead_generator',
    'CRM Updater': 'crm_updater',
    'Recruiter Assistant': 'recruiter_assistant',
    'Onboarding Coach': 'onboarding_coach'
  };
  return nameToIdMap[name] || null;
};

// Helper to format message for display (truncate long messages)
const formatRecentAction = (message: string): string => {
  // Remove HTML tags
  const cleanMessage = message.replace(/<[^>]*>/g, '');
  // Truncate to 80 characters
  if (cleanMessage.length > 80) {
    return cleanMessage.substring(0, 77) + '...';
  }
  return cleanMessage;
};

export default function AssistantDetails({ assistant, agentId, userId, onClose }: AssistantDetailsProps) {
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const assistantInfo = {
    "Personal Assistant": {
      name: "Personal Assistant",
      tagline: "Always Ready to Help",
      description: "Your versatile personal assistant ready to help with any task, from scheduling and organization to research and general support.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=128",
      capabilities: [
        "Task management and scheduling coordination",
        "Research and information gathering",
        "Email drafting and communication support",
        "Document organization and file management"
      ],
      defaultRecentActions: [
        "Organized calendar for next week's meetings",
        "Researched market trends for quarterly report"
      ]
    },
    "SMM Assistant": {
      name: "SMM Assistant",
      tagline: "Creative & Trendy",
      description: "Specializes in social media marketing, content creation, and trend analysis to help grow your online presence across all platforms.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/3fafe4d84436ee5ccddc3ecc353931a9bdd12b92?width=128",
      capabilities: [
        "Content creation and optimization for all major social platforms",
        "Trend analysis and hashtag research", 
        "Social media strategy development and planning",
        "Engagement optimization and community management"
      ],
      defaultRecentActions: [
        "Created 15 Instagram post ideas for fashion brand",
        "Analysed competitor performance"
      ]
    },
    "Content Strategist": {
      name: "Content Strategist",
      tagline: "Strategic & Creative",
      description: "Expert in content planning, creation, and repurposing strategies to maximize your content's reach and impact across multiple channels.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/fae0953bfe5842c25b1a321c667188d167c18abb?width=128",
      capabilities: [
        "Content calendar planning and strategy development",
        "Multi-platform content adaptation and repurposing",
        "SEO optimization and keyword research",
        "Content performance analysis and optimization"
      ],
      defaultRecentActions: [
        "Developed 3-month content calendar for tech startup",
        "Repurposed blog posts into 20 social media pieces"
      ]
    },
    "Lead Generator": {
      name: "Lead Generator",
      tagline: "Results-Driven & Efficient",
      description: "Focused on identifying, qualifying, and nurturing potential leads to boost your sales pipeline and drive business growth.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/1c1a9e476685a48c996662d5e993f34fffc24ec0?width=128",
      capabilities: [
        "Lead identification and prospecting across multiple channels",
        "Lead qualification and scoring systems",
        "Cold outreach campaign development and execution",
        "Sales funnel optimization and conversion tracking"
      ],
      defaultRecentActions: [
        "Generated 150 qualified leads for B2B software company",
        "Optimized email sequences increasing conversion by 25%"
      ]
    },
    "CRM Updater": {
      name: "CRM Updater",
      tagline: "Organized & Reliable",
      description: "Dedicated to maintaining clean, accurate, and up-to-date customer data to ensure your CRM system runs smoothly and efficiently.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/aba5f5c2e7b9e818f550225ff47becc0bcd708e2?width=128",
      capabilities: [
        "Data cleansing and duplicate removal",
        "Contact information verification and updates",
        "CRM workflow automation and optimization",
        "Data migration and system integration"
      ],
      defaultRecentActions: [
        "Cleaned and updated 5,000 customer records",
        "Automated lead scoring workflow in Salesforce"
      ]
    },
    "Recruiter Assistant": {
      name: "Recruiter Assistant",
      tagline: "People-Focused & Strategic",
      description: "Streamlines your hiring process by sourcing top talent, screening candidates, and managing recruitment workflows efficiently.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/ffe6304047504c08d7faccb66297228d39227080?width=128",
      capabilities: [
        "Candidate sourcing and talent pipeline development",
        "Resume screening and initial candidate assessment",
        "Interview scheduling and coordination",
        "Recruitment analytics and hiring process optimization"
      ],
      defaultRecentActions: [
        "Sourced 50 qualified candidates for senior developer role",
        "Streamlined interview process reducing time-to-hire by 30%"
      ]
    },
    "Onboarding Coach": {
      name: "Onboarding Coach",
      tagline: "Welcoming & Systematic",
      description: "Creates smooth onboarding experiences for new team members, ensuring they feel welcomed and quickly become productive contributors.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/46c75834fbbcdebb1b62ffbf7635f3f0a5191324?width=128",
      capabilities: [
        "Onboarding program design and implementation",
        "New hire documentation and checklist creation",
        "Training schedule coordination and progress tracking",
        "Employee feedback collection and process improvement"
      ],
      defaultRecentActions: [
        "Designed comprehensive onboarding program for remote team",
        "Reduced new hire time-to-productivity by 40%"
      ]
    }
  }[assistant];

  // Fetch real user activity from chat_history
  useEffect(() => {
    const fetchRecentActions = async () => {
      // Determine the agent ID to use
      const effectiveAgentId = agentId || getAgentIdFromName(assistant);
      
      if (!userId || !effectiveAgentId) {
        // No user or agent ID, use defaults
        if (assistantInfo?.defaultRecentActions) {
          setRecentActions(assistantInfo.defaultRecentActions);
        }
        return;
      }

      setIsLoadingActions(true);
      try {
        const chatHistoryService = ChatHistoryService.getInstance();
        const sessions = await chatHistoryService.getUserAgentSessions(userId, effectiveAgentId, 5);
        
        if (sessions.length > 0) {
          // Extract recent user messages as actions
          const actions = sessions
            .filter(session => session.last_message)
            .map(session => formatRecentAction(session.last_message))
            .slice(0, 4); // Limit to 4 recent actions
          
          if (actions.length > 0) {
            setRecentActions(actions);
          } else if (assistantInfo?.defaultRecentActions) {
            setRecentActions(assistantInfo.defaultRecentActions);
          }
        } else if (assistantInfo?.defaultRecentActions) {
          // No history, use defaults
          setRecentActions(assistantInfo.defaultRecentActions);
        }
      } catch (error) {
        console.error('Error fetching recent actions:', error);
        if (assistantInfo?.defaultRecentActions) {
          setRecentActions(assistantInfo.defaultRecentActions);
        }
      } finally {
        setIsLoadingActions(false);
      }
    };

    fetchRecentActions();
  }, [userId, agentId, assistant, assistantInfo?.defaultRecentActions]);

  if (!assistantInfo) return null;

  return (
    <div className="w-80 h-full border-l border-border-light bg-white flex flex-col">
      {/* Header */}
      <div className="relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-1 right-3 w-3 h-7 flex items-center justify-center text-text-secondary text-lg z-10"
        >
          ×
        </button>
        
        {/* Profile section */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <div className="relative mb-2">
            <img 
              src={assistantInfo.avatar}
              alt={assistantInfo.name}
              className="w-16 h-16 rounded-full"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-text-success rounded-full border-2 border-white" />
          </div>
          
          <h2 className="text-xl font-semibold text-squidgy-primary text-center leading-7 mb-2">
            {assistantInfo.name}
          </h2>
          
          <div className="px-3 py-1 bg-squidgy-primary/10 rounded-full mb-4">
            <span className="text-sm text-squidgy-primary">{assistantInfo.tagline}</span>
          </div>
          
          <p className="text-sm text-gray-600 text-center leading-5 px-6 mb-6">
            {assistantInfo.description}
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-2 px-6">
            <button className="flex-1 flex items-center justify-center gap-1 py-2.5 px-4 bg-squidgy-gradient text-white rounded-lg text-sm">
              <svg width="16" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.89667 1.33301H8.60333C8.24971 1.33301 7.91057 1.47348 7.66053 1.72353C7.41048 1.97358 7.27 2.31272 7.27 2.66634V2.78634C7.26976 3.02016 7.20804 3.2498 7.09103 3.45223C6.97401 3.65466 6.80583 3.82277 6.60333 3.93967L6.31667 4.10634C6.11398 4.22337 5.88405 4.28497 5.65 4.28497C5.41595 4.28497 5.18603 4.22337 4.98333 4.10634L4.88333 4.05301C4.57738 3.87652 4.21389 3.82864 3.87267 3.91988C3.53145 4.01112 3.24037 4.23403 3.06333 4.53967L2.91667 4.79301C2.74018 5.09896 2.6923 5.46245 2.78354 5.80367C2.87478 6.1449 3.09769 6.43597 3.40333 6.61301L3.50333 6.67967C3.70485 6.79602 3.87241 6.96307 3.98937 7.16423C4.10632 7.36539 4.1686 7.59366 4.17 7.82634V8.16634C4.17093 8.40129 4.10977 8.63231 3.9927 8.83601C3.87563 9.03972 3.70681 9.20887 3.50333 9.32634L3.40333 9.38634C3.09769 9.56338 2.87478 9.85445 2.78354 10.1957C2.6923 10.5369 2.74018 10.9004 2.91667 11.2063L3.06333 11.4597C3.24037 11.7653 3.53145 11.9882 3.87267 12.0795C4.21389 12.1707 4.57738 12.1228 4.88333 11.9463L4.98333 11.893C5.18603 11.776 5.41595 11.7144 5.65 11.7144C5.88405 11.7144 6.11398 11.776 6.31667 11.893L6.60333 12.0597C6.80583 12.1766 6.97401 12.3447 7.09103 12.5471C7.20804 12.7495 7.26976 12.9792 7.27 13.213V13.333C7.27 13.6866 7.41048 14.0258 7.66053 14.2758C7.91057 14.5259 8.24971 14.6663 8.60333 14.6663H8.89667C9.25029 14.6663 9.58943 14.5259 9.83948 14.2758C10.0895 14.0258 10.23 13.6866 10.23 13.333V13.213C10.2302 12.9792 10.292 12.7495 10.409 12.5471C10.526 12.3447 10.6942 12.1766 10.8967 12.0597L11.1833 11.893C11.386 11.776 11.616 11.7144 11.85 11.7144C12.0841 11.7144 12.314 11.776 12.5167 11.893L12.6167 11.9463C12.9226 12.1228 13.2861 12.1707 13.6273 12.0795C13.9686 11.9882 14.2596 11.7653 14.4367 11.4597L14.5833 11.1997C14.7598 10.8937 14.8077 10.5302 14.7165 10.189C14.6252 9.84779 14.4023 9.55671 14.0967 9.37967L13.9967 9.32634C13.7932 9.20887 13.6244 9.03972 13.5073 8.83601C13.3902 8.63231 13.3291 8.40129 13.33 8.16634V7.83301C13.3291 7.59806 13.3902 7.36704 13.5073 7.16334C13.6244 6.95963 13.7932 6.79048 13.9967 6.67301L14.0967 6.61301C14.4023 6.43597 14.6252 6.1449 14.7165 5.80367C14.8077 5.46245 14.7598 5.09896 14.5833 4.79301L14.4367 4.53967C14.2596 4.23403 13.9686 4.01112 13.6273 3.91988C13.2861 3.82864 12.9226 3.87652 12.6167 4.05301L12.5167 4.10634C12.314 4.22337 12.0841 4.28497 11.85 4.28497C11.616 4.28497 11.386 4.22337 11.1833 4.10634L10.8967 3.93967C10.6942 3.82277 10.526 3.65466 10.409 3.45223C10.292 3.2498 10.2302 3.02016 10.23 2.78634V2.66634C10.23 2.31272 10.0895 1.97358 9.83948 1.72353C9.58943 1.47348 9.25029 1.33301 8.89667 1.33301Z" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.75 10C9.85457 10 10.75 9.10457 10.75 8C10.75 6.89543 9.85457 6 8.75 6C7.64543 6 6.75 6.89543 6.75 8C6.75 9.10457 7.64543 10 8.75 10Z" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settings
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 py-2.5 px-4 border-2 border-squidgy-primary/60 bg-squidgy-primary/10 text-squidgy-primary rounded-lg text-sm">
              <svg width="16" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.75 11.333V14.6663" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.75016 7.17301C6.75003 7.42106 6.6807 7.66416 6.54998 7.87498C6.41925 8.08579 6.2323 8.25596 6.01016 8.36634L4.8235 8.96634C4.60135 9.07673 4.41441 9.24689 4.28368 9.4577C4.15295 9.66852 4.08363 9.91162 4.0835 10.1597V10.6663C4.0835 10.8432 4.15373 11.0127 4.27876 11.1377C4.40378 11.2628 4.57335 11.333 4.75016 11.333H12.7502C12.927 11.333 13.0965 11.2628 13.2216 11.1377C13.3466 11.0127 13.4168 10.8432 13.4168 10.6663V10.1597C13.4167 9.91162 13.3474 9.66852 13.2166 9.4577C13.0859 9.24689 12.899 9.07673 12.6768 8.96634L11.4902 8.36634C11.268 8.25596 11.0811 8.08579 10.9503 7.87498C10.8196 7.66416 10.7503 7.42106 10.7502 7.17301V4.66634C10.7502 4.48953 10.8204 4.31996 10.9454 4.19494C11.0704 4.06991 11.24 3.99967 11.4168 3.99967C11.7705 3.99967 12.1096 3.8592 12.3596 3.60915C12.6097 3.3591 12.7502 3.01996 12.7502 2.66634C12.7502 2.31272 12.6097 1.97358 12.3596 1.72353C12.1096 1.47348 11.7705 1.33301 11.4168 1.33301H6.0835C5.72987 1.33301 5.39074 1.47348 5.14069 1.72353C4.89064 1.97358 4.75016 2.31272 4.75016 2.66634C4.75016 3.01996 4.89064 3.3591 5.14069 3.60915C5.39074 3.8592 5.72987 3.99967 6.0835 3.99967C6.26031 3.99967 6.42988 4.06991 6.5549 4.19494C6.67992 4.31996 6.75016 4.48953 6.75016 4.66634V7.17301Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              To pin
            </button>
          </div>
        </div>
      </div>
      
      {/* Capabilities Section */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-1 mb-3">
          <svg width="18" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.31506 10.5C3.17313 10.5005 3.03398 10.4607 2.91377 10.3852C2.79356 10.3098 2.69723 10.2018 2.63597 10.0737C2.57471 9.94572 2.55103 9.80294 2.56768 9.66199C2.58434 9.52105 2.64064 9.38772 2.73006 9.2775L10.1551 1.6275C10.2108 1.56321 10.2867 1.51977 10.3703 1.5043C10.4539 1.48883 10.5404 1.50226 10.6154 1.54238C10.6904 1.5825 10.7495 1.64692 10.7831 1.72508C10.8166 1.80324 10.8226 1.89049 10.8001 1.9725L9.36006 6.4875C9.3176 6.60114 9.30334 6.72339 9.3185 6.84376C9.33367 6.96412 9.3778 7.07901 9.44713 7.17857C9.51645 7.27813 9.60889 7.35939 9.71651 7.41537C9.82414 7.47135 9.94374 7.50039 10.0651 7.5H15.3151C15.457 7.49952 15.5961 7.53931 15.7163 7.61477C15.8366 7.69022 15.9329 7.79823 15.9941 7.92626C16.0554 8.05428 16.0791 8.19706 16.0624 8.33801C16.0458 8.47895 15.9895 8.61228 15.9001 8.7225L8.47506 16.3725C8.41936 16.4368 8.34346 16.4802 8.25982 16.4957C8.17618 16.5112 8.08976 16.4977 8.01476 16.4576C7.93976 16.4175 7.88062 16.3531 7.84706 16.2749C7.81349 16.1968 7.8075 16.1095 7.83006 16.0275L9.27006 11.5125C9.31252 11.3989 9.32678 11.2766 9.31161 11.1562C9.29645 11.0359 9.25231 10.921 9.18299 10.8214C9.11367 10.7219 9.02123 10.6406 8.9136 10.5846C8.80597 10.5286 8.68637 10.4996 8.56506 10.5H3.31506Z" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-base font-semibold text-squidgy-primary">Capabilities</h3>
        </div>
        
        <div className="space-y-4">
          {assistantInfo.capabilities.map((capability, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-squidgy-primary rounded-full mt-2.5 flex-shrink-0" />
              <span className="text-sm text-black leading-5">{capability}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Actions Section */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-1 mb-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 4.5V9L12 10.5" stroke="#5E17EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-base font-semibold text-squidgy-primary">Recent Actions</h3>
        </div>
        
        <div className="space-y-4">
          {isLoadingActions ? (
            <div className="text-sm text-gray-500">Loading recent activity...</div>
          ) : recentActions.length > 0 ? (
            recentActions.map((action, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-squidgy-primary rounded-full mt-2.5 flex-shrink-0" />
                <span className="text-sm text-black leading-5">{action}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No recent activity yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
