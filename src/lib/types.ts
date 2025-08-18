export interface Profile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  job_title?: string
  phone?: string
  avatar_url?: string
  is_admin: boolean
  is_verified: boolean
  subscription_tier: string
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  industry?: string
  size?: string
  website?: string
  description?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  created_at: string
}

export interface Proposal {
  id: string
  title: string
  description?: string
  content: any
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'archived'
  user_id: string
  company_id?: string
  client_name?: string
  client_email?: string
  client_company?: string
  value?: number
  currency: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface ProposalTemplate {
  id: string
  name: string
  description?: string
  content: any
  category?: string
  is_public: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  title: string
  description?: string
  company_id: string
  user_id: string
  status: 'open' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  value?: number
  currency: string
  due_date?: string
  source?: string
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  user_id: string
  company_id?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  meeting_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DemoRequest {
  id: string
  name: string
  email: string
  company_name?: string
  phone?: string
  message?: string
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
  assigned_to?: string
  scheduled_at?: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface SignupForm {
  email: string
  password: string
  full_name: string
  company_name?: string
}

export interface ProfileUpdateForm {
  full_name?: string
  company_name?: string
  job_title?: string
  phone?: string
  avatar_url?: string
}

export interface ProposalForm {
  title: string
  description?: string
  content: any
  client_name?: string
  client_email?: string
  client_company?: string
  value?: number
  currency?: string
  due_date?: string
}

export interface OpportunityForm {
  title: string
  description?: string
  company_id: string
  status?: string
  value?: number
  currency?: string
  due_date?: string
  source?: string
}

export interface MeetingForm {
  title: string
  description?: string
  company_id?: string
  start_time: string
  end_time: string
  meeting_url?: string
  notes?: string
}

export interface DemoRequestForm {
  name: string
  email: string
  company_name?: string
  phone?: string
  message?: string
}

// Dashboard types
export interface DashboardStats {
  totalProposals: number
  totalOpportunities: number
  totalMeetings: number
  proposalsThisMonth: number
  opportunitiesThisMonth: number
  meetingsThisMonth: number
  conversionRate: number
  totalValue: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }[]
}

// Auth types
export interface AuthState {
  user: Profile | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  refreshUser: () => Promise<void>
}
