import { createClient } from '@supabase/supabase-js';

// Support both Vite and Next.js/Create React App environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing in frontend env. Uploads may fail.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
