/**
 * AceMatric Content Reviser
 *
 * Expands and enriches existing content_entries IN PLACE:
 * - keeps id, structure, subtopic titles/order, YouTube video
 * - rewrites thin/boilerplate explanations into full paragraphed content
 * - adds formulas, worked examples, exam insights, and practice problems
 * - stages results to storage/revised/ for review (no direct DB writes)
 *
 * Usage:
 *   npx tsx server/revise-content.ts                    # all entries not yet revised
 *   npx tsx server/revise-content.ts --limit 5          # first 5 only
 *   npx tsx server/revise-content.ts --id Biology/g9/ch1
 *   npx tsx server/revise-content.ts --subject Maths --grade 10
 *   npx tsx server/revise-content.ts --force            # redo even if staged file exists
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('Supabase credentials not set'); process.exit(1); }

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OUT_DIR = path.join(process.cwd(), 'storage', 'revised');
const FAIL_DIR = path.join(OUT_DIR, '_failed');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(FAIL_DIR, { recursive: true });

/** Thrown when the daily free-tier quota is gone — the run should stop and resume later. */
class QuotaExhaustedError extends Error {
  resumeAt: Date;
  constructor(message: string, resumeAt: Date) {
    super(message);
    this.resumeAt = resumeAt;
  }
}

// Cascade: full model first (best quality), lite as stability fallback
const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
let preferredModel: string | null = null; // last model that succeeded
const MIN_SUBTOPIC_WORDS = 280;
const TARGET_SUBTOPIC_WORDS = 320;

// ── Curriculum chapter names (ground truth from src/data/curriculum.ts) ──────

interface ChapterName { grade: number; subject: string; chapterNumber: number; chapterName: string; }
let CURRICULUM_CHAPTERS: ChapterName[] = [];

async function loadCurriculum(): Promise<void> {
  const mod = await import('../src/data/curriculum.ts');
  CURRICULUM_CHAPTERS = [];
  for (const stream of mod.ETHIOPIAN_CURRICULUM) {
    for (const subj of stream.subjects) {
      for (const ch of subj.chapters) {
        CURRICULUM_CHAPTERS.push({
          grade: subj.grade,
          subject: subj.subject,
          chapterNumber: ch.chapterNumber,
          chapterName: ch.chapterName,
        });
      }
    }
  }
}

