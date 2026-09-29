import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import sanitizeHtml from 'sanitize-html';
import { supabaseAdmin as supabase, formatSupabaseError } from '../db';
import { requireAuth, aiLimiter } from '../middleware';
import { validateBody, conceptExplainerSchema, studyPlanSchema, askTutorSchema } from '../validation';

const router = Router();

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your-gemini-api-key') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, 2000);
}

function sanitizeAIOutput(text: string): string {
  if (!text) return '';
  return sanitizeHtml(text, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'figure', 'figcaption', 'div', 'span', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      div: ['data-position', 'data-width', 'style', 'class'],
      figure: ['style', 'class'],
      span: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
      '*': ['class'],
    },
    allowedSchemes: ['https', 'http'],
  });
}

async function safeGenerateContent(ai: any, params: any, maxRetries = 2) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const p = { ...params, model: modelName };
      return await ai.models.generateContent(p);
    } catch (err: any) {
      lastError = err;
      console.warn(`[ai] Model ${modelName} failed, trying next fallback:`, err.message || err);
    }
  }
  throw lastError;
}

/**
 * Intelligent curriculum fallback grounded in the actual database chapters and questions
 * when Gemini API key is unavailable, rate-limited, or offline.
 */
async function generateCurriculumFallback(subject: string, query: string): Promise<string> {
  try {
    const safeSubj = sanitizeInput(subject);
    const safeQ = sanitizeInput(query);

    let queryBuilder = supabase
      .from('content_entries')
      .select('title, overview, core_points, exam_tips, materials, subtopics');

    if (safeSubj && safeSubj !== 'General') {
      queryBuilder = queryBuilder.ilike('subject', `%${safeSubj}%`);
    }

    const { data: entries } = await queryBuilder.limit(3);

    if (entries && entries.length > 0) {
      const best = entries[0];
      const corePts = typeof best.core_points === 'string' ? JSON.parse(best.core_points) : best.core_points;
      const materials = typeof best.materials === 'string' ? JSON.parse(best.materials) : best.materials;

      let response = `<h3>Understanding: ${best.title}</h3>`;
      if (best.overview) {
        response += `<p>${best.overview}</p>`;
      }

      if (materials && materials.length > 0) {
        response += `<h4>Key Principles & Formulas:</h4><ul>`;
        materials.slice(0, 4).forEach((m: any) => {
          response += `<li><strong>${m.name}:</strong> ${m.formula ? `<code>${m.formula}</code> — ` : ''}${m.description}</li>`;
        });
        response += `</ul>`;
      }

      if (corePts && corePts.length > 0) {
        response += `<h4>Matric Focus Points:</h4><ul>`;
        corePts.slice(0, 4).forEach((p: string) => {
          response += `<li>${p}</li>`;
        });
        response += `</ul>`;
      }

      if (best.exam_tips) {
        response += `<blockquote><strong>National Exam Tip:</strong> ${best.exam_tips}</blockquote>`;
      }

      return response;
    }
  } catch (err) {
    console.warn('[ai] Fallback generation error:', err);
  }

  return `<p>Here is a step-by-step conceptual breakdown for <strong>${subject || 'Grade 12'}</strong>:</p>
  <ul>
    <li><strong>Core Principle:</strong> Break down the problem into given values, relevant governing laws, and required unknowns.</li>
    <li><strong>Key Formula / Identity:</strong> Ensure all measurements are converted to SI standard units before calculation.</li>
    <li><strong>Matric Exam Shortcut:</strong> Double-check edge conditions and use process of elimination on multiple-choice options.</li>
  </ul>
  <p>Feel free to specify a particular question or unit number for a deeper step-by-step worked solution!</p>`;
}

