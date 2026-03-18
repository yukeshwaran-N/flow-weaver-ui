-- SQL Repair for Flow Weaver
-- Run this in your Supabase SQL Editor to fix missing column errors.

-- 1. Ensure workflows table has the required columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflows' AND column_name='user_id') THEN
        ALTER TABLE public.workflows ADD COLUMN user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflows' AND column_name='company_id') THEN
        ALTER TABLE public.workflows ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure workflow_steps table has the required columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='user_id') THEN
        ALTER TABLE public.workflow_steps ADD COLUMN user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='company_id') THEN
        ALTER TABLE public.workflow_steps ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
    
    -- Ensure step_rules table has priority if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='step_rules' AND column_name='priority') THEN
        ALTER TABLE public.step_rules ADD COLUMN priority INTEGER DEFAULT 1;
    END IF;
END $$;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
