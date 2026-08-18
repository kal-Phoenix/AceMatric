import 'dotenv/config';

import { supabase, formatSupabaseError } from './db';
import { PRACTICE_QUESTIONS, STUDY_NOTES, PAST_EXAMS } from '../src/data/mockData';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export async function seedAllData() {
  await ensureRoleColumn();
  await ensureStorageBucket();
  await seedQuestions();
  await seedCuratedNotes();
  await seedPastExamQuestionsAndMocks();
}

async function ensureRoleColumn() {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('role')
      .limit(1);

    if (!error) {
      const { getAdminEmails } = await import('./middleware');
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        for (const email of adminEmails) {
          await supabase
            .from('student_profiles')
            .update({ role: 'admin' })
            .eq('email', email);
        }
        console.log(`[setup] Admin roles set for: ${adminEmails.join(', ')}`);
      }
      return;
    }

    if (!error.message?.includes('column') && !error.message?.includes('does not exist')) {
      return;
    }

    console.log('[setup] Adding role column to student_profiles...');
    const { error: rpcError } = await supabase.rpc('sql_exec', {
      query: `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';`
    });

    if (rpcError) {
      console.log('[setup] Auto-add not available. Run migration manually:');
      console.log('  Paste SQL from server/migrations/004_user_roles.sql into Supabase SQL Editor');
    } else {
      console.log('[setup] role column added to student_profiles');
      const { getAdminEmails } = await import('./middleware');
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        for (const email of adminEmails) {
          await supabase
            .from('student_profiles')
            .update({ role: 'admin' })
            .eq('email', email);
        }
        console.log(`[setup] Admin roles set for: ${adminEmails.join(', ')}`);
      }
    }
  } catch (err) {
    console.warn('[setup] ensureRoleColumn failed (non-critical):', err instanceof Error ? err.message : err);
  }
}

async function ensureStorageBucket() {
  const BUCKET_NAME = 'content-images';
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
    if (exists) return;

    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (error) {
      if (error.message?.includes('already exists')) return;
      console.log(`[setup] Could not create bucket "${BUCKET_NAME}":`, error.message);
      console.log(`  Create it manually in Supabase Dashboard → Storage → New Bucket`);
    } else {
      console.log(`[setup] Created storage bucket: ${BUCKET_NAME}`);
    }
  } catch (err) {
    console.warn('[setup] ensureStorageBucket failed (non-critical):', err instanceof Error ? err.message : err);
  }
}

async function seedQuestions() {
  try {
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (!process.argv.includes('--force') && count && count > 0) {
      console.log(`[seed] questions already has ${count} rows, skipping.`);
      return;
    }

    if (process.argv.includes('--force') && count && count > 0) {
      console.log(`[seed] --force: deleting ${count} existing questions...`);
      const { error: delErr } = await supabase.from('questions').delete().eq('status', 'published');
      if (delErr) {
        // Fallback: delete one-by-one via ID listing
        const { data: ids } = await supabase.from('questions').select('id');
        if (ids && ids.length > 0) {
          for (const row of ids) {
            await supabase.from('questions').delete().eq('id', row.id);
          }
        }
      }
      console.log('[seed] Existing questions cleared.');
    }

    console.log('[seed] Seeding practice questions...');
    let seeded = 0;

    for (const q of PRACTICE_QUESTIONS) {
      const { error } = await supabase
        .from('questions')
        .upsert([{
          id: q.id,
          subject: q.subject,
          stream: q.stream,
          chapter: q.chapter,
          year_ec: q.yearEC,
          question_text: q.questionText,
          question_text_amharic: q.questionTextAmharic || null,
          passage: q.passage || null,
          options: q.options,
          correct_option_id: q.correctOptionId,
          explanation: q.explanation,
          explanation_amharic: q.explanationAmharic || null,
          difficulty: q.difficulty,
          status: 'published',
          question_type: 'practice',
        }], { onConflict: 'id' });

      if (error) {
        console.error(`[seed] Failed to insert question ${q.id}:`, error.message);
      } else {
        seeded++;
      }
    }

    console.log(`[seed] Questions seeded: ${seeded}/${PRACTICE_QUESTIONS.length}`);
  } catch (err: any) {
    console.error('[seed] Questions seed failed:', formatSupabaseError(err));
  }
}

