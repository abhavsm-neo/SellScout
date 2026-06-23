export interface Playbook {
  id: string;
  name: string;
  color: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  description: string;
  updatedAt: string;
  templateCount: number;
  campaignCount: number;
  productName?: string;
  tagline?: string;
  website?: string;
  category?: string;
  valuePropositions?: string[];
  icpTitle?: string;
  companySizes?: string[];
  industries?: string[];
  painPoints?: string[];
  keyFeatures?: Array<{ name: string; description: string }>;
  pricing?: string;
  competitors?: string[];
  differentiator?: string;
  tone?: string;
  maxLength?: number;
  includeCTA?: boolean;
  ctaText?: string;
  signature?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sent: number | null;
  replyRate: number | null;
  openRate: number | null;
  meetings: number | null;
  createdAt: string;
  playbookName: string;
  lastSent?: string;
}

export interface SequenceStep {
  id: string;
  day: number;
  type: 'email' | 'linkedin';
  subject: string;
  body: string;
  label: string;
}

export interface CampaignSettings {
  sendWindowStart: string;
  sendWindowEnd: string;
  timezone: string;
  dailyLimit: number;
  trackOpens: boolean;
  trackClicks: boolean;
  includeUnsubscribe: boolean;
  unsubscribeText: string;
}

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  linkedin?: string;
  industry?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'open' | 'click' | 'reply' | 'bounce';
  prospectName: string;
  company: string;
  campaignName: string;
  timeAgo: string;
}

export interface Insight {
  id: string;
  type: 'opportunity' | 'optimization' | 'trend' | 'warning';
  icon: string;
  title: string;
  description: string;
  action: string;
}

export interface PricingFeature {
  name: string;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

export interface PricingCategory {
  name: string;
  features: PricingFeature[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
