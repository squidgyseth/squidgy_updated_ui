import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
}

export const supabase = createClient(supabaseUrl, supabaseKey);
