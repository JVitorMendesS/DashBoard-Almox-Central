import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ehwudjslpezjoxgsxjdc.supabase.co';
const supabaseAnonKey = 'sb_publishable_O-AAgIS-Fj1VVDNS9G9TNw_6GSc4dWO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
