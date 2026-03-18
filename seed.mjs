/**
 * Flow Weaver – Sample Workflow Seeder
 * Signs in as your user → auto-detects company → seeds "Expense Approval" workflow.
 *
 * Usage:
 *   node seed.mjs <email> <password>
 *
 * Example:
 *   node seed.mjs admin@skillbridge.com MyPassword123
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function seed() {
    console.log('\n Flow Weaver Sample Workflow Seeder\n');

    // ── Authenticate ────────────────────────────────────────────
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Usage: node seed.mjs <email> <password>');
        console.error('Example: node seed.mjs admin@company.com MyPassword123');
        process.exit(1);
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
        console.error('Login failed:', authError?.message);
        process.exit(1);
    }
    console.log('Logged in as:', authData.user.email);

    // ── Get Company ─────────────────────────────────────────────
    const { data: companyUser, error: cuError } = await supabase
        .from('company_users')
        .select('company_id, companies(id, name)')
        .eq('user_id', authData.user.id)
        .single();

    if (cuError || !companyUser) {
        console.error('Could not find company for this user:', cuError?.message);
        process.exit(1);
    }

    const companyId = (companyUser as any).company_id;
    const companyName = (companyUser as any).companies?.name || companyId;
    console.log(`Company: "${companyName}" (${companyId})\n`);

    const newId = () => crypto.randomUUID();

    // ── 1. Create Workflow ──────────────────────────────────────
    const { data: workflow, error: wfError } = await supabase
        .from('workflows')
        .insert({
            name: 'Expense Approval',
            description: 'Multi-step expense approval: Manager → Finance Notification → CEO → Rejection',
            company_id: companyId,
            version: 1,
            is_active: true,
            input_schema: [
                { id: newId(), name: 'amount', type: 'number', required: true },
                { id: newId(), name: 'country', type: 'string', required: true },
                { id: newId(), name: 'department', type: 'string', required: false },
                { id: newId(), name: 'priority', type: 'select', required: true, allowedValues: ['High', 'Medium', 'Low'] }
            ],
        })
        .select('id')
        .single();

    if (wfError) { console.error('Workflow creation failed:', wfError.message); process.exit(1); }
    console.log('Workflow created:', workflow.id);

    // ── 2. Create Steps ─────────────────────────────────────────
    const stepDefs = [
        { name: 'Manager Approval', step_type: 'approval', step_order: 1, metadata: { assignee_email: 'manager@example.com', instructions: 'Review and approve the expense request.' } },
        { name: 'Finance Notification', step_type: 'notification', step_order: 2, metadata: { assignee_email: 'finance@example.com', subject: 'High-value Expense Approved', body: 'A high-value expense has been approved. Please review.' } },
        { name: 'CEO Approval', step_type: 'approval', step_order: 3, metadata: { assignee_email: 'ceo@example.com', instructions: 'Final CEO sign-off.' } },
        { name: 'Task Rejection', step_type: 'task', step_order: 4, metadata: { action: 'reject', reason: 'Does not meet approval criteria.' } },
    ];

    const { data: steps, error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepDefs.map(s => ({ ...s, workflow_id: workflow.id, company_id: companyId })))
        .select('id, name, step_order');

    if (stepsError) { console.error('Steps creation failed:', stepsError.message); process.exit(1); }

    const byName = Object.fromEntries(steps.map((s: any) => [s.name, s.id]));
    console.log('Steps created:', steps.map((s: any) => s.name).join(', '));

    // ── 3. Set start_step_id ────────────────────────────────────
    await supabase.from('workflows')
        .update({ start_step_id: byName['Manager Approval'] })
        .eq('id', workflow.id);

    // ── 4. Add Rules ────────────────────────────────────────────
    const rules = [
        { step_id: byName['Manager Approval'], condition: "amount > 100 && country == 'US' && priority == 'High'", next_step_id: byName['Finance Notification'], priority: 1 },
        { step_id: byName['Manager Approval'], condition: "amount <= 100 || department == 'HR'", next_step_id: byName['CEO Approval'], priority: 2 },
        { step_id: byName['Manager Approval'], condition: "priority == 'Low' && country != 'US'", next_step_id: byName['Task Rejection'], priority: 3 },
        { step_id: byName['Manager Approval'], condition: 'DEFAULT', next_step_id: byName['Task Rejection'], priority: 999 },
    ];

    const { error: rulesError } = await supabase.from('step_rules').insert(rules);
    if (rulesError) { console.error('Rules creation failed:', rulesError.message); process.exit(1); }
    console.log('Rules created: 4 rules for "Manager Approval"');

    console.log('\nSeed complete!');
    console.log('  Workflow ID:', workflow.id);
    console.log('  Go to /workflows in the app to see "Expense Approval"\n');
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
