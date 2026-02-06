import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
}

export const supabase = createClient(supabaseUrl, supabaseKey);
