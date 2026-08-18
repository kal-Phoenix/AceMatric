import { supabase as db, snakeToCamel, formatSupabaseError } from './db';
import sanitizeHtml from 'sanitize-html';

// Cast supabase proxy to any for proper query builder type inference
const supabase = db as any;

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'br']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
  allowedSchemes: ['https', 'http'],
};

function sanitize(html: string): string {
  return sanitizeHtml(html || '', SANITIZE_OPTS);
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizEntry {
  id: string;
  subject: string;
  grade: number;
  chapterNumber: number;
  chapterName: string;
  questions: QuizQuestion[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  version: number;
}

function makeKey(subject: string, grade: number, chapterNumber: number): string {
  return `${subject}/g${grade}/ch${chapterNumber}`;
}

function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value !== 'string') return (value ?? fallback) as T;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function mapRowToEntry(row: any): QuizEntry {
  const r = snakeToCamel(row);
  return {
    id: r.id,
    subject: r.subject,
    grade: r.grade,
    chapterNumber: r.chapterNumber,
    chapterName: r.chapterName || '',
    questions: safeJsonParse(r.questions, []),
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    version: r.version,
  };
}

export async function upsertQuiz(input: {
  id?: string;
  subject: string;
  grade: number;
  chapterNumber: number;
  chapterName?: string;
  questions?: QuizQuestion[];
  status?: 'draft' | 'published';
}): Promise<QuizEntry> {
  const id = input.id || makeKey(input.subject, input.grade, input.chapterNumber);
  const now = new Date().toISOString();

  const existing = await getQuizById(id);
  if (existing) {
    await saveVersion(existing);
  }

  const contentKey = makeKey(input.subject, input.grade, input.chapterNumber);
  const { data: contentRef } = await supabase
    .from('content_entries')
    .select('id')
    .eq('id', contentKey)
    .single();

  if (!contentRef) {
    console.warn(`[quiz-db] Quiz saved for non-existent content entry: ${contentKey}`);
  }

  const sanitizedQuestions = (input.questions || []).map(q => ({
    ...q,
    question: sanitize(q.question),
    explanation: sanitize(q.explanation),
    options: q.options.map(o => sanitize(o)),
  }));

  const row: Record<string, any> = {
    id,
    subject: input.subject,
    grade: input.grade,
    chapter_number: input.chapterNumber,
    chapter_name: sanitize(input.chapterName || `Chapter ${input.chapterNumber}`),
    questions: JSON.stringify(sanitizedQuestions),
    status: input.status || 'draft',
    updated_at: now,
    version: (existing?.version || 0) + 1,
  };

  const { error } = await supabase
    .from('quiz_entries')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('[quiz-db] Upsert failed:', formatSupabaseError(error));
    throw new Error(formatSupabaseError(error));
  }

  return {
    id,
    subject: input.subject,
    grade: input.grade,
    chapterNumber: input.chapterNumber,
    chapterName: input.chapterName || `Chapter ${input.chapterNumber}`,
    questions: input.questions || [],
    status: input.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    version: (existing?.version || 0) + 1,
  };
}

export async function getQuiz(subject: string, grade: number, chapterNumber: number, status?: string): Promise<QuizEntry | null> {
  let query = supabase
    .from('quiz_entries')
    .select('*')
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('chapter_number', chapterNumber);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.single();

  if (error || !data) return null;
  return mapRowToEntry(data);
}

export async function getQuizById(id: string): Promise<QuizEntry | null> {
  const { data, error } = await supabase
    .from('quiz_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRowToEntry(data);
}

export async function listQuizzes(filters?: { subject?: string; grade?: number; status?: string; search?: string }): Promise<QuizEntry[]> {
  let query = supabase
    .from('quiz_entries')
    .select('*');

  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.grade) query = query.eq('grade', filters.grade);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase().replace(/[%_]/g, m => '\\' + m);
    query = query.or(`chapter_name.ilike.%${q}%,subject.ilike.%${q}%`);
  }

  const { data, error } = await query.order('grade').order('subject').order('chapter_number');

  if (error || !data) return [];
  return data.map(mapRowToEntry);
}

export async function deleteQuiz(subject: string, grade: number, chapterNumber: number): Promise<boolean> {
  const entry = await getQuiz(subject, grade, chapterNumber);
  if (!entry) return false;

  await supabase.from('quiz_entries').delete().eq('id', entry.id);
  await supabase.from('quiz_versions').delete().eq('subject', subject).eq('grade', grade).eq('chapter_number', chapterNumber);
  return true;
}

export async function getQuizVersions(subject: string, grade: number, chapterNumber: number): Promise<QuizEntry[]> {
  const { data, error } = await supabase
    .from('quiz_versions')
    .select('*')
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('chapter_number', chapterNumber)
    .order('saved_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => {
    const r = snakeToCamel(row);
    return {
      id: r.id || makeKey(r.subject, r.grade, r.chapterNumber),
      subject: r.subject,
      grade: r.grade,
      chapterNumber: r.chapterNumber,
      chapterName: r.chapterName || '',
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : (r.questions || []),
      status: r.status,
      createdAt: r.savedAt,
      updatedAt: r.savedAt,
      version: r.version,
    };
  });
}

async function saveVersion(entry: QuizEntry): Promise<void> {
  const row = {
    subject: entry.subject,
    grade: entry.grade,
    chapter_number: entry.chapterNumber,
    chapter_name: entry.chapterName,
    questions: JSON.stringify(entry.questions || []),
    status: entry.status,
    version: entry.version,
    saved_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('quiz_versions')
    .insert(row);

  if (error) {
    console.error('[quiz-db] Version save failed:', formatSupabaseError(error));
  }

  await pruneVersions(entry.subject, entry.grade, entry.chapterNumber, 10);
}

async function pruneVersions(subject: string, grade: number, chapterNumber: number, keep: number): Promise<void> {
  const { data } = await supabase
    .from('quiz_versions')
    .select('id')
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('chapter_number', chapterNumber)
    .order('saved_at', { ascending: false });

  if (!data || data.length <= keep) return;
  const idsToDelete = data.slice(keep).map((r: any) => r.id);
  if (idsToDelete.length > 0) {
    await supabase.from('quiz_versions').delete().in('id', idsToDelete);
  }
}
