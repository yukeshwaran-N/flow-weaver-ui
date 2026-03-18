-- Multi-Tenant SaaS Expense Approval Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies Table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, rejected
    subscription_tier VARCHAR(50), -- starter, business, enterprise
    admin_email VARCHAR(255),
    employee_count INTEGER,
    onboarding_questions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table (Extension of Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    notifications JSONB DEFAULT '{"workflow_completed": true, "execution_failures": true, "pending_approvals": true, "system_updates": false}'::JSONB,
    must_change_password BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'employee',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE -- 'platform_admin', 'company_admin', 'manager', 'employee'
);

-- Insert default roles
INSERT INTO public.roles (name) VALUES 
('platform_admin'), 
('company_admin'), 
('manager'), 
('employee')
ON CONFLICT (name) DO NOTHING;

-- 4. Company Users Table (Junction table linking users to companies)
CREATE TABLE public.company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- Storing role name directly for simplicity in app
    manager_id UUID REFERENCES public.profiles(id), -- Reporting line
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- 5. Generic Workflows Table
CREATE TABLE public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    input_schema JSONB DEFAULT '{}'::JSONB,
    start_step_id UUID, -- Will be set after steps are created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Workflow Steps Table
CREATE TABLE public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('task', 'approval', 'notification')),
    step_order INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Step Rules Table
CREATE TABLE public.step_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    condition TEXT NOT NULL, -- e.g. "amount > 100 && country == 'US'" OR "DEFAULT"
    next_step_id UUID REFERENCES public.workflow_steps(id), -- Null means workflow ends
    priority INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Workflow Executions Table
CREATE TABLE public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    workflow_version INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'canceled')),
    data JSONB DEFAULT '{}'::JSONB,
    logs JSONB DEFAULT '[]'::JSONB,
    current_step_id UUID REFERENCES public.workflow_steps(id),
    retries INTEGER DEFAULT 0,
    triggered_by UUID REFERENCES public.profiles(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 9. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), 
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. System Settings Table (Global configuration)
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('execution_limits', '{"max_concurrent": 10, "default_timeout": 300, "retry_attempts": 3}'::JSONB, 'Global execution limits and timeouts')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Companies Policies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.user_id = auth.uid() AND cu.company_id = public.companies.id
        )
    );

CREATE POLICY "Company admins can update their company" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.user_id = auth.uid() AND cu.company_id = public.companies.id AND cu.role = 'company_admin'
        )
    );

-- System Settings Policies
CREATE POLICY "Anyone can view system settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Platform admins can manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_users 
            WHERE user_id = auth.uid() AND role = 'platform_admin'
        )
    );

-- Workflow Policies
CREATE POLICY "Users can view their workflows" ON public.workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.user_id = auth.uid() AND cu.company_id = public.workflows.company_id
        )
    );

CREATE POLICY "Company admins can manage workflows" ON public.workflows
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.user_id = auth.uid() AND cu.company_id = public.workflows.company_id AND cu.role = 'company_admin'
        )
    );

CREATE POLICY "Users can manage their own workflows" ON public.workflows
    FOR ALL USING (auth.uid() = user_id);

-- Step Policies
CREATE POLICY "Users can view workflow steps" ON public.workflow_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE w.id = public.workflow_steps.workflow_id AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Company admins can manage steps" ON public.workflow_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE w.id = public.workflow_steps.workflow_id AND cu.user_id = auth.uid() AND cu.role = 'company_admin'
        )
    );

-- Rule Policies
CREATE POLICY "Users can view step rules" ON public.step_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflow_steps ws
            JOIN public.workflows w ON w.id = ws.workflow_id
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE ws.id = public.step_rules.step_id AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Company admins can manage rules" ON public.step_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workflow_steps ws
            JOIN public.workflows w ON w.id = ws.workflow_id
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE ws.id = public.step_rules.step_id AND cu.user_id = auth.uid() AND cu.role = 'company_admin'
        )
    );

