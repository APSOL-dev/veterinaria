/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjqziapqtyjsxqxumgbx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Iaft7FBP4BW0vbXlYzaP-g_jtyFue87';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
