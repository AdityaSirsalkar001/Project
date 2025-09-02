import { getSupabase } from './supabaseClient.js';

const LS_PREFIX = 'prodapp:';
const DEVICE_KEY = `${LS_PREFIX}device`;

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}
}

async function trySync(key, value) {
  const supabase = getSupabase();
  if (!supabase) return;
  const device_id = getDeviceId();
  try {
    await supabase.from('app_data').upsert({ device_id, key, data: value, updated_at: new Date().toISOString() });
  } catch {}
}

export function load(key, fallback) {
  return readLocal(key, fallback);
}

export async function save(key, value) {
  writeLocal(key, value);
  trySync(key, value);
}