async function seedCuratedNotes() {
  try {
    // Migration 006 drops curated_study_notes; use content_entries instead
    const { count } = await supabase
      .from('content_entries')
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      console.log(`[seed] content_entries already has ${count} rows, skipping curated notes seed.`);
      return;
    }

    console.log('[seed] Seeding curated study notes into content_entries...');
    let seeded = 0;

    for (const note of STUDY_NOTES) {
      const grade = 12;
      const chapterNum = parseInt(note.chapter, 10) || 1;
      const contentId = `${note.subject}/g${grade}/ch${chapterNum}`;

      const { error } = await supabase
        .from('content_entries')
        .upsert([{
          id: contentId,
          subject: note.subject,
          grade,
          chapter_number: chapterNum,
          title: note.title,
          overview: note.summary,
          core_points: [],
          exam_tips: '',
          youtube_video_id: note.youtubeVideoId,
          video_duration: note.videoDuration,
          materials: note.formulaSheet || [],
          subtopics: [],
          content_html: '',
          status: 'published',
          version: 1,
        }], { onConflict: 'id' });

      if (error) {
        console.error(`[seed] Failed to insert content ${contentId}:`, error.message);
      } else {
        seeded++;
      }
    }

    console.log(`[seed] Curated notes seeded to content_entries: ${seeded}/${STUDY_NOTES.length}`);
  } catch (err: any) {
    console.warn('[seed] Curated notes seed skipped (non-critical):', err instanceof Error ? err.message : err);
  }
}

async function seedPastExamQuestionsAndMocks() {
  try {
    const { count: peCount } = await supabase
      .from('past_exam_entries')
      .select('id', { count: 'exact', head: true });

    const expectedPastExams = PAST_EXAMS.length;

    if (!process.argv.includes('--force') && peCount && peCount >= expectedPastExams) {
      console.log(`[seed] Past exams (${peCount}) already seeded, skipping.`);
      return;
    }

    console.log('[seed] Seeding past exam questions...');
    let questionsSeeded = 0;

    for (const exam of PAST_EXAMS) {
      const questionIds: string[] = [];

      for (const q of exam.questions) {
        const correctLetter = OPTION_LETTERS[q.correctIndex] || 'A';
        const options = q.options.map((text: string, i: number) => ({
          id: OPTION_LETTERS[i],
          text,
        }));

        const { error } = await supabase
          .from('questions')
          .upsert([{
            id: q.id,
            subject: exam.subject,
            stream: 'Natural Science',
            chapter: exam.title,
            year_ec: exam.yearEC ? `${exam.yearEC} E.C.` : '2023 E.C.',
            question_text: q.question,
            question_text_amharic: null,
            options,
            correct_option_id: correctLetter,
            explanation: q.explanation,
            explanation_amharic: null,
            difficulty: 'Medium',
            status: 'published',
            question_type: 'past_exam',
          }], { onConflict: 'id' });

        if (!error) {
          questionIds.push(q.id);
          questionsSeeded++;
        } else {
          console.error(`[seed] question upsert failed for ${q.id}:`, JSON.stringify(error));
        }
      }
    }

    console.log(`[seed] Past exam questions: ${questionsSeeded}`);

    // Seed past_exam_entries so the admin panel can display them
    console.log('[seed] Seeding past_exam_entries...');
    let pastEntriesSeeded = 0;
    for (const exam of PAST_EXAMS) {
      const questions = exam.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
      const { error } = await supabase
        .from('past_exam_entries')
        .upsert([{
          id: exam.id,
          title: exam.title,
          grade: exam.grade,
          subject: exam.subject,
          year_ec: exam.yearEC || '',
          duration_minutes: exam.durationMinutes,
          total_questions: exam.totalQuestions,
          questions,
          status: 'published',
        }], { onConflict: 'id' });
      if (!error) pastEntriesSeeded++;
      else console.error(`[seed] past_exam_entries upsert failed for ${exam.id}:`, JSON.stringify(error));
    }
    console.log(`[seed] Past exam entries seeded: ${pastEntriesSeeded}`);
  } catch (err: any) {
    console.error('[seed] Past exams seed failed:', formatSupabaseError(err));
  }
}

// CLI entry point
if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  seedAllData()
    .then(() => { console.log('[seed] Done.'); process.exit(0); })
    .catch((err) => { console.error('[seed] Fatal:', err); process.exit(1); });
}
