import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseService: SupabaseClient | null = null;
let _supabaseAnon: SupabaseClient | null = null;

/**
 * Service-role client — bypasses RLS. Use only for admin operations
 * that require unrestricted access (e.g. user management, storage ops).
 */
export function getSupabase(): SupabaseClient {
  if (_supabaseService) return _supabaseService;

  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (!url || !key || url.includes('your-project')) {
    console.error('[db] FATAL: Missing or invalid Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  _supabaseService = createClient(url, key);
  console.log('[db] Supabase service-role client initialized:', url);
  return _supabaseService;
}

/**
 * Anon-key client — respects Row Level Security policies.
 * Use for regular data operations where RLS should apply.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (_supabaseAnon) return _supabaseAnon;

  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key || url.includes('your-project')) {
    console.error('[db] FATAL: Missing or invalid Supabase credentials.');
    process.exit(1);
  }

  _supabaseAnon = createClient(url, key);
  return _supabaseAnon;
}

// Convenience alias — lazy-evaluated so dotenv has time to load
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  }
});

// ── Key Mapping ──────────────────────────────────────────────────────────────

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

// ── Error Formatting ─────────────────────────────────────────────────────────

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

// ── Connection Health ────────────────────────────────────────────────────────

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_profiles').select('email').limit(1);
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

// ── Notes Content Helpers ────────────────────────────────────────────────────
// Notes content can be either:
//   - A plain string (legacy, backward-compatible)
//   - A JSON object: { blocks: [{ type: 'text', text: '...' }, { type: 'image', url: '...', alt: '...' }] }

export interface NoteTextBlock {
  type: 'text';
  text: string;
}

export interface NoteImageBlock {
  type: 'image';
  url: string;
  alt?: string;
}

export type NoteBlock = NoteTextBlock | NoteImageBlock;

export interface NoteContent {
  blocks: NoteBlock[];
}

/** Normalize any note content format into a NoteContent object */
export function normalizeNoteContent(content: any): NoteContent {
  if (!content) return { blocks: [] };

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.blocks)) return parsed;
    } catch {
      // Plain text string
    }
    return content.trim()
      ? { blocks: [{ type: 'text', text: content }] }
      : { blocks: [] };
  }

  if (Array.isArray(content.blocks)) return content;
  if (Array.isArray(content)) return { blocks: content };
  return { blocks: [] };
}

/** Extract plain text from NoteContent (for search, export, etc.) */
export function extractPlainText(content: NoteContent): string {
  return content.blocks
    .filter((b): b is NoteTextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');
}

/** Serialize NoteContent to a string for storage */
export function serializeNoteContent(content: NoteContent): string {
  return JSON.stringify(content);
}
