// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
// Using Secret API Key (formerly service_role) to bypass Row Level Security (RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error(
    'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local',
  );
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
