
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
    console.log('Listing all users and roles...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, subscription_tier, is_premium, company_users(role, companies(name))');

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users found:', JSON.stringify(data, null, 2));
    }
}

listAllUsers();