// POST /api/ai/concept-explainer
router.post('/concept-explainer', requireAuth, aiLimiter, validateBody(conceptExplainerSchema), async (req, res) => {
  try {
    const { prompt, subject, language, history } = req.body;

    const safeSubject = sanitizeInput(subject);
    const safePrompt = sanitizeInput(prompt);

    const ai = getAIClient();

    if (!ai) {
      // Grounded curriculum database fallback
      const fallback = await generateCurriculumFallback(safeSubject, safePrompt);
      return res.json({ explanation: sanitizeAIOutput(fallback) });
    }

    const systemInstruction = `You are an expert Ethiopian Grade 11-12 National Entrance Exam (Matric) tutor at AceMatric.
Explain concepts clearly and encouragingly. Always include:
1. Clear, precise conceptual explanation with intuition
2. Governing formulas, identities, or equations with variable definitions
3. A step-by-step worked example showing calculation steps
4. Matric Exam Tips: Common pitfalls, time-saving shortcuts, and trap choices to avoid.
Use clean HTML tags: <h3>, <h4>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <code>, <blockquote>.`;

    let explanationText = '';
    try {
      // Multi-turn context
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-4).forEach((h: any) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: sanitizeInput(h.text) }]
          });
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: `Subject: ${safeSubject || 'General Matric'}\nLanguage: ${language === 'am' ? 'Amharic (support with English terminology)' : 'English'}\nQuestion: "${safePrompt}"` }]
      });

      const response = await safeGenerateContent(ai, {
        contents,
        config: { systemInstruction, temperature: 0.6, maxOutputTokens: 2500 },
      });
      explanationText = response.text || '';
    } catch (aiErr) {
      console.warn('[ai] Gemini failed, using curriculum database fallback:', (aiErr as any)?.message);
      explanationText = await generateCurriculumFallback(safeSubject, safePrompt);
    }

    res.json({ explanation: sanitizeAIOutput(explanationText) });
  } catch (error: any) {
    console.error('[ai] Explainer error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// POST /api/ai/study-plan
router.post('/study-plan', requireAuth, aiLimiter, validateBody(studyPlanSchema), async (req, res) => {
  try {
    const {
      targetScore, currentHours, weakSubjects, stream,
      school, region, preparationLevel, studyStyle,
      studyTimeOfDay, examFocusStrategy, biggestChallenge, mockFrequency
    } = req.body;

    const weakList = weakSubjects?.length > 0 ? weakSubjects.join(', ') : 'All Core Subjects';
    const startDate = new Date();
    const formattedStartDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured. Set GEMINI_API_KEY.' });
    }

    const systemInstruction = `You are an elite educational strategist for the Ethiopian National Matric Exam. Create highly personalized, structured study schedules in clean Markdown.`;

    const promptText = `Generate a personalized study roadmap for an Ethiopian Matric student with these details:
- Target Score: ${targetScore || 520}/600
- Daily Study Time: ${currentHours || 4} hours
- Stream: ${sanitizeInput(stream) || 'Natural Science'}
- Priority Weak Subjects: ${weakList}
- School: ${sanitizeInput(school) || 'General Secondary School'}
- Region: ${sanitizeInput(region) || 'Addis Ababa'}
- Current Prep Level: ${sanitizeInput(preparationLevel) || 'Medium'}
- Preferred Study Style: ${sanitizeInput(studyStyle) || 'Visual'}
- Study Time of Day: ${sanitizeInput(studyTimeOfDay) || 'Evening'}
- Exam Strategy: ${sanitizeInput(examFocusStrategy) || 'Balanced'}
- Biggest Challenge: ${sanitizeInput(biggestChallenge) || 'Time management'}
- Mock Frequency: ${sanitizeInput(mockFrequency) || 'Weekly'}
- Start Date: ${formattedStartDate}

Create a structured study plan with phases, daily schedules, and mock targets. Output ONLY clean markdown.`;

    let planText = '';
    try {
      const response = await safeGenerateContent(ai, {
        contents: promptText,
        config: { systemInstruction, temperature: 0.7, maxOutputTokens: 2500 },
      });
      planText = response.text || '';
    } catch {
      return res.status(502).json({ error: 'AI generation failed. Please try again.' });
    }

    res.json({ plan: sanitizeAIOutput(planText) });
  } catch (error: any) {
    console.error('[ai] Study plan error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// POST /api/ai/ask-tutor
router.post('/ask-tutor', requireAuth, aiLimiter, validateBody(askTutorSchema), async (req, res) => {
  try {
    const { question, subject } = req.body;
    const ai = getAIClient();
    if (!ai) {
      const fallback = await generateCurriculumFallback(subject || 'General', question);
      return res.json({ reply: sanitizeAIOutput(fallback) });
    }

    let replyText = '';
    try {
      const response = await safeGenerateContent(ai, {
        contents: `A student asked in AceMatric:\nSubject: ${sanitizeInput(subject)}\nQuestion: "${sanitizeInput(question)}"\nWrite a friendly, encouraging tutor reply explaining the answer step by step.`,
        config: { maxOutputTokens: 1500 },
      });
      replyText = response.text || '';
    } catch {
      replyText = await generateCurriculumFallback(subject || 'General', question);
    }

    res.json({ reply: sanitizeAIOutput(replyText) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

export default router;
