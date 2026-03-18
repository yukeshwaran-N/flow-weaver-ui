import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testLogin(email, password) {
    console.log(`Testing login for ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login failed:', error.message);
        console.error('   Error detail:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Login successful!', data.user?.id);
        console.log('   User metadata:', data.user?.user_metadata);
    }
}

// Check if we have arguments or use a default
const email = process.argv[2] || 'ajaykannanesec@gmail.com';
const password = process.argv[3] || 'Password123!'; // Assuming a default for test

testLogin(email, password);
