import { Router } from 'express';
import { requireAuth, requireAdmin, isAdminUser } from '../middleware';
import { logAudit } from '../audit';
import { getSupabaseAdmin as getSupabase } from '../db';
import {
  upsertQuiz,
  getQuiz,
  listQuizzes,
  deleteQuiz,
  getQuizVersions,
} from '../quiz-db';

const router = Router();

// GET /api/quiz-manage/list
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const { subject, grade, status, search } = req.query;
    const items = await listQuizzes({
      subject: subject as string,
      grade: grade ? parseInt(grade as string, 10) : undefined,
      status: status as string,
      search: search as string,
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list quizzes' });
  }
});

// GET /api/quiz-manage/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const supabase = getSupabase();
    const [totalRes, publishedRes, draftRes, subjectsRes] = await Promise.all([
      supabase.from('quiz_entries').select('id', { count: 'exact', head: true }),
      supabase.from('quiz_entries').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('quiz_entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('quiz_entries').select('subject'),
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

// GET /api/quiz-manage/:subject/:grade/:chapter
router.get('/:subject/:grade/:chapter', requireAuth, async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = parseInt(req.params.grade, 10);
    const chapter = parseInt(req.params.chapter, 10);
    if (!subject || Number.isNaN(grade) || Number.isNaN(chapter)) {
      return res.status(400).json({ error: 'subject, grade, and chapter are required' });
    }
    const isAdmin = await isAdminUser(req.user!.email);
    const statusFilter = isAdmin ? undefined : 'published';
    const item = await getQuiz(subject, grade, chapter, statusFilter);
    if (!item) return res.status(404).json({ error: 'Quiz not found' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get quiz' });
  }
});

// GET /api/quiz-manage/:subject/:grade/:chapter/versions
router.get('/:subject/:grade/:chapter/versions', requireAdmin, async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = parseInt(req.params.grade, 10);
    const chapter = parseInt(req.params.chapter, 10);
    const versions = await getQuizVersions(subject, grade, chapter);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get versions' });
  }
});

// POST /api/quiz-manage/save
router.post('/save', requireAdmin, async (req, res) => {
  try {
    const input = req.body;
    if (!input.subject || !input.grade || !input.chapterNumber) {
      return res.status(400).json({ error: 'subject, grade, and chapterNumber are required' });
    }
    const saved = await upsertQuiz(input);
    await logAudit({ adminEmail: req.user!.email, action: 'quiz.save', details: { subject: input.subject, grade: input.grade, chapter: input.chapterNumber } });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save quiz' });
  }
});

// DELETE /api/quiz-manage/:subject/:grade/:chapter
router.delete('/:subject/:grade/:chapter', requireAdmin, async (req, res) => {
  try {
    const subject = req.params.subject;
    const grade = parseInt(req.params.grade, 10);
    const chapter = parseInt(req.params.chapter, 10);
    const deleted = await deleteQuiz(subject, grade, chapter);
    if (!deleted) return res.status(404).json({ error: 'Quiz not found' });
    await logAudit({ adminEmail: req.user!.email, action: 'quiz.delete', details: { subject, grade, chapter } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete quiz' });
  }
});

export default router;
