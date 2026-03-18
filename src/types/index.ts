export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  admin_email?: string;
  settings: CompanySettings;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  approval_limits: {
    manager_max: number;
    director_max: number;
    ceo_max: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    slack?: string;
  };
}

export interface Role {
  id: string;
  name: 'platform_admin' | 'company_admin' | 'manager' | 'employee';
  permissions: string[];
}

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  input_schema: SchemaField[];
  start_step_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'date' | 'file';
  required: boolean;
  allowedValues?: string[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  step_type: 'task' | 'approval' | 'notification' | 'webhook';
  step_order: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StepRule {
  id: string;
  step_id: string;
  condition: string;
  next_step_id?: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}



export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_version: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  data: Record<string, any>;
  logs: any[];
  current_step_id?: string;
  retries: number;
  triggered_by?: string;
  started_at: string;
  ended_at?: string;
}

export interface Approval {
  id: string;
  execution_id?: string;
  approver_id: string;
  node_id?: string;
  node_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'forwarded';
  comments?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  // UI-only fields (or returned via joins)
  workflowName?: string;
  stepName?: string;
  requestedBy?: string;
  date?: string;
  amount?: number;
}

export interface ApprovalAction {
  id: string;
  approval_id: string;
  action: 'approve' | 'reject' | 'forward';
  comments?: string;
  performed_by: string;
  performed_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// End of types