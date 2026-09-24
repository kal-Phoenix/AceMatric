import { supabaseAdmin as db, snakeToCamel, formatSupabaseError } from './db';
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

export interface PastExamPassage {
  id: string;
  text: string;
  passageSource?: string;
}

export interface PastExamQuestion {
  id: string;
  sourceNumber?: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  needsReview?: boolean;
  reviewReason?: string;
  passageId?: string;
  language?: string;
  extractionConfidence?: string;
}

export interface PastExamEntry {
  id: string;
  title: string;
  grade: number;
  subject: string;
  yearEC: string;
  yearGC?: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: PastExamQuestion[];
  passages?: PastExamPassage[];
  examCode?: string;
  sourceFile?: string;
  extractionNotes?: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  version: number;
}

function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value !== 'string') return (value ?? fallback) as T;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function mapRowToEntry(row: any): PastExamEntry {
  const r = snakeToCamel(row);
  return {
    id: r.id,
    title: r.title,
    grade: r.grade,
    subject: r.subject,
    yearEC: r.yearEc || '',
    yearGC: r.yearGc || '',
    durationMinutes: r.durationMinutes || 90,
    totalQuestions: r.totalQuestions || 0,
    questions: safeJsonParse(r.questions, []),
    passages: safeJsonParse(r.passages, []),
    examCode: r.examCode || '',
    sourceFile: r.sourceFile || '',
    extractionNotes: safeJsonParse(r.extractionNotes, []),
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    version: r.version,
  };
}

export async function upsertPastExam(input: {
  id?: string;
  title: string;
  grade: number;
  subject: string;
  yearEC?: string;
  yearGC?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  questions?: PastExamQuestion[];
  passages?: PastExamPassage[];
  examCode?: string;
  sourceFile?: string;
  extractionNotes?: string[];
  status?: 'draft' | 'published';
}): Promise<PastExamEntry> {
  const id = input.id || `past-${input.subject.toLowerCase().replace(/\s+/g, '-')}-g${input.grade}-${Date.now()}`;
  const now = new Date().toISOString();

  const existing = await getPastExam(id);
  if (existing) {
    await saveVersion(existing);
  }

  const questions = (input.questions || []).map(q => ({
    ...q,
    question: sanitize(q.question),
    explanation: sanitize(q.explanation),
    options: q.options.map(o => sanitize(o)),
  }));
  const row: Record<string, any> = {
    id,
    title: sanitize(input.title),
    grade: input.grade,
    subject: input.subject,
    year_ec: input.yearEC || '',
    duration_minutes: input.durationMinutes || 90,
    total_questions: input.totalQuestions || questions.length,
    questions: JSON.stringify(questions),
    status: input.status || 'draft',
    updated_at: now,
    version: (existing?.version || 0) + 1,
  };

  const { error } = await supabase
    .from('past_exam_entries')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('[past-exam-db] Upsert failed:', formatSupabaseError(error));
    throw new Error(formatSupabaseError(error));
  }

  return {
    id,
    title: input.title,
    grade: input.grade,
    subject: input.subject,
    yearEC: input.yearEC || '',
    yearGC: input.yearGC || '',
    durationMinutes: input.durationMinutes || 90,
    totalQuestions: input.totalQuestions || questions.length,
    questions,
    passages: input.passages || [],
    examCode: input.examCode || '',
    sourceFile: input.sourceFile || '',
    extractionNotes: input.extractionNotes || [],
    status: input.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    version: (existing?.version || 0) + 1,
  };
}

export async function getPastExam(id: string, status?: string): Promise<PastExamEntry | null> {
  let query = supabase
    .from('past_exam_entries')
    .select('*')
    .eq('id', id);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.single();

  if (error || !data) return null;
  return mapRowToEntry(data);
}

export async function listPastExams(filters?: { subject?: string; grade?: number; yearEC?: string; status?: string; search?: string }): Promise<PastExamEntry[]> {
  let query = supabase
    .from('past_exam_entries')
    .select('*');

  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.grade) query = query.eq('grade', filters.grade);
  if (filters?.yearEC) query = query.eq('year_ec', filters.yearEC);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase().replace(/[%_]/g, m => '\\' + m);
    query = query.or(`title.ilike.%${q}%,subject.ilike.%${q}%`);
  }

  const { data, error } = await query.order('year_ec').order('subject');

  if (error || !data) return [];
  return data.map(mapRowToEntry);
}

export async function deletePastExam(id: string): Promise<boolean> {
  const entry = await getPastExam(id);
  if (!entry) return false;

  await supabase.from('past_exam_entries').delete().eq('id', id);
  await supabase.from('past_exam_versions').delete().eq('entry_id', id);
  return true;
}

export async function duplicatePastExam(id: string, newTitle?: string): Promise<PastExamEntry | null> {
  const source = await getPastExam(id);
  if (!source) return null;

  return upsertPastExam({
    ...source,
    id: undefined,
    title: newTitle || `${source.title} (Copy)`,
    status: 'draft',
  });
}

export async function getPastExamVersions(id: string): Promise<PastExamEntry[]> {
  const { data, error } = await supabase
    .from('past_exam_versions')
    .select('*')
    .eq('entry_id', id)
    .order('saved_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => {
    const r = snakeToCamel(row);
    return {
      id: r.id,
      title: r.title,
      grade: r.grade,
      subject: r.subject,
      yearEC: r.yearEc || r.year_ec || '',
      yearGC: r.yearGc || r.year_gc || '',
      durationMinutes: r.durationMinutes || 90,
      totalQuestions: r.totalQuestions || 0,
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : (r.questions || []),
      passages: typeof r.passages === 'string' ? JSON.parse(r.passages) : (r.passages || []),
      examCode: r.examCode || r.exam_code || '',
      sourceFile: r.sourceFile || r.source_file || '',
      extractionNotes: typeof r.extractionNotes === 'string' ? JSON.parse(r.extractionNotes) : (r.extractionNotes || []),
      status: r.status,
      createdAt: r.savedAt,
      updatedAt: r.savedAt,
      version: r.version,
    };
  });
}

async function saveVersion(entry: PastExamEntry): Promise<void> {
  const row = {
    entry_id: entry.id,
    title: entry.title,
    grade: entry.grade,
    subject: entry.subject,
    duration_minutes: entry.durationMinutes,
    total_questions: entry.totalQuestions,
    questions: JSON.stringify(entry.questions || []),
    status: entry.status,
    version: entry.version,
    saved_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('past_exam_versions')
    .insert(row);

  if (error) {
    console.error('[past-exam-db] Version save failed:', formatSupabaseError(error));
  }

  await pruneVersions(entry.id, 10);
}

async function pruneVersions(entryId: string, keep: number): Promise<void> {
  const { data } = await supabase
    .from('past_exam_versions')
    .select('id')
    .eq('entry_id', entryId)
    .order('saved_at', { ascending: false });

  if (!data || data.length <= keep) return;

  const idsToDelete = data.slice(keep).map((r: any) => r.id);
  if (idsToDelete.length > 0) {
    await supabase.from('past_exam_versions').delete().in('id', idsToDelete);
  }
}
