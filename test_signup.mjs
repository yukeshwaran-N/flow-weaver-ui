import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testSignup() {
    const email = `test_${Math.random().toString(36).slice(2)}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Testing signup for ${email}...`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Runner'
            }
        }
    });

    if (error) {
        console.error('❌ Signup failed:', error.message);
        console.error('   Status:', error.status);
    } else {
        console.log('✅ Signup successful!', data.user?.id);
    }
}

testSignup();
