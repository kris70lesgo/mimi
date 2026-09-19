import {createClient} from '@supabase/supabase-js';

const env=(import.meta as ImportMeta & {env?:Record<string,string|undefined>}).env;
const url=env?.VITE_SUPABASE_URL;
const publishableKey=env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase=url&&publishableKey?createClient(url,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const isSupabaseConfigured=Boolean(supabase);
