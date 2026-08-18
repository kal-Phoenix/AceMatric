import 'dotenv/config';
import { upsertPastExam } from './past-exam-db.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npx tsx server/insert-past-exam.ts <path-to-json>');
  process.exit(1);
}

async function main() {
  const raw = readFileSync(resolve(file), 'utf-8');
  const data = JSON.parse(raw);

  const result = await upsertPastExam({
    id: data.id,
    title: data.title,
    grade: data.grade,
    subject: data.subject,
    yearEC: data.yearEC || '',
    yearGC: data.yearGC || '',
    examCode: data.examCode || '',
    sourceFile: data.sourceFile || '',
    extractionNotes: data.extractionNotes || [],
    durationMinutes: data.durationMinutes || 90,
    totalQuestions: data.totalQuestions || data.questions?.length || 0,
    questions: (data.questions || []).map((q: any) => ({
      id: q.id,
      sourceNumber: q.sourceNumber,
      question: q.question,
      options: q.options || [],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
      hasImage: q.hasImage ?? false,
      imagePlaceholder: q.imagePlaceholder || '',
      needsReview: q.needsReview ?? false,
      reviewReason: q.reviewReason || '',
      passageId: q.passageId || '',
      language: q.language || 'en',
      extractionConfidence: q.extractionConfidence || 'high',
    })),
    passages: data.passages || [],
    status: 'published',
  });

  console.log(`[ok] ${result.title}`);
  console.log(`    ${result.questions.length} questions inserted`);
  console.log(`    ID: ${result.id}`);
}

main().catch((err) => {
  console.error('[error]', err.message);
  process.exit(1);
});
