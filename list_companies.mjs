
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCompanies() {
    console.log('Listing all companies...');
    const { data, error } = await supabase
        .from('companies')
        .select('id, name, status');

    if (error) {
        console.error('Error fetching companies:', error);
    } else {
        console.log('Companies found:', JSON.stringify(data, null, 2));
    }
}

listCompanies();
