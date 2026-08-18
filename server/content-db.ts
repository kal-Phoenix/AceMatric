import { supabase as db, getSupabase, snakeToCamel, formatSupabaseError } from './db';

// Cast supabase proxy to any for proper query builder type inference
const supabase = db as any;

const CONTENT_IMAGES_BUCKET = 'content-images';

export interface ContentEntry {
  subject: string;
  grade: number;
  chapterNumber: number;
  stream: string;
  title: string;
  overview: string;
  corePoints: string[];
  examTips: string;
  youtubeVideoId: string;
  videoDuration: string;
  materials: Array<{ name: string; formula: string; description: string }>;
  subtopics: Array<{ title: string; content: string; examInsight: string; imageUrl?: string; imageCaption?: string; imageAlign?: string; imageSize?: string; practiceProblems?: Array<{ question: string; options: string[]; answer: string; solution: string }> }>;
  contentHtml: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  version: number;
}

function makeId(subject: string, grade: number, chapterNumber: number): string {
  return `${subject}/g${grade}/ch${chapterNumber}`;
}

export async function upsertContent(input: {
  subject: string;
  grade: number;
  chapterNumber: number;
  stream?: string;
  title: string;
  overview?: string;
  corePoints?: string[];
  examTips?: string;
  youtubeVideoId?: string;
  videoDuration?: string;
  materials?: Array<{ name: string; formula: string; description: string }>;
  subtopics?: Array<{ title: string; content: string; examInsight: string; imageUrl?: string; imageCaption?: string; practiceProblems?: Array<{ question: string; options: string[]; answer: string; solution: string }> }>;
  contentHtml?: string;
  status?: 'draft' | 'published';
}): Promise<ContentEntry> {
  const id = makeId(input.subject, input.grade, input.chapterNumber);
  const now = new Date().toISOString();

  const existing = await getExisting(id);

  if (existing) {
    await saveVersion(existing);
  }

  const row: Record<string, any> = {
    id,
    subject: input.subject,
    grade: input.grade,
    chapter_number: input.chapterNumber,
    title: input.title,
    overview: input.overview || '',
    core_points: JSON.stringify(input.corePoints || []),
    exam_tips: input.examTips || '',
    youtube_video_id: input.youtubeVideoId || '',
    video_duration: input.videoDuration || '',
    materials: JSON.stringify(input.materials || []),
    subtopics: JSON.stringify(input.subtopics || []),
    content_html: input.contentHtml || '',
    status: input.status || 'draft',
    updated_at: now,
    version: (existing?.version || 0) + 1,
  };
  // Only include stream if the column exists (added via migration)
  if (input.stream) {
    row.stream = input.stream;
  }

  const { error } = await supabase
    .from('content_entries')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('[content-db] Upsert failed:', formatSupabaseError(error));
    throw new Error(formatSupabaseError(error));
  }

  return {
    subject: input.subject,
    grade: input.grade,
    chapterNumber: input.chapterNumber,
    stream: input.stream || '',
    title: input.title,
    overview: input.overview || '',
    corePoints: input.corePoints || [],
    examTips: input.examTips || '',
    youtubeVideoId: input.youtubeVideoId || '',
    videoDuration: input.videoDuration || '',
    materials: input.materials || [],
    subtopics: input.subtopics || [],
    contentHtml: input.contentHtml || '',
    status: input.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    version: (existing?.version || 0) + 1,
  };
}

async function getExisting(id: string): Promise<ContentEntry | null> {
  const { data, error } = await supabase
    .from('content_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return mapRowToEntry(data);
}

function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value !== 'string') return (value ?? fallback) as T;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function mapRowToEntry(row: any): ContentEntry {
  const r = snakeToCamel(row);
  return {
    subject: r.subject,
    grade: r.grade,
    chapterNumber: r.chapterNumber,
    stream: r.stream || '',
    title: r.title,
    overview: r.overview || '',
    corePoints: safeJsonParse(r.corePoints, []),
    examTips: r.examTips || '',
    youtubeVideoId: r.youtubeVideoId || '',
    videoDuration: r.videoDuration || '',
    materials: safeJsonParse(r.materials, []),
    subtopics: safeJsonParse(r.subtopics, []),
    contentHtml: r.contentHtml || '',
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    version: r.version,
  };
}

async function saveVersion(entry: ContentEntry): Promise<void> {
  const row: Record<string, any> = {
    subject: entry.subject,
    grade: entry.grade,
    chapter_number: entry.chapterNumber,
    title: entry.title,
    overview: entry.overview || '',
    core_points: JSON.stringify(entry.corePoints || []),
    exam_tips: entry.examTips || '',
    youtube_video_id: entry.youtubeVideoId || '',
    video_duration: entry.videoDuration || '',
    subtopics: JSON.stringify(entry.subtopics || []),
    content_html: entry.contentHtml || '',
    status: entry.status,
    version: entry.version,
    saved_at: new Date().toISOString(),
  };
  if (entry.stream) {
    row.stream = entry.stream;
  }

  const { error } = await supabase
    .from('content_versions')
    .insert(row);

  if (error) {
    console.error('[content-db] Version save failed:', formatSupabaseError(error));
  }

  await pruneVersions(entry.subject, entry.grade, entry.chapterNumber, 10);
}

