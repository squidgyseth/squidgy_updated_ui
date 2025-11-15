export type BusinessType = 
  | 'ecommerce'
  | 'agency_creative'
  | 'saas_tech'
  | 'consultant_freelancer'
  | 'education'
  | 'enterprise_corporate'
  | 'other';

export type DepartmentType =
  | 'marketing'
  | 'sales'
  | 'management_strategy'
  | 'hr_people'
  | 'personal_assistant'
  | 'customer_support'
  | 'finance'
  | 'product_dev';

export type AvatarStyle = 
  | 'professional'
  | 'friendly'
  | 'corporate'
  | 'creative';

export type CommunicationTone =
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'formal';

export interface BusinessTypeOption {
  id: BusinessType;
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
}

export interface DepartmentOption {
  id: DepartmentType;
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  isRecommended?: boolean;
  isPopular?: boolean;
}

export interface AssistantCapability {
  name: string;
  description?: string;
}

export interface AssistantOption {
  id: string;
  name: string;
  department: DepartmentType;
  description: string;
  icon: string;
  iconColor?: string;
  isRecommended?: boolean;
  isPopular?: boolean;
  keyCapabilities: AssistantCapability[];
  agentConfig?: string | null; // Link to actual agent config file
}

export interface AssistantPersonalization {
  assistantId: string;
  customName?: string;
  avatarStyle: AvatarStyle;
  communicationTone: CommunicationTone;
}

export interface CompanyDetails {
  companyName: string;
  website?: string;
  specialty?: string;
  teamSize?: string;
  primaryLocation?: string;
  phoneNumber?: string;
  description?: string;
}

export interface OnboardingState {
  currentStep: number;
  businessType?: BusinessType;
  selectedDepartments: DepartmentType[];
  selectedAssistants: string[];
  personalizations: AssistantPersonalization[];
  companyDetails: CompanyDetails;
  userName: string;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}