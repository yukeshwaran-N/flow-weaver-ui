export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: number;
  version: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startedBy: string;
  startTime: string;
  endTime?: string;
  duration?: string;
}

export interface Approval {
  id: string;
  workflowName: string;
  stepName: string;
  requestedBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLog {
  id: string;
  executionId: string;
  workflow: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'approval' | 'notification';
  order: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  duration?: string;
}

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  allowedValues?: string[];
}

export interface Rule {
  id: string;
  priority: number;
  condition: string;
  nextStep: string;
  isDefault?: boolean;
}

export interface ExecutionLog {
  id: string;
  stepName: string;
  rulesEvaluated: string[];
  selectedNextStep: string;
  status: 'passed' | 'failed';
  timestamp: string;
}
