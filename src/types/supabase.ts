export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string
                    name: string
                    status: string
                    subscription_tier: string | null
                    admin_email: string | null
                    employee_count: number | null
                    onboarding_questions: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    status?: string
                    subscription_tier?: string | null
                    admin_email?: string | null
                    employee_count?: number | null
                    onboarding_questions?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    status?: string
                    subscription_tier?: string | null
                    admin_email?: string | null
                    employee_count?: number | null
                    onboarding_questions?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    first_name: string | null
                    last_name: string | null
                    full_name: string | null
                    notifications: Json
                    must_change_password: boolean
                    role: string
                    subscription_tier: string
                    is_premium: boolean
                    subscription_expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    first_name?: string | null
                    last_name?: string | null
                    full_name?: string | null
                    notifications?: Json
                    must_change_password?: boolean
                    role?: string
                    subscription_tier?: string
                    is_premium?: boolean
                    subscription_expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    first_name?: string | null
                    last_name?: string | null
                    full_name?: string | null
                    notifications?: Json
                    must_change_password?: boolean
                    role?: string
                    subscription_tier?: string
                    is_premium?: boolean
                    subscription_expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            company_users: {
                Row: {
                    id: string
                    company_id: string
                    user_id: string
                    role: string
                    manager_id: string | null
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    company_id: string
                    user_id: string
                    role: string
                    manager_id?: string | null
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string
                    user_id?: string
                    role?: string
                    manager_id?: string | null
                    status?: string
                    created_at?: string
                }
            }
            workflows: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    name: string
                    version: number
                    is_active: boolean
                    input_schema: Json
                    start_step_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    name: string
                    version?: number
                    is_active?: boolean
                    input_schema?: Json
                    start_step_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    name?: string
                    version?: number
                    is_active?: boolean
                    input_schema?: Json
                    start_step_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            workflow_steps: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    workflow_id: string
                    name: string
                    step_type: string
                    step_order: number
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    workflow_id: string
                    name: string
                    step_type: string
                    step_order: number
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    workflow_id?: string
                    name?: string
                    step_type?: string
                    step_order?: number
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            step_rules: {
                Row: {
                    id: string
                    step_id: string
                    condition: string
                    next_step_id: string | null
                    priority: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    step_id: string
                    condition: string
                    next_step_id?: string | null
                    priority: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    step_id?: string
                    condition?: string
                    next_step_id?: string | null
                    priority?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            workflow_executions: {
                Row: {
                    id: string
                    workflow_id: string
                    user_id: string | null
                    workflow_version: number
                    status: string
                    data: Json
                    logs: Json
                    current_step_id: string | null
                    retries: number
                    triggered_by: string | null
                    started_at: string
                    ended_at: string | null
                }
                Insert: {
                    id?: string
                    workflow_id: string
                    user_id?: string | null
                    workflow_version: number
                    status?: string
                    data?: Json
                    logs?: Json
                    current_step_id?: string | null
                    retries?: number
                    triggered_by?: string | null
                    started_at?: string
                    ended_at?: string | null
                }
                Update: {
                    id?: string
                    workflow_id?: string
                    user_id?: string | null
                    workflow_version?: number
                    status?: string
                    data?: Json
                    logs?: Json
                    current_step_id?: string | null
                    retries?: number
                    triggered_by?: string | null
                    started_at?: string
                    ended_at?: string | null
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    company_id: string | null
                    user_id: string | null
                    action: string
                    entity_type: string | null
                    entity_id: string | null
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    action: string
                    entity_type?: string | null
                    entity_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    user_id?: string | null
                    action?: string
                    entity_type?: string | null
                    entity_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
            }
            system_settings: {
                Row: {
                    id: string
                    key: string
                    value: Json
                    description: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: Json
                    description?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: Json
                    description?: string | null
                    updated_at?: string
                }
            }
        }
        Views: Record<string, any>
        Functions: Record<string, any>
        Enums: Record<string, any>
        CompositeTypes: Record<string, any>
    }
}
