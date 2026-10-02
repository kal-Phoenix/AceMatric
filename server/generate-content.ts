/**
 * AceMatric Content Generator
 *
 * Generates structured, curriculum-aligned study notes for Ethiopian Matric exam.
 * Uses Gemini API to produce accurate, exam-focused educational content.
 *
 * Usage:
 *   npx tsx server/generate-content.ts [grade] [subject] [chapter]
 *   npx tsx server/generate-content.ts 12 Physics 1
 *   npx tsx server/generate-content.ts --all 12 Physics
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ── Env ──────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('Supabase credentials not set'); process.exit(1); }

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Curriculum ───────────────────────────────────────────────────────────────
const CURRICULUM: Record<string, Record<string, { name: string; chapters: number }>> = {
  '9': {
    'Biology':    { name: 'Biology', chapters: 6 },
    'Chemistry':  { name: 'Chemistry', chapters: 5 },
    'Physics':    { name: 'Physics', chapters: 6 },
    'Maths':      { name: 'Mathematics', chapters: 9 },
    'Geography':  { name: 'Geography', chapters: 8 },
    'History':    { name: 'History', chapters: 9 },
    'Economics':  { name: 'Economics', chapters: 8 },
    'English':    { name: 'English', chapters: 10 },
    'SAT':        { name: 'SAT', chapters: 22 },
  },
  '10': {
    'Biology':    { name: 'Biology', chapters: 6 },
    'Chemistry':  { name: 'Chemistry', chapters: 6 },
    'Physics':    { name: 'Physics', chapters: 6 },
    'Maths':      { name: 'Mathematics', chapters: 7 },
    'Geography':  { name: 'Geography', chapters: 8 },
    'History':    { name: 'History', chapters: 9 },
    'Economics':  { name: 'Economics', chapters: 8 },
    'English':    { name: 'English', chapters: 10 },
    'SAT':        { name: 'SAT', chapters: 22 },
  },
  '11': {
    'Biology':    { name: 'Biology', chapters: 6 },
    'Chemistry':  { name: 'Chemistry', chapters: 6 },
    'Physics':    { name: 'Physics', chapters: 7 },
    'Maths':      { name: 'Mathematics', chapters: 8 },
    'Geography':  { name: 'Geography', chapters: 8 },
    'History':    { name: 'History', chapters: 9 },
    'Economics':  { name: 'Economics', chapters: 7 },
    'English':    { name: 'English', chapters: 10 },
    'SAT':        { name: 'SAT', chapters: 22 },
  },
  '12': {
    'Biology':    { name: 'Biology', chapters: 6 },
    'Chemistry':  { name: 'Chemistry', chapters: 5 },
    'Physics':    { name: 'Physics', chapters: 5 },
    'Maths':      { name: 'Mathematics', chapters: 5 },
    'Geography':  { name: 'Geography', chapters: 8 },
    'History':    { name: 'History', chapters: 9 },
    'Economics':  { name: 'Economics', chapters: 8 },
    'English':    { name: 'English', chapters: 10 },
    'SAT':        { name: 'SAT', chapters: 22 },
  },
};

// ── Prompt Builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(subject: string): string {
  const subjectLower = subject.toLowerCase();
  const isSTEM = ['physics', 'chemistry', 'biology', 'maths', 'mathematics'].includes(subjectLower);
  const isHistory = subjectLower === 'history';
  const isSocial = ['geography', 'economics'].includes(subjectLower);
  const isLanguage = ['english', 'sat'].includes(subjectLower);

  let subjectGuidance = '';

  if (isSTEM) {
    subjectGuidance = `
For STEM subjects (Physics, Chemistry, Biology, Mathematics):
- Every subtopic MUST include relevant formulas, equations, or definitions where applicable
- Use <strong> for key terms, <em> for emphasis
- Include worked examples where they clarify a concept
- Reference the Ethiopian Matric exam format and common question patterns
- Use bullet points and numbered lists for clarity
- Keep explanations concise but complete — students should be able to self-study from this
- For Mathematics: include step-by-step worked examples with proper notation (use × for multiplication, ² for superscripts, etc.)
- For Physics/Chemistry: include SI units, formula variables with units, and typical values
- For Biology: use proper biological terminology, define all technical terms`;
  }

  if (isHistory) {
    subjectGuidance = `
For History:
- Focus on cause-and-effect relationships and historical significance
- Include specific dates, names, and places — these are heavily tested
- Structure content chronologically where relevant
- Highlight Ethiopian history alongside world history connections
- Use timeline-style organization for periods and events
- Connect historical events to their modern-day implications`;
  }

  if (isSocial) {
    subjectGuidance = `
For Geography/Economics:
- Include real-world examples, especially Ethiopian and African contexts
- Define all economic/geographic terms precisely
- Use data and statistics where relevant (GDP, population, climate data)
- Connect concepts to current issues in Ethiopia
- For Economics: include supply/demand diagrams described in text, market analysis
- For Geography: describe physical features, climate patterns, and human-environment interactions`;
  }

  if (isLanguage) {
    subjectGuidance = `
For English/SAT:
- Focus on reading comprehension strategies and vocabulary
- Include grammar rules with clear examples
- Provide practice passages and comprehension questions
- Highlight common exam question types and how to approach them
- Build vocabulary through context and word analysis`;
  }

  return `You are an expert Ethiopian National Matric Exam curriculum writer for Grade ${subject}.

CRITICAL RULES:
- Content must be FACTUALLY ACCURATE. Do not invent facts, statistics, or historical claims.
- Content must align with the Ethiopian national curriculum for the Matric exam.
- Write for Grade 12 students preparing for their university entrance exam.
- Use clear, direct academic English. No filler, no fluff, no motivational quotes.
- Every subtopic must be substantive — at least 2-3 solid paragraphs of actual content.
- HTML formatting: use <p>, <strong>, <em>, <ul>, <ol>, <li>, <h4>, <h5>, <br/> only.
- Do NOT use <script>, <iframe>, or event handlers.
- Do NOT use images or external links.
- Keep each subtopic focused on ONE specific concept.
${subjectGuidance}

OUTPUT FORMAT: You must return valid JSON with this exact structure:
{
  "title": "Chapter title (keep concise)",
  "overview": "2-3 paragraph overview of what this chapter covers and why it matters for the Matric exam. HTML formatted.",
  "corePoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "examTips": "Specific advice for this chapter's Matric exam questions. HTML formatted.",
  "materials": [
    { "name": "Term or Formula Name", "formula": "formula if applicable, else empty string", "description": "Clear definition in 1-2 sentences" }
  ],
  "subtopics": [
    {
      "title": "Subtopic Title",
      "content": "HTML content with <p>, <strong>, <em>, <ul>, <ol>, <li> tags. At least 3-4 substantive paragraphs explaining the core concepts in detail with definitions, governing equations, real-world context, and step-by-step worked examples.",
      "examInsight": "One specific exam tip, calculation shortcut, or common trap to avoid in the Matric exam",
      "practiceProblems": [
        {
          "question": "A focused, multiple-choice practice problem testing the concept covered in this subtopic.",
          "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
          "answer": "A",
          "solution": "<p><strong>Step 1:</strong> Identify the given values and formula.<br/><strong>Step 2:</strong> Substitute the values.<br/><strong>Step 3:</strong> Calculate the final answer.<br/><strong>Correct Answer: A</strong></p>"
        }
      ]
    }
  ]
}

Generate 4-8 subtopics per chapter, depending on chapter complexity.
Each subtopic content must be 200-450 words of rigorous educational content with step-by-step explanations.
Each subtopic MUST include 2-3 realistic practice problems with options A, B, C, D and step-by-step worked solutions.
Include 4-8 materials (key terms, formulas, SI units) per chapter.
Include 5-7 core points per chapter.

Return ONLY the JSON object. No markdown, no explanation before or after.`;
}

function buildUserPrompt(grade: number, subject: string, chapterNum: number, chapterName: string): string {
  return `Generate comprehensive study notes for:

Grade: ${grade}
Subject: ${subject}
Chapter ${chapterNum}: ${chapterName}

This is for the Ethiopian National Matric Exam (university entrance exam). The content must be accurate, exam-focused, and substantive enough for students to self-study from.`;
}

// ── Content Generation ───────────────────────────────────────────────────────

async function generateChapterContent(grade: number, subject: string, chapterNum: number, chapterName: string) {
  const systemPrompt = buildSystemPrompt(subject);
  const userPrompt = buildUserPrompt(grade, subject, chapterNum, chapterName);

  console.log(`\n  Generating: Grade ${grade} ${subject} Ch${chapterNum}: ${chapterName}`);

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  const rawText = response.text || '';
  if (!rawText) throw new Error('Empty response from Gemini');

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = rawText.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();
  
  // Also try to find raw JSON
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  const content = JSON.parse(jsonStr);

  // Validate structure
  if (!content.title || !content.overview || !Array.isArray(content.subtopics)) {
    throw new Error('Invalid content structure from AI');
  }

  return content;
}

// ── Database Save ────────────────────────────────────────────────────────────

function makeId(subject: string, grade: number, chapterNum: number): string {
  return `${subject}/g${grade}/ch${chapterNum}`;
}

async function saveToDatabase(grade: number, subject: string, chapterNum: number, content: any, status: 'draft' | 'published' = 'draft') {
  const id = makeId(subject, grade, chapterNum);
  const now = new Date().toISOString();

  // Check existing
  const { data: existing } = await supabase
    .from('content_entries')
    .select('version')
    .eq('id', id)
    .single();

  const version = (existing?.version || 0) + 1;

  const row = {
    id,
    subject,
    grade,
    chapter_number: chapterNum,
    title: content.title,
    overview: content.overview || '',
    core_points: JSON.stringify(content.corePoints || []),
    exam_tips: content.examTips || '',
    youtube_video_id: '',
    video_duration: '',
    materials: JSON.stringify(content.materials || []),
    subtopics: JSON.stringify(content.subtopics || []),
    content_html: '',
    status,
    updated_at: now,
    version,
  };

  // Save version if exists
  if (existing) {
    const { data: oldEntry } = await supabase
      .from('content_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (oldEntry) {
      await supabase.from('content_versions').insert({
        content_id: id,
        version: oldEntry.version,
        snapshot: JSON.stringify(oldEntry),
        created_at: now,
      });

      // Prune old versions (keep last 10)
      const { data: versions } = await supabase
        .from('content_versions')
        .select('id')
        .eq('content_id', id)
        .order('version', { ascending: false });

      if (versions && versions.length > 10) {
        const toDelete = versions.slice(10).map((v: any) => v.id);
        await supabase.from('content_versions').delete().in('id', toDelete);
      }
    }
  }

  const { error } = await supabase
    .from('content_entries')
    .upsert(row, { onConflict: 'id' });

  if (error) throw new Error(`Database error: ${error.message}`);

  return { id, version, status };
}

// ── Save to JSON file ────────────────────────────────────────────────────────

function saveToJson(grade: number, subject: string, chapterNum: number, content: any) {
  const dir = path.join(process.cwd(), 'generated-content', `grade-${grade}`, subject.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `ch${chapterNum}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  return filePath;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 && args[0] !== '--all') {
    console.log(`
AceMatric Content Generator

Usage:
  npx tsx server/generate-content.ts <grade> <subject> <chapter>
  npx tsx server/generate-content.ts --all <grade> <subject>

Examples:
  npx tsx server/generate-content.ts 12 Physics 1
  npx tsx server/generate-content.ts --all 12 Physics

Flags:
  --save       Save to database (default: save to JSON files only)
  --published  Set status to published (default: draft)
  --dry-run    Generate but don't save anywhere
`);
    process.exit(0);
  }

  const saveToDb = args.includes('--save');
  const publish = args.includes('--published');
  const dryRun = args.includes('--dry-run');
  const grade = parseInt(args[0] === '--all' ? args[1] : args[0]);
  const subjectKey = args[0] === '--all' ? args[2] : args[1];
  const chapterArg = args[0] === '--all' ? null : parseInt(args[2]);

  if (!grade || !subjectKey) {
    console.error('Invalid arguments. Run without arguments for help.');
    process.exit(1);
  }

  const gradeStr = grade.toString();
  if (!CURRICULUM[gradeStr]) {
    console.error(`Grade ${grade} not found. Available: ${Object.keys(CURRICULUM).join(', ')}`);
    process.exit(1);
  }

  // Normalize subject name
  const subjectMap: Record<string, string> = {
    'math': 'Maths', 'mathematics': 'Maths', 'maths': 'Maths',
    'phy': 'Physics', 'physics': 'Physics',
    'chem': 'Chemistry', 'chemistry': 'Chemistry',
    'bio': 'Biology', 'biology': 'Biology',
    'geo': 'Geography', 'geography': 'Geography',
    'hist': 'History', 'history': 'History',
    'eco': 'Economics', 'economics': 'Economics',
    'eng': 'English', 'english': 'English',
    'sat': 'SAT',
  };
  const subject = subjectMap[subjectKey.toLowerCase()] || subjectKey;

  const gradeSubjects = CURRICULUM[gradeStr];
  if (!gradeSubjects[subject]) {
    console.error(`Subject "${subject}" not found for Grade ${grade}. Available: ${Object.keys(gradeSubjects).join(', ')}`);
    process.exit(1);
  }

  const subjectInfo = gradeSubjects[subject];

  // Determine which chapters to generate
  let chapters: { num: number; name: string }[] = [];
  if (chapterArg) {
    if (chapterArg < 1 || chapterArg > subjectInfo.chapters) {
      console.error(`Chapter ${chapterArg} out of range. ${subject} has ${subjectInfo.chapters} chapters.`);
      process.exit(1);
    }
    chapters = [{ num: chapterArg, name: `Chapter ${chapterArg}` }];
  } else {
    // Generate all chapters for the subject
    for (let i = 1; i <= subjectInfo.chapters; i++) {
      chapters.push({ num: i, name: `Chapter ${i}` });
    }
  }

  console.log(`\n=== AceMatric Content Generator ===`);
  console.log(`  Grade: ${grade}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Chapters: ${chapters.length}`);
  console.log(`  Save to DB: ${saveToDb}`);
  console.log(`  Status: ${publish ? 'published' : 'draft'}`);
  console.log(`===================================\n`);

  const results: any[] = [];

  for (const ch of chapters) {
    try {
      const content = await generateChapterContent(grade, subject, ch.num, ch.name);

      if (!dryRun) {
        const filePath = saveToJson(grade, subject, ch.num, content);
        console.log(`  ✓ Saved to: ${filePath}`);

        if (saveToDb) {
          const dbResult = await saveToDatabase(grade, subject, ch.num, content, publish ? 'published' : 'draft');
          console.log(`  ✓ Saved to DB: ${dbResult.id} (v${dbResult.version}, ${dbResult.status})`);
        }
      } else {
        console.log(`  ✓ Generated (dry run — not saved)`);
      }

      results.push({ grade, subject, chapter: ch.num, status: 'success' });

      // Rate limit: wait 2s between requests
      if (chapters.length > 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err: any) {
      console.error(`  ✗ Failed Ch${ch.num}: ${err.message}`);
      results.push({ grade, subject, chapter: ch.num, status: 'failed', error: err.message });
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Total: ${results.length}`);
  console.log(`  Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`  Failed: ${results.filter(r => r.status === 'failed').length}`);
  if (results.some(r => r.status === 'failed')) {
    console.log(`  Failed chapters: ${results.filter(r => r.status === 'failed').map(r => r.chapter).join(', ')}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