function chapterNameFor(subject: string, grade: number, chapterNumber: number): string {
  const hit = CURRICULUM_CHAPTERS.find(
    c => c.subject === subject && c.grade === grade && c.chapterNumber === chapterNumber
  );
  return hit?.chapterName || `Chapter ${chapterNumber}`;
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(entry: any, chapterName: string): string {
  return `You are an expert Ethiopian National Matric Exam curriculum writer. Revise and ENRICH the existing study-note entry below.

## Current entry (JSON):
${JSON.stringify(entry, null, 1)}

## Ground truth
Subject: ${entry.subject}
Grade: ${entry.grade}
Chapter ${entry.chapter_number}: ${chapterName} (official curriculum name)

## Revision rules — follow EXACTLY

STRUCTURE (must not change):
- Keep the same top-level fields: id, subject, grade, chapter_number, title, overview, core_points, exam_tips, youtube_video_id, video_duration, subtopics, content_html, status.
- Keep the same number of subtopics, in the same order, with the same titles — EXCEPT fix the numeric prefix of each subtopic title so it runs sequentially as "${entry.chapter_number}.1", "${entry.chapter_number}.2", ... (the current entry may have wrong prefixes like "2.4").
- Keep youtube_video_id and video_duration exactly as they are (may be empty).
- subtopics must be an ARRAY of objects with keys: title, content, imageUrl, examInsight, imageCaption, practiceProblems. Keep imageUrl/imageCaption as they are (usually null).

CONTENT (this is the main goal — expand, do not shrink):
- overview: 2-3 full HTML paragraphs (<p>) introducing the chapter, what it covers, and why it matters for the Matric exam. Minimum 120 words.
- Each subtopic.content: FULL paragraphed explanation, ${TARGET_SUBTOPIC_WORDS}+ words, minimum ${MIN_SUBTOPIC_WORDS}. Use multiple <p> paragraphs — definitions, explanations, worked examples with real numbers, and how the concept appears in the Matric exam. Professional academic English. Never leave a subtopic as 1-2 sentences. Use <strong> for key terms, <em> for emphasis, <ul>/<ol>/<li> for lists, <h4>/<h5> for sub-headings if helpful. NO <script>, <iframe>, images, or external links.
- For maths/science subtopics: include relevant FORMULAS in the text (e.g. "m = (y₂ − y₁)/(x₂ − x₁)") and at least one fully worked example with step-by-step calculations.
- For humanities subtopics: include specific dates, names, places, events, definitions — factual detail is required, no vague generalities.
- examInsight per subtopic: one SPECIFIC exam tip, shortcut, or common trap (not generic filler).
- practiceProblems: 4 per subtopic (3 minimum, 5 maximum). Each problem: unique question text, exactly 4 options, "answer" as a single letter "A"|"B"|"C"|"D", and "solution" as HTML with <p><strong>Step 1:</strong> ...<br/>...</p><p><strong>Correct Answer: X</strong></p>. SOLVE every problem yourself and verify the letter is correct before outputting. No duplicate questions within the entry. Difficulty mix: 2 easy/medium + 2 exam-style. CRITICAL: place correct answers in DIFFERENT positions — across the whole entry, use A, B, C and D roughly equally; never put more than half the correct answers on the same letter, and avoid patterns like B,C,B,C.
- core_points: 5-7 concise bullet strings covering the chapter's key learnings.
- exam_tips: one HTML paragraph (or two) of SPECIFIC Matric exam advice for this chapter.
- materials: 4-8 objects {name, formula, description} — key terms, formulas, SI units. Use "formula": "" only for non-formula terms.

QUALITY:
- FACTUAL ACCURACY is critical. Do not invent statistics or fake historical claims. Content must align with the Ethiopian national curriculum for Grade ${entry.grade} ${entry.subject}.
- Remove all boilerplate patterns like "Detailed exploration of X within the context of Y" and "This unit covers X. Students will explore key principles".
- Write for students self-studying for the Matric exam: clear, complete, professional.

OUTPUT: Return ONLY the complete revised JSON object. No markdown fences, no explanation.`;
}

// ── Validation ───────────────────────────────────────────────────────────────

function wordCount(html: string): number {
  return String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

// Normalize a practice problem's options to a 4-string array.
// Models sometimes return {A:..,B:..,C:..,D:..} instead of ["..","..","..",".."].
function normalizeOptions(p: any): void {
  if (p && p.options && !Array.isArray(p.options) && typeof p.options === 'object') {
    const o = p.options;
    if (o.A !== undefined && o.B !== undefined && o.C !== undefined && o.D !== undefined) {
      p.options = [String(o.A), String(o.B), String(o.C), String(o.D)];
    }
  }
  if (p && Array.isArray(p.options)) p.options = p.options.map((x: any) => String(x));
}

function normalizeEntry(rev: any): void {
  if (!rev || !Array.isArray(rev.subtopics)) return;
  for (const s of rev.subtopics) {
    if (Array.isArray(s.practiceProblems)) s.practiceProblems.forEach(normalizeOptions);
  }
  // cap runaway materials lists (prompt asks for 4-8; models sometimes emit 20+)
  if (Array.isArray(rev.materials) && rev.materials.length > 8) rev.materials = rev.materials.slice(0, 8);
}

function validate(rev: any, original: any): string[] {
  const errors: string[] = [];
  if (!rev || typeof rev !== 'object') return ['not an object'];
  for (const f of ['id', 'subject', 'grade', 'chapter_number', 'title', 'overview', 'core_points', 'exam_tips', 'subtopics']) {
    if (rev[f] === undefined || rev[f] === null) errors.push(`missing field: ${f}`);
  }
  if (rev.id !== original.id) errors.push(`id changed: ${rev.id} != ${original.id}`);

  const origSt = typeof original.subtopics === 'string' ? JSON.parse(original.subtopics) : original.subtopics;
  const st = rev.subtopics;
  if (!Array.isArray(st)) { errors.push('subtopics not an array'); return errors; }
  if (st.length !== origSt.length) errors.push(`subtopic count changed: ${st.length} != ${origSt.length}`);

  if (wordCount(rev.overview) < 100) errors.push(`overview too short: ${wordCount(rev.overview)}w`);
  const cp = rev.core_points;
  if (!Array.isArray(cp) || cp.length < 5 || cp.length > 7) errors.push(`core_points: ${Array.isArray(cp) ? cp.length : 'not array'} (need 5-7)`);
  const mt = rev.materials;
  if (!Array.isArray(mt) || mt.length < 4 || mt.length > 8) errors.push(`materials: ${Array.isArray(mt) ? mt.length : 'not array'} (need 4-8)`);

  const seenQuestions = new Set<string>();
  st.forEach((s: any, i: number) => {
    const label = `subtopic[${i}]`;
    if (!s.title) errors.push(`${label}: no title`);
    const w = wordCount(s.content);
    if (w < MIN_SUBTOPIC_WORDS) errors.push(`${label}: only ${w}w content (need ${MIN_SUBTOPIC_WORDS}+)`);
    if (!s.examInsight || wordCount(s.examInsight) < 8) errors.push(`${label}: weak examInsight`);
    if (/<script|<iframe|onerror|onload/i.test(s.content || '')) errors.push(`${label}: forbidden HTML`);

    const pps = s.practiceProblems;
    if (!Array.isArray(pps) || pps.length < 3 || pps.length > 5) {
      errors.push(`${label}: practiceProblems ${Array.isArray(pps) ? pps.length : 'not array'} (need 3-5)`);
      return;
    }
    pps.forEach((p: any, j: number) => {
      const pl = `${label}.pp[${j}]`;
      if (!p.question || wordCount(p.question) < 4) errors.push(`${pl}: missing question`);
      if (!Array.isArray(p.options) || p.options.length !== 4) errors.push(`${pl}: options != 4`);
      if (!/^[A-D]$/.test(p.answer || '')) errors.push(`${pl}: bad answer '${p.answer}'`);
      if (!p.solution || !/Step/i.test(p.solution) || !/Correct Answer/i.test(p.solution)) errors.push(`${pl}: weak solution`);
      const qkey = String(p.question || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
      if (seenQuestions.has(qkey)) errors.push(`${pl}: duplicate question`);
      seenQuestions.add(qkey);
      // verify answer letter is plausible: solution should contain the letter
      if (/Correct Answer:\s*([A-D])/.test(p.solution || '')) {
        const solLetter = p.solution.match(/Correct Answer:\s*([A-D])/)[1];
        if (solLetter !== p.answer) errors.push(`${pl}: answer '${p.answer}' != solution '${solLetter}'`);
      }
    });
  });

  // answer position distribution across the entry
  const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let totalAnswers = 0;
  st.forEach((s: any) => {
    (Array.isArray(s.practiceProblems) ? s.practiceProblems : []).forEach((p: any) => {
      if (/^[A-D]$/.test(p.answer || '')) { answerCounts[p.answer]++; totalAnswers++; }
    });
  });
  if (totalAnswers >= 8) {
    for (const [letter, count] of Object.entries(answerCounts)) {
      if (count / totalAnswers > 0.55) {
        errors.push(`answer bias: ${count}/${totalAnswers} correct answers are '${letter}' (>55%) — rearrange option order so correct answers are spread across A-D`);
      }
    }
    const distinct = Object.values(answerCounts).filter(c => c > 0).length;
    if (distinct < 3) errors.push(`answer bias: only ${distinct} distinct answer positions used (need >= 3)`);
  }

  return errors;
}

// ── Generation ───────────────────────────────────────────────────────────────

function parseJsonResponse(raw: string): any {
  let jsonStr = raw.trim();
  const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonStr = fence[1].trim();
  const first = jsonStr.indexOf('{');
  const last = jsonStr.lastIndexOf('}');
  if (first !== -1 && last !== -1) jsonStr = jsonStr.substring(first, last + 1);

  // Repair invalid escape sequences (e.g. LaTeX \frac, regex \d) inside JSON strings
  jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

  try {
    return JSON.parse(jsonStr);
  } catch {
    // second attempt: strip literal control characters
    const cleaned = jsonStr.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    return JSON.parse(cleaned);
  }
}

async function reviseEntry(entry: any, chapterName: string, attemptErrors?: string[]): Promise<any> {
  const prompt = buildPrompt(entry, chapterName) +
    (attemptErrors ? `\n\n## Your previous attempt FAILED validation:\n${attemptErrors.join('\n')}\nFix ALL of these issues and return the complete corrected JSON.` : '');

  // API-level retries with exponential backoff (503 high demand, 429 rate limit, 500)
  // plus a model cascade when a model is unavailable (404/503 exhausted).
  let lastErr: any;
  const order = preferredModel
    ? [preferredModel, ...MODELS.filter(m => m !== preferredModel)]
    : MODELS;
  for (let apiTry = 1; apiTry <= 6; apiTry++) {
    const model = order[(apiTry - 1) % order.length];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.4,
          maxOutputTokens: 65536,
        },
      });
      const raw = response.text || '';
      if (!raw) throw new Error('Empty response from Gemini');
      preferredModel = model;
      return parseJsonResponse(raw);
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);

      // Daily-quota exhaustion ("Please retry in 13h17m") — stop the whole run.
      if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) {
        const t = msg.match(/retry in (?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i);
        const waitSec = t ? (Number(t[1] || 0) * 3600 + Number(t[2] || 0) * 60 + Number(t[3] || 0)) : 0;
        if (waitSec > 300) {
          const resumeAt = new Date(Date.now() + waitSec * 1000);
          throw new QuotaExhaustedError(
            `Daily Gemini quota exhausted — resumes ${resumeAt.toLocaleString()}`,
            resumeAt
          );
        }
        // short quota window (seconds) — treat like a normal retry below
      }

      const retriable = /429|503|500|404|UNAVAILABLE|overloaded|high demand|no longer available|deadline|ECONNRESET|timeout|escaped character|Unexpected token|not valid JSON/i.test(msg);
      if (!retriable || apiTry === 6) throw err;
      const wait = /429|quota/i.test(msg) ? Math.min(120000, 30000 * apiTry) : Math.min(30000, 3000 * 2 ** ((apiTry - 1) % 4));
      console.log(`\n    [api retry ${apiTry}/6 model=${model} in ${wait / 1000}s] ${msg.slice(0, 110)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function outPath(entry: any): string {
  return path.join(OUT_DIR, `${String(entry.id).replace(/[\/\\]/g, '_')}.json`);
}

async function main() {
  await loadCurriculum();

  const args = process.argv.slice(2);
  const getFlag = (name: string): string | undefined => {
    const i = args.indexOf(name);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const force = args.includes('--force');
  const limit = parseInt(getFlag('--limit') || '0', 10) || 0;
  const onlyId = getFlag('--id');
  const onlySubject = getFlag('--subject');
  const onlyGrade = getFlag('--grade');

  console.log('Fetching content_entries...');
  const { data: entries, error } = await supabase.from('content_entries').select('*');
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Total entries in DB: ${entries!.length}`);

  let list = entries!.slice().sort((a, b) =>
    a.subject.localeCompare(b.subject) || a.grade - b.grade || a.chapter_number - b.chapter_number
  );
  if (onlyId) list = list.filter(e => e.id === onlyId);
  if (onlySubject) list = list.filter(e => e.subject.toLowerCase() === onlySubject.toLowerCase());
  if (onlyGrade) list = list.filter(e => String(e.grade) === onlyGrade);
  if (!force) list = list.filter(e => !fs.existsSync(outPath(e)));
  if (limit > 0) list = list.slice(0, limit);

  console.log(`To revise: ${list.length}${force ? ' (force mode)' : ''}\n`);
  if (!list.length) { console.log('Nothing to do.'); return; }

  let ok = 0, failed = 0, quotaStop = false;
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const chapterName = chapterNameFor(entry.subject, entry.grade, entry.chapter_number);
    process.stdout.write(`[${i + 1}/${list.length}] ${entry.id} ... `);

    try {
      let revised: any, errors: string[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        revised = await reviseEntry(entry, chapterName, attempt > 1 ? errors : undefined);
        normalizeEntry(revised);
        errors = validate(revised, entry);
        if (!errors.length) break;
        // keep the last bad output for inspection
        try {
          fs.writeFileSync(path.join(FAIL_DIR, `${String(entry.id).replace(/[\/\\]/g, '_')}.attempt${attempt}.json`),
            JSON.stringify(revised, null, 2), 'utf-8');
        } catch { /* ignore */ }
        if (attempt === 3) throw new Error(`validation failed:\n    - ${errors.join('\n    - ')}`);
        await new Promise(r => setTimeout(r, 1000));
      }

      const out = { ...revised, __revisedAt: new Date().toISOString(), __sourceVersion: entry.version ?? null, __chapterName: chapterName };
      fs.writeFileSync(outPath(entry), JSON.stringify(out, null, 2), 'utf-8');
      const words = revised.subtopics.reduce((a: number, s: any) => a + wordCount(s.content), 0);
      const problems = revised.subtopics.reduce((a: number, s: any) => a + (s.practiceProblems?.length || 0), 0);
      console.log(`OK (${words}w, ${problems} problems)`);
      ok++;
    } catch (err: any) {
      if (err instanceof QuotaExhaustedError) {
        console.log(`QUOTA EXHAUSTED`);
        console.log(`\n${err.message}`);
        quotaStop = true;
        break;
      }
      console.log(`FAILED`);
      console.log(`    ${err.message}`);
      try {
        fs.writeFileSync(path.join(FAIL_DIR, `${String(entry.id).replace(/[\/\\]/g, '_')}.txt`),
          `ID: ${entry.id}\nERROR: ${err.message}\n`, 'utf-8');
      } catch { /* ignore */ }
      failed++;
    }

    if (i < list.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Revised this run: ${ok}`);
  console.log(`  Failed:           ${failed}`);
  console.log(`  Still pending:    ${list.length - ok - failed}`);
  if (quotaStop) {
    console.log(`  Daily quota hit — run the same command again after the resume time above.`);
    console.log(`  Completed entries are skipped automatically.`);
  }
  console.log(`  Output: ${OUT_DIR}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
