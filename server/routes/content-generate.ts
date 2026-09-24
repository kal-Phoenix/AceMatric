import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import sanitizeHtml from 'sanitize-html';
import { requireAuth, requireAdmin } from '../middleware';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'figure', 'figcaption', 'div', 'span', 'br',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    div: ['data-position', 'data-width', 'style', 'class'],
    figure: ['style', 'class'],
    span: ['class'],
    '*': ['class'],
  },
  allowedStyles: {
    '*': {
      width: [/.*/],
      'max-width': [/.*/],
      float: [/.*/],
      margin: [/.*/],
      display: [/.*/],
      height: [/.*/],
    },
  },
  allowedSchemes: ['https', 'http'],
  exclusiveFilter: (frame) => {
    if (frame.tag === 'p' && frame.text.trim() === '') return false;
    return false;
  },
};

function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function sanitizeGeneratedContent(content: any): any {
  if (!content) return content;
  if (content.overview) {
    content.overview = sanitizeContentHtml(content.overview);
  }
  if (content.examTips) {
    content.examTips = sanitizeContentHtml(content.examTips);
  }
  if (Array.isArray(content.subtopics)) {
    for (const subtopic of content.subtopics) {
      if (subtopic.content) {
        subtopic.content = sanitizeContentHtml(subtopic.content);
      }
      if (subtopic.examInsight) {
        subtopic.examInsight = sanitizeContentHtml(subtopic.examInsight);
      }
    }
  }
  if (Array.isArray(content.materials)) {
    for (const material of content.materials) {
      if (material.description) {
        material.description = sanitizeContentHtml(material.description);
      }
    }
  }
  return content;
}

