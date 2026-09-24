import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth } from '../middleware';
import { validateBody, upsertDailyProgressSchema } from '../validation';

const router = Router();

// GET /api/daily-progress?stream=X&date=Y
router.get('/', requireAuth, async (req, res) => {
  try {
    const stream = req.query.stream as string;
    const date = req.query.date as string;
    if (!stream || !date) {
      return res.status(400).json({ error: 'stream and date are required' });
    }

    const { data, error } = await supabase
      .from('student_daily_progress')
      .select('*')
      .eq('user_email', req.user!.email)
      .eq('stream', stream)
      .eq('quiz_date', date)
      .maybeSingle();

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    if (!data) return res.json(null);

    res.json({
      questions: data.questions,
      currentIndex: data.current_index,
      selectedOptionId: data.selected_option_id,
      isAnswerChecked: data.is_answer_checked,
      correctAnswersCount: data.correct_answers_count,
      completed: data.completed,
    });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// POST /api/daily-progress (upsert)
router.post('/', requireAuth, validateBody(upsertDailyProgressSchema), async (req, res) => {
  try {
    const {
      stream,
      quizDate,
      questions,
      currentIndex,
      selectedOptionId,
      isAnswerChecked,
      correctAnswersCount,
      completed,
    } = req.body;

    // Find existing record to preserve its id on update
    const { data: existing } = await supabase
      .from('student_daily_progress')
      .select('id')
      .eq('user_email', req.user!.email)
      .eq('stream', stream)
      .eq('quiz_date', quizDate)
      .maybeSingle();

    const row: Record<string, any> = {
      user_email: req.user!.email,
      stream,
      quiz_date: quizDate,
      questions,
      current_index: currentIndex ?? 0,
      selected_option_id: selectedOptionId ?? null,
      is_answer_checked: isAnswerChecked ?? false,
      correct_answers_count: correctAnswersCount ?? 0,
      completed: completed ?? false,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('student_daily_progress')
        .update(row)
        .eq('id', existing.id));
    } else {
      row.id = crypto.randomUUID();
      ({ error } = await supabase
        .from('student_daily_progress')
        .insert([row]));
    }

    if (error) return res.status(500).json({ error: formatSupabaseError(error) });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
