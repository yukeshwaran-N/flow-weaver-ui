
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listApplications() {
    console.log('Listing applications...');
    const { data, error } = await supabase
        .from('company_applications')
        .select('*');

    if (error) {
        console.error('Error fetching applications:', error);
    } else {
        console.log('Applications found:', JSON.stringify(data, null, 2));
    }
}

async function checkProfiles() {
    console.log('Checking profiles for must_change_password...');
    const { data, error } = await supabase
        .from('profiles')
        .select('email, must_change_password');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profile password flags:', JSON.stringify(data, null, 2));
    }
}

listApplications().then(() => checkProfiles());