async function pruneVersions(subject: string, grade: number, chapterNumber: number, keep: number): Promise<void> {
  const { data } = await supabase
    .from('content_versions')
    .select('id')
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('chapter_number', chapterNumber)
    .order('saved_at', { ascending: false });

  if (!data || data.length <= keep) return;

  const idsToDelete = data.slice(keep).map((r: any) => r.id);
  if (idsToDelete.length > 0) {
    await supabase.from('content_versions').delete().in('id', idsToDelete);
  }
}

export async function getContent(subject: string, grade: number, chapterNumber: number, status?: string): Promise<ContentEntry | null> {
  const id = makeId(subject, grade, chapterNumber);
  let query = supabase
    .from('content_entries')
    .select('*')
    .eq('id', id);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.single();

  if (error || !data) return null;
  return mapRowToEntry(data);
}

export async function listContent(filters?: { subject?: string; grade?: number; stream?: string; status?: string; search?: string }): Promise<ContentEntry[]> {
  let query = supabase
    .from('content_entries')
    .select('*');

  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.grade) query = query.eq('grade', filters.grade);
  if (filters?.stream) query = query.eq('stream', filters.stream);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase().replace(/[%_]/g, m => '\\' + m);
    query = query.or(`title.ilike.%${q}%,overview.ilike.%${q}%`);
  }

  const { data, error } = await query.order('grade').order('subject').order('chapter_number');

  if (error || !data) return [];
  return data.map(mapRowToEntry);
}

export async function deleteContent(subject: string, grade: number, chapterNumber: number): Promise<{ deleted: boolean; imageFiles: string[] }> {
  const id = makeId(subject, grade, chapterNumber);
  const entry = await getContent(subject, grade, chapterNumber);
  if (!entry) return { deleted: false, imageFiles: [] };

  const imageFiles = extractImageFilesFromEntry(entry);

  await supabase.from('content_entries').delete().eq('id', id);
  await supabase.from('content_versions').delete().eq('subject', subject).eq('grade', grade).eq('chapter_number', chapterNumber);

  return { deleted: true, imageFiles };
}

export async function duplicateContent(subject: string, grade: number, chapterNumber: number, newChapterNumber: number): Promise<ContentEntry | null> {
  const source = await getContent(subject, grade, chapterNumber);
  if (!source) return null;

  return upsertContent({
    ...source,
    chapterNumber: newChapterNumber,
    title: `${source.title} (Copy)`,
    status: 'draft',
  });
}

export async function getContentVersions(subject: string, grade: number, chapterNumber: number): Promise<ContentEntry[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('chapter_number', chapterNumber)
    .order('saved_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => {
    const r = snakeToCamel(row);
    return {
      subject: r.subject,
      grade: r.grade,
      chapterNumber: r.chapterNumber,
      stream: r.stream || '',
      title: r.title,
      overview: r.overview || '',
      corePoints: typeof r.corePoints === 'string' ? JSON.parse(r.corePoints) : (r.corePoints || []),
      examTips: r.examTips || '',
      youtubeVideoId: r.youtubeVideoId || '',
      videoDuration: r.videoDuration || '',
      materials: typeof r.materials === 'string' ? JSON.parse(r.materials) : (r.materials || []),
      subtopics: typeof r.subtopics === 'string' ? JSON.parse(r.subtopics) : (r.subtopics || []),
      contentHtml: r.contentHtml || '',
      status: r.status,
      createdAt: r.savedAt,
      updatedAt: r.savedAt,
      version: r.version,
    };
  });
}

export function extractImageFilesFromEntry(entry: ContentEntry): string[] {
  const files: string[] = [];
  const proxyRegex = /\/api\/content-manage\/images\/([a-f0-9-]+\.\w+)/g;
  const supabaseRegex = /content-images\/([a-f0-9-]+\.\w+)/g;

  for (const html of [entry.contentHtml, entry.overview, entry.examTips, ...entry.subtopics.map(s => s.content)]) {
    if (!html) continue;
    let match;
    while ((match = proxyRegex.exec(html)) !== null) {
      files.push(match[1]);
    }
    while ((match = supabaseRegex.exec(html)) !== null) {
      files.push(match[1]);
    }
  }

  return [...new Set(files)];
}

export async function listContentImages(): Promise<Array<{ filename: string; url: string; size: number; createdAt: string }>> {
  const client = getSupabase();
  const { data, error } = await client.storage
    .from(CONTENT_IMAGES_BUCKET)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !data) return [];

  return data
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name))
    .map(f => {
      const { data: urlData } = client.storage
        .from(CONTENT_IMAGES_BUCKET)
        .getPublicUrl(f.name);
      return {
        filename: f.name,
        url: urlData?.publicUrl || '',
        size: f.metadata?.size || 0,
        createdAt: f.created_at || new Date().toISOString(),
      };
    });
}
