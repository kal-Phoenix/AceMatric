import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth, requireAdmin, isAdminUser } from '../middleware';
import { validateBody, createMockExamSchema, updateMockExamSchema } from '../validation';

const router = Router();

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'br']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
  allowedSchemes: ['https', 'http'],
};

function sanitize(html: string): string {
  return sanitizeHtml(html || '', SANITIZE_OPTS);
}

// GET /api/mock-exams
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('mock_exams').select('*');

    const subject = req.query.subject as string;
    const stream = req.query.stream as string;
    if (subject) query = query.eq('subject', subject);
    if (stream) query = query.eq('stream', stream);

    const isAdmin = await isAdminUser(req.user!.email);
    if (!isAdmin) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) {
      console.error('[mock-exams] Fetch error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    const exams = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      titleAmharic: row.title_amharic,
      stream: row.stream,
      subject: row.subject,
      durationMinutes: row.duration_minutes,
      totalQuestions: row.total_questions,
      questionIds: row.question_ids,
      status: row.status,
    }));

    res.json(exams);
  } catch (err: any) {
    console.error('[mock-exams] List error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/mock-exams (admin only)
router.post('/', requireAdmin, validateBody(createMockExamSchema), async (req, res) => {
  try {
    const m = req.body;

    const row = {
      id: m.id,
      title: sanitize(m.title),
      title_amharic: m.titleAmharic || null,
      stream: m.stream,
      subject: m.subject,
      duration_minutes: m.durationMinutes || 60,
      total_questions: m.totalQuestions || 0,
      question_ids: m.questionIds || [],
      status: m.status || 'published',
    };

    const { error } = await supabase
      .from('mock_exams')
      .upsert([row], { onConflict: 'id' });

    if (error) {
      console.error('[mock-exams] Upsert error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[mock-exams] Create error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// PUT /api/mock-exams/:id (admin only)
router.put('/:id', requireAdmin, validateBody(updateMockExamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const m = req.body;

    const row: Record<string, any> = {};
    if (m.title !== undefined) row.title = sanitize(m.title);
    if (m.titleAmharic !== undefined) row.title_amharic = m.titleAmharic;
    if (m.stream !== undefined) row.stream = m.stream;
    if (m.subject !== undefined) row.subject = m.subject;
    if (m.durationMinutes !== undefined) row.duration_minutes = m.durationMinutes;
    if (m.totalQuestions !== undefined) row.total_questions = m.totalQuestions;
    if (m.questionIds !== undefined) row.question_ids = m.questionIds;
    if (m.status !== undefined) row.status = m.status;

    if (Object.keys(row).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { error } = await supabase
      .from('mock_exams')
      .update(row)
      .eq('id', id);

    if (error) {
      console.error('[mock-exams] Update error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[mock-exams] Update error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// DELETE /api/mock-exams/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('mock_exams')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[mock-exams] Delete error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[mock-exams] Delete error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

export default router;
