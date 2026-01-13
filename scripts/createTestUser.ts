import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOrResetTestUser() {
  const testEmail = 'test@dnmz.nl';
  const testPassword = 'Test123!';

  console.log('Resetting password for test user...');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);

  try {
    // First, get the user ID from our users table
    const { data: userRecord, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', testEmail)
      .single();

    if (lookupError || !userRecord) {
      console.error('User not found in users table:', testEmail);
      console.log('Available users:');
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, naam')
        .limit(5);
      console.log(allUsers);
      process.exit(1);
    }

    console.log('Found user ID:', userRecord.id);
    console.log('Updating password...');

    // Update the password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userRecord.id,
      { password: testPassword }
    );

    if (error) {
      console.error('Error updating password:', error);
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log('\n🎉 You can now login with:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createOrResetTestUser();