-- Execution Policies
CREATE POLICY "Users can view executions in their company" ON public.workflow_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE w.id = public.workflow_executions.workflow_id AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert executions" ON public.workflow_executions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE w.id = public.workflow_executions.workflow_id AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "System can update executions" ON public.workflow_executions
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.company_users cu ON cu.company_id = w.company_id
            WHERE w.id = public.workflow_executions.workflow_id AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own executions" ON public.workflow_executions
    FOR ALL USING (auth.uid() = user_id);

-- Insert trigger to automatically create user profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    v_full_name := new.raw_user_meta_data->>'full_name';
    IF v_full_name IS NULL THEN
        v_full_name := split_part(new.email, '@', 1);
    END IF;

    -- 1. Create the base profile in 'profiles' table
    INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
    VALUES (new.id, new.email, v_full_name, 'employee', 'free');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Setup Storage for Receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Note: These policies allow authenticated users to upload and view receipts.
-- In a production environment, you should restrict access further based on company_id.

CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated selects" ON storage.objects
    FOR SELECT USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- 11. Backend Rule Evaluator Engine (Supabase RPC)
-- Evaluates a step's rules dynamically against JSON input.
CREATE OR REPLACE FUNCTION public.evaluate_step_rules(p_step_id UUID, p_input_data JSONB)
RETURNS JSONB AS $$
DECLARE
    r RECORD;
    condition_matched BOOLEAN;
    evaluations JSONB := '[]'::JSONB;
    v_condition TEXT;
    v_next_step_id UUID := NULL;
    v_key TEXT;
    v_test_query TEXT;
BEGIN
    -- Loop through rules ordered by priority
    FOR r IN SELECT * FROM public.step_rules WHERE step_id = p_step_id ORDER BY priority ASC
    LOOP
        v_condition := r.condition;

        -- Handle DEFAULT case
        IF v_condition = 'DEFAULT' THEN
            v_next_step_id := r.next_step_id;
            evaluations := evaluations || jsonb_build_object('condition', 'DEFAULT', 'result', true);
            EXIT;
        END IF;

        -- Basic syntax normalization
        v_condition := replace(v_condition, '&&', ' AND ');
        v_condition := replace(v_condition, '||', ' OR ');
        v_condition := replace(v_condition, '==', ' = ');

        -- Handle string functions: contains, startsWith, endsWith
        v_condition := regexp_replace(v_condition, 'startsWith\((\w+),\s*''([^'']+)''\)', '(\1 LIKE ''\2%'')', 'gi');
        v_condition := regexp_replace(v_condition, 'endsWith\((\w+),\s*''([^'']+)''\)', '(\1 LIKE ''%\2'')', 'gi');
        v_condition := regexp_replace(v_condition, 'contains\((\w+),\s*''([^'']+)''\)', '(\1 LIKE ''%\2%'')', 'gi');

        -- Inject input data as local variables in a CTE for evaluation
        -- Construct a query like: WITH data AS (SELECT 'val1' as field1, 100 as field2) SELECT field1 > 50 FROM data;
        
        v_test_query := 'WITH data AS (SELECT ';
        FOR v_key IN SELECT jsonb_object_keys(p_input_data)
        LOOP
            IF jsonb_typeof(p_input_data->v_key) = 'number' THEN
                v_test_query := v_test_query || format('%L::numeric AS %I, ', p_input_data->>v_key, v_key);
            ELSIF jsonb_typeof(p_input_data->v_key) = 'boolean' THEN
                v_test_query := v_test_query || format('%L::boolean AS %I, ', p_input_data->>v_key, v_key);
            ELSE
                v_test_query := v_test_query || format('%L::text AS %I, ', p_input_data->>v_key, v_key);
            END IF;
        END LOOP;
        
        -- Trim trailing comma and close CTE
        v_test_query := rtrim(v_test_query, ', ') || ') SELECT COALESCE((' || v_condition || '), false) FROM data';

        BEGIN
            EXECUTE v_test_query INTO condition_matched;
        EXCEPTION WHEN OTHERS THEN
            condition_matched := false;
        END;

        evaluations := evaluations || jsonb_build_object('condition', r.condition, 'result', condition_matched);
        
        IF condition_matched THEN
            v_next_step_id := r.next_step_id;
            EXIT;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'next_step_id', v_next_step_id,
        'evaluations', evaluations
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

