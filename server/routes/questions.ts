import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { supabaseAdmin, formatSupabaseError } from '../db';
import { requireAuth, requireAdmin, isAdminUser } from '../middleware';
import { validateBody, createQuestionSchema, updateQuestionSchema } from '../validation';

const router = Router();

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'br']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class'] },
  allowedSchemes: ['https', 'http'],
};

function sanitize(html: string): string {
  return sanitizeHtml(html || '', SANITIZE_OPTS);
}

async function saveQuestionVersion(questionRow: Record<string, any>): Promise<void> {
  const { count } = await supabaseAdmin
    .from('question_versions')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionRow.id);

  const nextVersion = (count || 0) + 1;

  const { error } = await supabaseAdmin
    .from('question_versions')
    .insert({
      question_id: questionRow.id,
      subject: questionRow.subject,
      stream: questionRow.stream,
      chapter: questionRow.chapter || '',
      year_ec: questionRow.year_ec || '',
      question_text: questionRow.question_text,
      question_text_amharic: questionRow.question_text_amharic || null,
      options: questionRow.options,
      correct_option_id: questionRow.correct_option_id,
      explanation: questionRow.explanation || '',
      explanation_amharic: questionRow.explanation_amharic || null,
      difficulty: questionRow.difficulty || 'Medium',
      status: questionRow.status || 'published',
      version: nextVersion,
    });

  if (error) {
    console.error('[questions] Version save failed:', formatSupabaseError(error));
  }

  const { data: versions } = await supabaseAdmin
    .from('question_versions')
    .select('id')
    .eq('question_id', questionRow.id)
    .order('saved_at', { ascending: false });

  if (versions && versions.length > 10) {
    const idsToDelete = versions.slice(10).map((v: any) => v.id);
    if (idsToDelete.length > 0) {
      await supabaseAdmin.from('question_versions').delete().in('id', idsToDelete);
    }
  }
}

async function getQuestionById(id: string): Promise<Record<string, any> | null> {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

// GET /api/questions
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(20000, Math.max(1, parseInt(req.query.limit as string) || 20000));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });

    const subject = req.query.subject as string;
    const stream = req.query.stream as string;
    const questionType = req.query.questionType as string;
    if (subject) query = query.eq('subject', subject);
    if (stream) query = query.eq('stream', stream);
    if (questionType) query = query.eq('question_type', questionType);

    const isAdmin = await isAdminUser(req.user!.email);
    if (!isAdmin) {
      query = query.eq('status', 'published');
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('[questions] Fetch error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    const questions = (data || []).map((row: any) => ({
      id: row.id,
      subject: row.subject,
      stream: row.stream,
      chapter: row.chapter,
      yearEC: row.year_ec,
      questionText: row.question_text,
      questionTextAmharic: row.question_text_amharic,
      passage: row.passage || null,
      hasImage: row.has_image || false,
      imagePlaceholder: row.image_placeholder || null,
      options: row.options,
      correctOptionId: row.correct_option_id,
      explanation: row.explanation,
      explanationAmharic: row.explanation_amharic,
      difficulty: row.difficulty,
      status: row.status,
      questionType: row.question_type || 'practice',
    }));

    res.json({
      data: questions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('[questions] List error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// POST /api/questions (admin only)
router.post('/', requireAdmin, validateBody(createQuestionSchema), async (req, res) => {
  try {
    const q = req.body;

    const existing = await getQuestionById(q.id);
    if (existing) {
      await saveQuestionVersion(existing);
    }

    const row = {
      id: q.id,
      subject: q.subject,
      stream: q.stream,
      chapter: q.chapter || '',
      year_ec: q.yearEC || '',
      question_text: sanitize(q.questionText),
      question_text_amharic: q.questionTextAmharic || null,
      passage: q.passage || null,
      has_image: q.hasImage || false,
      image_placeholder: q.imagePlaceholder || null,
      options: (q.options || []).map((o: any) => ({ ...o, text: sanitize(o.text) })),
      correct_option_id: q.correctOptionId,
      explanation: sanitize(q.explanation),
      explanation_amharic: q.explanationAmharic || null,
      difficulty: q.difficulty || 'Medium',
      status: q.status || 'published',
    };

    const { error } = await supabaseAdmin
      .from('questions')
      .upsert([row], { onConflict: 'id' });

    if (error) {
      console.error('[questions] Upsert error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[questions] Create error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// PUT /api/questions/:id (admin only)
router.put('/:id', requireAdmin, validateBody(updateQuestionSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const q = req.body;

    const existing = await getQuestionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await saveQuestionVersion(existing);

    const row: Record<string, any> = {};
    if (q.subject !== undefined) row.subject = q.subject;
    if (q.stream !== undefined) row.stream = q.stream;
    if (q.chapter !== undefined) row.chapter = q.chapter;
    if (q.yearEC !== undefined) row.year_ec = q.yearEC;
    if (q.questionText !== undefined) row.question_text = sanitize(q.questionText);
    if (q.questionTextAmharic !== undefined) row.question_text_amharic = q.questionTextAmharic;
    if (q.hasImage !== undefined) row.has_image = q.hasImage;
    if (q.imagePlaceholder !== undefined) row.image_placeholder = q.imagePlaceholder;
    if (q.options !== undefined) row.options = q.options.map((o: any) => ({ ...o, text: sanitize(o.text) }));
    if (q.correctOptionId !== undefined) row.correct_option_id = q.correctOptionId;
    if (q.explanation !== undefined) row.explanation = sanitize(q.explanation);
    if (q.explanationAmharic !== undefined) row.explanation_amharic = q.explanationAmharic;
    if (q.difficulty !== undefined) row.difficulty = q.difficulty;
    if (q.status !== undefined) row.status = q.status;

    if (Object.keys(row).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { error } = await supabaseAdmin
      .from('questions')
      .update(row)
      .eq('id', id);

    if (error) {
      console.error('[questions] Update error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[questions] Update error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// GET /api/questions/:id/versions (admin only)
router.get('/:id/versions', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('question_versions')
      .select('*')
      .eq('question_id', req.params.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('[questions] Versions fetch error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    const versions = (data || []).map((row: any) => ({
      id: row.id,
      questionId: row.question_id,
      subject: row.subject,
      stream: row.stream,
      chapter: row.chapter,
      yearEC: row.year_ec,
      questionText: row.question_text,
      questionTextAmharic: row.question_text_amharic,
      options: row.options,
      correctOptionId: row.correct_option_id,
      explanation: row.explanation,
      explanationAmharic: row.explanation_amharic,
      difficulty: row.difficulty,
      status: row.status,
      version: row.version,
      savedAt: row.saved_at,
    }));

    res.json(versions);
  } catch (err: any) {
    console.error('[questions] Versions error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// DELETE /api/questions/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { data: refs } = await supabaseAdmin
      .from('mock_exams')
      .select('id, title')
      .contains('question_ids', [req.params.id]);

    if (refs && refs.length > 0) {
      const examNames = refs.map((r: any) => r.title).join(', ');
      return res.status(409).json({
        error: `Cannot delete: question is used in mock exam(s): ${examNames}`,
        referencedBy: refs.map((r: any) => ({ id: r.id, title: r.title })),
      });
    }

    await supabaseAdmin.from('question_versions').delete().eq('question_id', req.params.id);

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[questions] Delete error:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[questions] Delete error:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

export default router;
