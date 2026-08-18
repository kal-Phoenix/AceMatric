import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { logAudit } from '../audit';
import { getSupabase } from '../db';
import {
  upsertPastExam,
  getPastExam,
  listPastExams,
  deletePastExam,
  duplicatePastExam,
  getPastExamVersions,
} from '../past-exam-db';

const router = Router();

function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value !== 'string') return (value ?? fallback) as T;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

// GET /api/past-exam-manage/public - student-facing: list published past exams
router.get('/public', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { subject, yearEC } = req.query;
    let query = supabase
      .from('past_exam_entries')
      .select('*')
      .eq('status', 'published');
    if (subject) query = query.eq('subject', subject);
    if (yearEC) query = query.eq('year_ec', yearEC);
    query = query.order('year_ec').order('subject');
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to query past exams' });
    const entries = (data || []).map((row: any) => {
      const questions = safeJsonParse(row.questions, []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex ?? 0,
        explanation: q.explanation,
      }));
      return {
        id: row.id,
        title: row.title,
        grade: row.grade,
        subject: row.subject,
        yearEC: row.year_ec || '',
        durationMinutes: row.duration_minutes || 90,
        totalQuestions: row.total_questions || 0,
        questions,
        status: row.status,
      };
    });
    res.json(entries);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list past exams' });
  }
});

// GET /api/past-exam-manage/list
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const { subject, grade, yearEC, status, search } = req.query;
    const items = await listPastExams({
      subject: subject as string,
      grade: grade ? parseInt(grade as string, 10) : undefined,
      yearEC: yearEC as string,
      status: status as string,
      search: search as string,
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list past exams' });
  }
});

// GET /api/past-exam-manage/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const supabase = getSupabase();
    const [totalRes, publishedRes, draftRes, subjectsRes] = await Promise.all([
      supabase.from('past_exam_entries').select('id', { count: 'exact', head: true }),
      supabase.from('past_exam_entries').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('past_exam_entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('past_exam_entries').select('subject'),
    ]);
    const subjects = subjectsRes.data ? [...new Set(subjectsRes.data.map((e: any) => e.subject))] : [];
    res.json({
      total: totalRes.count || 0,
      published: publishedRes.count || 0,
      draft: draftRes.count || 0,
      subjects,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get stats' });
  }
});

// GET /api/past-exam-manage/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const statusFilter = req.user!.role === 'admin' ? undefined : 'published';
    const item = await getPastExam(req.params.id, statusFilter);
    if (!item) return res.status(404).json({ error: 'Past exam not found' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get past exam' });
  }
});

// GET /api/past-exam-manage/:id/versions
router.get('/:id/versions', requireAdmin, async (req, res) => {
  try {
    const versions = await getPastExamVersions(req.params.id);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get versions' });
  }
});

// POST /api/past-exam-manage/save
router.post('/save', requireAdmin, async (req, res) => {
  try {
    const input = req.body;
    if (!input.title || !input.grade || !input.subject) {
      return res.status(400).json({ error: 'title, grade, and subject are required' });
    }
    const saved = await upsertPastExam(input);
    await logAudit({ adminEmail: req.user!.email, action: 'past-exam.save', details: { id: saved.id, title: saved.title } });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save past exam' });
  }
});

// POST /api/past-exam-manage/duplicate
router.post('/duplicate', requireAdmin, async (req, res) => {
  try {
    const { id, title } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const dup = await duplicatePastExam(id, title);
    if (!dup) return res.status(404).json({ error: 'Source exam not found' });
    await logAudit({ adminEmail: req.user!.email, action: 'past-exam.duplicate', details: { from: id, to: dup.id } });
    res.json(dup);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to duplicate past exam' });
  }
});

// DELETE /api/past-exam-manage/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await deletePastExam(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Past exam not found' });
    await logAudit({ adminEmail: req.user!.email, action: 'past-exam.delete', details: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete past exam' });
  }
});

export default router;
