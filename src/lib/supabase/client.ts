import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
// Using Secret API Key (formerly service_role) to bypass Row Level Security (RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // In Next.js environment, we should be careful not to exit process in build time if possible,
  // but for a dedicated server/API it's acceptable.
  if (typeof window === 'undefined') {
    console.error('Missing Supabase environment variables!');
    console.error(
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local',
    );
  }
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
