-- FINAL SCHEMA FIX (THE EXHAUSTIVE VERSION)
-- This script forces EVERY SINGLE column required by the app into your Supabase DB.
-- Run this in the SQL Editor and click RUN.

-- 1. WORKFLOWS TABLE
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS input_schema JSONB DEFAULT '[]'::JSONB;
ALTER TABLE IF EXISTS public.workflows ADD COLUMN IF NOT EXISTS start_step_id UUID;

-- 2. WORKFLOW_STEPS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('task', 'approval', 'notification', 'python')),
    step_order INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.workflow_steps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
ALTER TABLE IF EXISTS public.workflow_steps ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.workflow_steps ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- 3. STEP_RULES TABLE
CREATE TABLE IF NOT EXISTS public.step_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    next_step_id UUID REFERENCES public.workflow_steps(id),
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.step_rules ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.step_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- 4. WORKFLOW_EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    workflow_version INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'canceled', 'running')),
    data JSONB DEFAULT '{}'::JSONB,
    logs JSONB DEFAULT '[]'::JSONB,
    current_step_id UUID REFERENCES public.workflow_steps(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.workflow_executions ADD COLUMN IF NOT EXISTS current_step_id UUID REFERENCES public.workflow_steps(id);
ALTER TABLE IF EXISTS public.workflow_executions ADD COLUMN IF NOT EXISTS triggered_by UUID REFERENCES public.profiles(id);
ALTER TABLE IF EXISTS public.workflow_executions ADD COLUMN IF NOT EXISTS workflow_version INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS public.workflow_executions ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]'::JSONB;
ALTER TABLE IF EXISTS public.workflow_executions ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::JSONB;

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
