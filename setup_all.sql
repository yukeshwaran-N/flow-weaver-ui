-- 1. Ensure Workflows Table has correct columns
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Ensure Workflow Steps Table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('task', 'approval', 'notification')),
    step_order INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force add missing columns to workflow_steps if it already existed
ALTER TABLE IF EXISTS public.workflow_steps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
ALTER TABLE IF EXISTS public.workflow_steps ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 3. Ensure Step Rules Table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.step_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    next_step_id UUID REFERENCES public.workflow_steps(id),
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force add missing columns to step_rules if it already existed
ALTER TABLE IF EXISTS public.step_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- 4. Ensure Workflow Executions Table exists
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    workflow_version INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'canceled')),
    data JSONB DEFAULT '{}'::JSONB,
    logs JSONB DEFAULT '[]'::JSONB,
    current_step_id UUID REFERENCES public.workflow_steps(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Force Supabase to refresh its cache (VERY IMPORTANT)
NOTIFY pgrst, 'reload schema';
