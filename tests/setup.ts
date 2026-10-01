import { vi, afterEach } from 'vitest';

// Mock Supabase data stores
const mockSupabaseData: Record<string, any[]> = {
  users_auth: [],
  student_profiles: [],
  notifications: [],
  student_saved_chapters: [],
  student_studied_chapters: [],
  contact_messages: [],
  student_session_history: [],
  student_daily_progress: [],
  questions: [],
  curated_notes: [],
  mock_exams: [],
  refresh_tokens: [],
  push_subscriptions: [],
  user_analytics: [],
  payment_requests: [],
  question_versions: [],
  quiz_entries: [],
  past_exam_entries: [],
};

function resetMocks() {
  for (const key of Object.keys(mockSupabaseData)) {
    mockSupabaseData[key] = [];
  }
  mockSupabaseFailures.upsertError = null;
}

// One-shot error injection for upsert (simulates PostgREST schema errors
// such as a column missing from the database).
export const mockSupabaseFailures: { upsertError: { message: string; code: string } | null } = {
  upsertError: null,
};

afterEach(() => {
  resetMocks();
});

// Helper to execute a query against mock data
function executeQuery(table: string, opts: any) {
  let data = [...(mockSupabaseData[table] || [])];

  // Apply eq filters
  for (const [col, val] of Object.entries(opts.filters || {})) {
    data = data.filter((r: any) => r[col] === val);
  }

  // Apply or filter
  if (opts.orFilter) {
    const parts = opts.orFilter.split(',');
    data = data.filter((row: any) => {
      return parts.some((part: string) => {
        const match = part.trim().match(/(\w+)\.eq\.(.+)/);
        if (match) {
          const [, col, val] = match;
          return String(row[col]) === val.replace(/'/g, '');
        }
        return false;
      });
    });
  }

  // Apply ordering
  if (opts.orderField) {
    data.sort((a: any, b: any) => {
      if (opts.orderAsc) return a[opts.orderField] > b[opts.orderField] ? 1 : -1;
      return a[opts.orderField] < b[opts.orderField] ? 1 : -1;
    });
  }

  // Apply limit
  if (opts.limitCount > 0) data = data.slice(0, opts.limitCount);

  // Return result
  if (opts.maybeSingleResult) {
    return { data: data[0] || null, error: null };
  }
  if (opts.singleResult) {
    if (data[0]) return { data: data[0], error: null };
    return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
  }
  return { data, error: null };
}

function executeUpdate(table: string, opts: any, updates: any) {
  let count = 0;
  for (const row of mockSupabaseData[table]) {
    let matches = Object.entries(opts.filters).every(([k, v]) => row[k] === v);

    if (opts.orFilter && Object.keys(opts.filters).length === 0) {
      const parts = opts.orFilter.split(',');
      matches = parts.some((part: string) => {
        const m = part.trim().match(/(\w+)\.eq\.(.+)/);
        if (m) {
          const [, col, val] = m;
          return String(row[col]) === val.replace(/'/g, '');
        }
        return false;
      });
    }

    if (matches) {
      Object.assign(row, updates);
      count++;
    }
  }
  return { data: null, error: null, count };
}

function executeDelete(table: string, opts: any) {
  const before = mockSupabaseData[table].length;
  mockSupabaseData[table] = mockSupabaseData[table].filter((row: any) => {
    return !Object.entries(opts.filters).every(([k, v]) => row[k] === v);
  });
  return { data: null, error: null, count: before - mockSupabaseData[table].length };
}

function createMockQuery(table: string) {
  const opts: any = {
    filters: {},
    orFilter: '',
    orderField: '',
    orderAsc: true,
    limitCount: 0,
    singleResult: false,
    maybeSingleResult: false,
  };

  const chainable: any = {};

  chainable.select = (_fields?: string) => chainable;
  chainable.eq = (col: string, val: any) => { opts.filters[col] = val; return chainable; };
  chainable.neq = (col: string, val: any) => { opts.filters[`neq:${col}`] = val; return chainable; };
  chainable.or = (clause: string) => { opts.orFilter = clause; return chainable; };
  chainable.order = (field: string, _desc?: any) => { opts.orderField = field; opts.orderAsc = _desc?.ascending ?? true; return chainable; };
  chainable.limit = (n: number) => { opts.limitCount = n; return chainable; };
  chainable.single = () => { opts.singleResult = true; return chainable; };
  chainable.maybeSingle = () => { opts.maybeSingleResult = true; return chainable; };

  chainable.insert = async (rows: any[]) => {
    for (const row of rows) {
      mockSupabaseData[table].push(row);
    }
    return { data: rows, error: null };
  };

  chainable.upsert = async (rows: any[], upsertOpts?: any) => {
    if (mockSupabaseFailures.upsertError) {
      const error = mockSupabaseFailures.upsertError;
      mockSupabaseFailures.upsertError = null;
      return { data: null, error };
    }
    for (const row of rows) {
      const existingIdx = mockSupabaseData[table].findIndex((r: any) => {
        if (upsertOpts?.onConflict) {
          const cols = upsertOpts.onConflict.split(',');
          return cols.every((c: string) => r[c.trim()] === row[c.trim()]);
        }
        return r.id === row.id;
      });
      if (existingIdx >= 0) {
        mockSupabaseData[table][existingIdx] = { ...mockSupabaseData[table][existingIdx], ...row };
      } else {
        mockSupabaseData[table].push(row);
      }
    }
    return { data: rows, error: null };
  };

  chainable.update = (updates: any) => {
    chainable._updates = updates;
    chainable._op = 'update';
    // Make it thenable so `await` works, but also chainable
    chainable.then = (resolve: any, reject?: any) => {
      return Promise.resolve(executeUpdate(table, opts, updates)).then(resolve, reject);
    };
    return chainable;
  };

  chainable.delete = () => {
    chainable._op = 'delete';
    chainable.then = (resolve: any, reject?: any) => {
      return Promise.resolve(executeDelete(table, opts)).then(resolve, reject);
    };
    return chainable;
  };

  // Make chainable thenable so `await supabase.from('x').select('*').eq(...)` works
  chainable.then = (resolve: any, reject?: any) => {
    return Promise.resolve(executeQuery(table, opts)).then(resolve, reject);
  };

  return chainable;
}

const mockSupabase = {
  from: (table: string) => createMockQuery(table),
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: 'test/file.jpg' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      createSignedUrl: async (path: string) => ({
        data: { signedUrl: `https://example.com/signed/${path}` },
        error: null,
      }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
};

// Set env vars before importing modules
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-signing-1234567890abcdef';
process.env.ADMIN_EMAILS = 'admin@test.com';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Disable rate limiters in test environment
vi.mock('express-rate-limit', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}));

function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)] = value;
  }
  return result;
}

function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] = value;
  }
  return result;
}

// Mock the db module
vi.mock('../server/db', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
  getSupabase: () => mockSupabase,
  formatSupabaseError: (err: any) => err?.message || 'Database error',
  camelToSnake,
  snakeToCamel,
}));

// Mock the seed module to prevent DB calls during test startup
vi.mock('../server/seed', () => ({
  seedAllData: async () => {},
}));

export { mockSupabase, mockSupabaseData };
