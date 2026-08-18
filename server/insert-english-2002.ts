import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const data = JSON.parse(readFileSync('storage/past-exams/english-g12-2002ec.json', 'utf-8'));

async function main() {
  const questions = data.questions.map((q: any) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex ?? 0,
    explanation: q.explanation || '',
  }));

  const row = {
    id: `past-english-g12-${Date.now()}`,
    title: data.title,
    grade: data.grade,
    subject: data.subject,
    year_ec: data.yearEC || '',
    duration_minutes: data.durationMinutes || 90,
    total_questions: data.totalQuestions || questions.length,
    questions: JSON.stringify(questions),
    passages: JSON.stringify(data.passages || []),
    status: 'published',
    updated_at: new Date().toISOString(),
    version: 1,
  };

  const { error } = await supabase.from('past_exam_entries').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log(`[ok] ${row.title}`);
  console.log(`    ${questions.length} questions inserted`);
  console.log(`    ID: ${row.id}`);

  // Verify
  const { data: saved } = await supabase.from('past_exam_entries').select('questions').eq('id', row.id).single();
  const qs = JSON.parse(saved!.questions);
  console.log(`    Q1 explanation: ${qs[0].explanation.substring(0, 80)}...`);
}

main();
