import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAnon: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Anon-key client. After migration 018 revokes privileges for the anon and
 * authenticated roles, this client is intentionally inert — the server is the
 * only privileged client and uses the service-role client below.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (_supabaseAnon) return _supabaseAnon;

  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || '').trim();

  if (!url || !key || url.includes('your-project')) {
    console.error('[db] FATAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }

  _supabaseAnon = createClient(url, key);
  console.log('[db] Supabase anon client initialized (privileges revoked by RLS hardening)');
  return _supabaseAnon;
}

/**
 * Service-role client — the single server-side client used by every route.
 * Row Level Security is enabled on all tables and the anon/authenticated roles
 * are revoked (migration 018), so the app key can no longer read or write data
 * even if it leaks. All authorization is enforced in the server code.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key || url.includes('your-project')) {
    console.error('[db] FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  _supabaseAdmin = createClient(url, key);
  console.log('[db] Supabase admin client initialized (RLS bypassed)');
  return _supabaseAdmin;
}

// Legacy export retained for compatibility — do not use for user-facing logic.
// All routes import supabaseAdmin (or getSupabaseAdmin()) instead.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAnon() as any)[prop];
  }
});

// Admin client proxy — for routes that need to bypass RLS.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  }
});

// Legacy alias — use getSupabaseAdmin() instead
export function getSupabase(): SupabaseClient {
  return getSupabaseAdmin();
}

export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)] = camelToSnake(value);
  }
  return result;
}

export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = snakeToCamel(value);
  }
  return result;
}

export function formatSupabaseError(error: any): string {
  if (!error) return 'An unknown database error occurred.';
  const msg = (error.message || '').toLowerCase();

  if (process.env.NODE_ENV !== 'production') {
    console.error('[db] Raw error:', error.message || error);
  }

  if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('econnrefused')) {
    return 'Database connection failed. Please try again later.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'Database table missing. Contact support.';
  }
  if (msg.includes('permission denied') || msg.includes('rls') || msg.includes('row level security') || msg.includes('violates row-level security')) {
    return 'Permission denied. Check RLS policies or use the service_role key.';
  }
  if (msg.includes('invalid input syntax') || (msg.includes('type') && msg.includes('does not exist'))) {
    return 'Database type mismatch. Check column types.';
  }
  return 'A database error occurred. Please try again.';
}

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('student_profiles').select('email').limit(1);
    if (!error) {
      console.log('[db] Supabase connection healthy');
      return true;
    }
    console.log('[db] Supabase responded with error:', error.message);
    return false;
  } catch {
    console.error('[db] Supabase connection failed');
    return false;
  }
}