const router = Router();

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function safeGenerateContent(ai: any, params: any, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const errorMsg = error.message || '';
      const status = error.status || (error.error && error.error.code) || 500;
      const isTransient = status === 503 || status === 429 ||
        errorMsg.includes('503') || errorMsg.includes('429') ||
        errorMsg.includes('UNAVAILABLE') || errorMsg.includes('high demand') ||
        errorMsg.includes('fetch failed');
      if (isTransient && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}

function buildSystemPrompt(subject: string): string {
  const subjectLower = subject.toLowerCase();
  const isSTEM = ['physics', 'chemistry', 'biology', 'maths', 'mathematics'].includes(subjectLower);
  const isHistory = subjectLower === 'history';
  const isSocial = ['geography', 'economics'].includes(subjectLower);

  let subjectGuidance = '';
  if (isSTEM) {
    subjectGuidance = `
STEM subjects:
- Every subtopic MUST include relevant formulas, equations, or definitions where applicable.
- Use <strong> for key terms, <em> for emphasis.
- Include worked examples where they clarify a concept.
- Reference the Ethiopian Matric exam format and common question patterns.
- Use bullet points and numbered lists for clarity.
- Keep explanations concise but complete.
- For Mathematics: include step-by-step worked examples.
- For Physics/Chemistry: include SI units and formula variables.
- For Biology: define all technical terms.`;
  }
  if (isHistory) {
    subjectGuidance = `
History:
- Focus on cause-and-effect relationships and historical significance.
- Include specific dates, names, and places.
- Structure content chronologically.
- Highlight Ethiopian history alongside world history connections.`;
  }
  if (isSocial) {
    subjectGuidance = `
Geography/Economics:
- Include real-world examples, especially Ethiopian and African contexts.
- Define all terms precisely.
- Use data and statistics where relevant.
- Connect concepts to current issues in Ethiopia.`;
  }

  return `You are an expert Ethiopian National Matric Exam curriculum writer.

CRITICAL RULES:
- Content must be FACTUALLY ACCURATE. Do not invent facts or statistics.
- Content must align with the Ethiopian national curriculum for the Matric exam.
- Write for students preparing for their university entrance exam.
- Use clear, direct academic English. No filler, no fluff, no motivational quotes.
- Every subtopic must be substantive — at least 2-3 solid paragraphs of actual content.
- HTML formatting: use <p>, <strong>, <em>, <ul>, <ol>, <li>, <h4>, <h5>, <br/> only.
- Do NOT use <script>, <iframe>, or event handlers.
- Keep each subtopic focused on ONE specific concept.
${subjectGuidance}

OUTPUT FORMAT: Return valid JSON:
{
  "title": "Chapter title",
  "overview": "2-3 paragraph overview. HTML formatted.",
  "corePoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "examTips": "Specific exam advice. HTML formatted.",
  "materials": [
    { "name": "Term Name", "formula": "formula or empty string", "description": "Definition in 1-2 sentences" }
  ],
  "subtopics": [
    {
      "title": "Subtopic Title",
      "content": "HTML content. 2-3 paragraphs of substantive educational content.",
      "examInsight": "One specific exam tip for this subtopic"
    }
  ]
}

Generate 4-8 subtopics. Each subtopic content: 150-300 words. Include 3-8 materials. Include 5-7 core points.
Return ONLY the JSON object.`;
}

// POST /api/content-generate/preview — Generate content preview (returns JSON, doesn't save)
router.post('/preview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { grade, subject, chapterNumber, chapterName } = req.body;
    if (!grade || !subject || !chapterNumber) {
      return res.status(400).json({ error: 'grade, subject, and chapterNumber are required' });
    }

    const ai = getAIClient();
    if (!ai) return res.status(503).json({ error: 'AI service not configured' });

    const systemPrompt = buildSystemPrompt(subject);
    const userPrompt = `Generate study notes for Grade ${grade} ${subject} Chapter ${chapterNumber}: ${chapterName || 'Chapter ' + chapterNumber}`;

    const response = await safeGenerateContent(ai, {
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const rawText = (response as any).text || '';
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

    const content = sanitizeGeneratedContent(JSON.parse(jsonStr));
    res.json({ success: true, content });
  } catch (err: any) {
    console.error('[content-generate] Error:', err.message);
    res.status(500).json({ error: 'Content generation failed. Please try again.' });
  }
});

// POST /api/content-generate/save — Generate and save directly to database
router.post('/save', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { grade, subject, chapterNumber, chapterName, status } = req.body;
    if (!grade || !subject || !chapterNumber) {
      return res.status(400).json({ error: 'grade, subject, and chapterNumber are required' });
    }

    const ai = getAIClient();
    if (!ai) return res.status(503).json({ error: 'AI service not configured' });

    const systemPrompt = buildSystemPrompt(subject);
    const userPrompt = `Generate study notes for Grade ${grade} ${subject} Chapter ${chapterNumber}: ${chapterName || 'Chapter ' + chapterNumber}`;

    const response = await safeGenerateContent(ai, {
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const rawText = (response as any).text || '';
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

    const content = sanitizeGeneratedContent(JSON.parse(jsonStr));

    // Save to database
    const id = `${subject}/g${grade}/ch${chapterNumber}`;
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('content_entries')
      .select('version, content_html, youtube_video_id, video_duration')
      .eq('id', id)
      .single();

    const version = (existing?.version || 0) + 1;

    const validStatus = ['draft', 'published', 'archived'].includes(status) ? status : 'draft';

    const row = {
      id,
      subject,
      grade,
      chapter_number: chapterNumber,
      title: content.title || `Grade ${grade} ${subject} - Chapter ${chapterNumber}`,
      overview: content.overview || '',
      core_points: JSON.stringify(content.corePoints || []),
      exam_tips: content.examTips || '',
      // Preserve hand-edited content and media across regenerations instead of wiping them
      youtube_video_id: existing?.youtube_video_id || '',
      video_duration: existing?.video_duration || '',
      materials: JSON.stringify(content.materials || []),
      subtopics: JSON.stringify(content.subtopics || []),
      content_html: existing?.content_html || '',
      status: validStatus,
      updated_at: now,
      version,
    };

    const { error } = await supabase
      .from('content_entries')
      .upsert(row, { onConflict: 'id' });

    if (error) throw new Error(formatSupabaseError(error));

    res.json({
      success: true,
      id,
      version,
      status: row.status,
      title: content.title,
      subtopicCount: content.subtopics?.length || 0,
      materialCount: content.materials?.length || 0,
    });
  } catch (err: any) {
    console.error('[content-generate] Save error:', err.message);
    res.status(500).json({ error: 'Content generation failed. Please try again.' });
  }
});

export default router;
