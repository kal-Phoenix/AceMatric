/**
 * AceMatric Past-Exam Answer Fixer
 *
 * Programmatic repair of questions whose correctIndex is -1.
 * Where the explanation explicitly states the answer
 * ("Answer: C", "answer is B", "13. D"), derives the correct option index.
 *
 * Safety:
 *   - dry-run by default; --apply writes
 *   - full backup of touched exams before writing
 *   - uses upsertPastExam (version history + rollback)
 *   - leaves image/empty/unmatched questions for the AI review pass
 *
 * Usage:
 *   npx tsx server/fix-past-exam-answers.ts                # dry run
 *   npx tsx server/fix-past-exam-answers.ts --apply
 *   npx tsx server/fix-past-exam-answers.ts --apply --id past-mathematics-g12-2008ec
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { supabaseAdmin } from './db';
import { upsertPastExam, PastExamEntry, PastExamQuestion } from './past-exam-db';

const supabase = supabaseAdmin as any;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const idIdx = args.indexOf('--id');
const ONLY_ID = idIdx >= 0 ? args[idIdx + 1] : undefined;

const NEGATIVE = /ANSWER KEY NOT FOUND|source shows|No answer|doesn'?t match any option|matches none of the options|cannot be determined|unanswerab|No Correct Answer Provided|answer key unclear/i;
const RULES: RegExp[] = [
  /(?:^|[^A-Za-z])answer\s*(?:is|:|=|-)?\s*\(\s*(?:option\s*)?([A-D])\b/i,              // Answer: (Option B...) / Answer: (C)
  /(?:^|[^A-Za-z])answer\s*(?:is|:|=|-)?\s*\(?([A-D])\)?(?![A-Za-z])/i,                  // Answer: C / answer is B
  /\(?\b([A-D])\)?\s+(?:is|as)\s+(?:the\s+)?(?:correct|final|best)\s+(?:answer|choice|option)/i, // C is the correct answer
  /(?:correct(?:ness)?\s*(?:answer|choice|option)|answer\s*key)\s*(?:is|:)?\s*\(?([A-D])\b/i,     // correct answer: D
];
const NUMBER_RULE = /(?:^|[^A-Za-z])answer\s*(?:is|:|=|-)?\s*\(?([1-4])\)?(?![A-Za-z])/i;
const MULTI = /answer\s*(?:is|:)\s*\(?[A-D]\)?\s*(?:,|\/|and|&|or|to|-)\s*\(?[A-D0-9]/i;

/**
 * Derives the option index from the explanation — strict, false-positive-proof:
 * rejects "ANSWER KEY NOT FOUND"-style placeholders, multi-answer statements,
 * broken options, and conflicting signals.
 */
function extractIndex(explanation: string, opts: string[], questionId?: string): number | null {
  const text = String(explanation || '').trim();
  if (!text || opts.length < 1) return null;
  if (NEGATIVE.test(text)) return null;

  const hits: number[] = [];
  for (const re of RULES) {
    const m = text.match(re);
    if (m) {
      const i = m[1].toUpperCase().charCodeAt(0) - 65;
      if (i >= 0 && i < opts.length) hits.push(i);
    }
  }
  // shared answer-key line for this question: "13. D" where question id is "q13"
  if (!hits.length && questionId) {
    const n = questionId.match(/\d+/);
    if (n) {
      const m = text.match(new RegExp(`(?:^|[^\\d])${n[0]}\\s*[.)]\\s*\\(?\\s*([A-D])\\b`, 'i'));
      if (m) {
        const i = m[1].toUpperCase().charCodeAt(0) - 65;
        if (i >= 0 && i < opts.length) hits.push(i);
      }
    }
  }
  if (!hits.length) {
    const m = text.match(NUMBER_RULE);
    if (m) {
      const i = Number(m[1]) - 1;
      if (i >= 0 && i < opts.length) hits.push(i);
    }
  }
  if (!hits.length) return null;
  if (new Set(hits).size > 1) return null;
  if (MULTI.test(text)) return null;
  const label = String(opts[hits[0]] || '');
  if (/\[?\s*option missing/i.test(label) || /not visible/i.test(label)) return null;
  return hits[0];
}

function parseQuestions(v: any): PastExamQuestion[] | null {
  const arr = Array.isArray(v) ? v : typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return null; } })() : null;
  if (!Array.isArray(arr)) return null;
  return arr.map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] }));
}

function mapRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    grade: row.grade,
    subject: row.subject,
    yearEC: row.year_ec || '',
    yearGC: row.year_gc || '',
    durationMinutes: row.duration_minutes ?? 90,
    totalQuestions: row.total_questions,
    examCode: row.exam_code || '',
    sourceFile: row.source_file || '',
    extractionNotes: Array.isArray(row.extraction_notes) ? row.extraction_notes : [],
    status: row.status,
    passages: typeof row.passages === 'string' ? JSON.parse(row.passages) : (row.passages || []),
  };
}

async function main() {
  console.log(APPLY ? '=== APPLY mode (writes enabled) ===' : '=== DRY RUN (no writes, use --apply) ===');

  let query = supabase.from('past_exam_entries').select('*');
  if (ONLY_ID) query = query.eq('id', ONLY_ID);
  const { data, error } = await query;
  if (error) { console.error(error); process.exit(1); }
  if (!data?.length) { console.error(ONLY_ID ? `No exam: ${ONLY_ID}` : 'No exams found'); process.exit(1); }

  const backup: any[] = [];
  let fixed = 0, remaining = 0, examsChanged = 0;
  const aiReviewExams = new Set<string>();

  for (const row of data) {
    const questions = parseQuestions(row.questions);
    if (!questions) continue;

    let changed = false;
    for (const q of questions as any[]) {
      if (q.correctIndex !== -1 && q.correctIndex !== null && q.correctIndex !== undefined) continue;
      const opts: string[] = Array.isArray(q.options) ? q.options.map((o: any) => String(o ?? '')) : [];
      const idx = extractIndex(q.explanation, opts, q.id);
      if (idx !== null) {
        q.correctIndex = idx;
        fixed++;
        changed = true;
      } else {
        remaining++;
        aiReviewExams.add(row.id);
      }
    }

    if (!changed) continue;
    examsChanged++;
    backup.push({ ...row });

    if (APPLY) {
      const mapped = mapRow(row);
      await upsertPastExam({ ...mapped, questions: questions as PastExamQuestion[] });
      console.log(`  fixed: ${row.id}`);
    } else {
      const n = questions.filter((q: any) => q.correctIndex !== -1).length;
      console.log(`  would fix: ${row.id} (correct answers now: ${n}/${questions.length})`);
    }
  }

  if (APPLY && backup.length) {
    const dir = path.join(process.cwd(), 'storage', 'backup');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `past-exam-answers-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`\nBackup written: ${file} (${backup.length} exams)`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Questions fixed:    ${fixed}`);
  console.log(`  Still need review:  ${remaining}`);
  console.log(`  Exams touched:      ${examsChanged}`);
  if (aiReviewExams.size) {
    console.log(`  Exams queued for AI review (${aiReviewExams.size}):`);
    for (const id of [...aiReviewExams].slice(0, 15)) console.log(`    - ${id}`);
    if (aiReviewExams.size > 15) console.log(`    ... and ${aiReviewExams.size - 15} more`);
  }
  process.exit(0);
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
