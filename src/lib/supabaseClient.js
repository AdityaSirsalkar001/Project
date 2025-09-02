import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;
if (typeof url === 'string' && url && typeof key === 'string' && key) {
  try {
    client = createClient(url, key, { auth: { persistSession: true } });
  } catch (e) {
    client = null;
  }
}

export function getSupabase() {
  return client;
}
