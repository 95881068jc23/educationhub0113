import { createClient } from '@supabase/supabase-js';

// Support both Vite and Next.js/Create React App environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing in frontend env. Uploads may fail.');
}

// 当 supabaseUrl 为空时，使用占位符防止应用崩溃
// 注意：这只是为了让 UI 能加载出来，实际数据请求仍会失败，直到配置正确的环境变量
const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validKey = supabaseKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
