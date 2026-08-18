import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { supabase, formatSupabaseError } from '../db';
import { requireAuth, aiLimiter } from '../middleware';
import { validateBody, conceptExplainerSchema, studyPlanSchema, askTutorSchema, proAuditSchema } from '../validation';

const router = Router();

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
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
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function escapeMarkdownContent(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;');
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

// POST /api/ai/concept-explainer
router.post('/concept-explainer', requireAuth, aiLimiter, validateBody(conceptExplainerSchema), async (req, res) => {
  try {
    const { prompt, subject, language } = req.body;

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        explanation: `[Simulated AI Tutor Response]\n\n**Subject: ${escapeMarkdownContent(subject || 'General')}**\n\nTo solve this question efficiently:\n1. **Core Concept**: Identify the fundamental governing formula.\n2. **Step-by-Step**: Substitute variables into the equation.\n3. **Exam Shortcut**: Eliminate obvious wrong distractors first.\n\n*(Configure API key for live AI responses.)*`,
      });
    }

    const systemInstruction = `You are an expert Ethiopian Grade 12 National Entrance Exam (Matric) tutor. Explain concepts clearly, highlighting key formulas, step-by-step solutions, common exam pitfalls, and time-saving shortcuts.`;

    const safeSubject = sanitizeInput(subject);
    const safePrompt = sanitizeInput(prompt);

    let explanationText = '';
    try {
      const response = await safeGenerateContent(ai, {
        model: 'gemini-3.5-flash',
        contents: `Subject: ${safeSubject || 'General Grade 12'}\nStudent Question: "${safePrompt}"`,
        config: { systemInstruction, temperature: 0.7, maxOutputTokens: 2000 },
      });
      explanationText = response.text || '';
    } catch {
      explanationText = `### Concept Explainer (Fallback)\n**Subject: ${escapeMarkdownContent(subject || 'General')}**\n\n1. **Core Concept**: Break down "${escapeMarkdownContent(prompt || '')}" into primary elements.\n2. **Step-by-Step**: Write down values, match against formulas, solve.\n3. **Exam Tip**: Eliminate extreme values to double your chances.\n\n*Your Query: "${escapeMarkdownContent(prompt || '')}"*`;
    }

    res.json({ explanation: sanitizeAIOutput(explanationText) });
  } catch (error: any) {
    console.error('AI Explainer Error:', error);
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
    startDate.setDate(startDate.getDate() + 1);
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const w1Start = new Date(startDate);
    const w1End = new Date(startDate); w1End.setDate(w1End.getDate() + 6);
    const w2Start = new Date(w1End); w2Start.setDate(w2Start.getDate() + 1);
    const w2End = new Date(w2Start); w2End.setDate(w2End.getDate() + 6);
    const w3Start = new Date(w2End); w3Start.setDate(w3Start.getDate() + 1);
    const w3End = new Date(w3Start); w3End.setDate(w3End.getDate() + 6);
    const w4Start = new Date(w3End); w4Start.setDate(w4Start.getDate() + 1);
    const w4End = new Date(w4Start); w4End.setDate(w4End.getDate() + 6);

    const ai = getAIClient();
    const systemInstruction = `You are an elite academic coach for Ethiopian university entrance exams. Generate a structured study plan as a Markdown Table with headers: "Date Range", "Subjects / Topics", "Daily Action Items", and "Target Goal / Deliverable". Output ONLY the table.`;

    const promptText = `Generate a structured 4-week study plan starting tomorrow for an Ethiopian Grade 12 student in the ${sanitizeInput(stream)} stream.
- School: ${sanitizeInput(school) || 'General preparatory academy'}
- Region: ${sanitizeInput(region) || 'Addis Ababa'}
- Target Score: ${targetScore}/600
- Daily Hours: ${currentHours} hrs/day
- Study Style: ${sanitizeInput(studyStyle) || 'Practice / Quiz'}
- Study Time: ${sanitizeInput(studyTimeOfDay) || 'Flexible'}
- Strategy: ${sanitizeInput(examFocusStrategy) || 'Balanced'}
- Challenge: ${sanitizeInput(biggestChallenge) || 'Time Management'}
- Mock Frequency: ${sanitizeInput(mockFrequency) || 'Weekly'}
- Weak Subjects: ${weakSubjects?.map((s: string) => sanitizeInput(s)).join(', ') || 'All Core Subjects'}
- Week 1: ${formatDate(w1Start)} – ${formatDate(w1End)}
- Week 2: ${formatDate(w2Start)} – ${formatDate(w2End)}
- Week 3: ${formatDate(w3Start)} – ${formatDate(w3End)}
- Week 4: ${formatDate(w4Start)} – ${formatDate(w4End)}`;

    let planText = '';
    if (ai) {
      try {
        const response = await safeGenerateContent(ai, {
          model: 'gemini-3.5-flash',
          contents: promptText,
          config: { systemInstruction, temperature: 0.3, maxOutputTokens: 4000 },
        });
        planText = response.text || '';
      } catch {
        console.warn('Gemini API failed for Study Plan, using fallback');
      }
    }

    if (!planText) {
      planText = `### Custom 4-Week Study Roadmap

| Date Range | Subjects / Topics | Daily Action Items | Target Goal |
| :--- | :--- | :--- | :--- |
| **${formatDate(w1Start)} – ${formatDate(w1End)}** | Focus on: ${weakList} + Core | Leverage ${studyStyle} style, focus 25-min intervals | Complete foundational revision |
| **${formatDate(w2Start)} – ${formatDate(w2End)}** | Core ${stream} + SAT drills | 30 timed topic questions daily | Score 70%+ benchmarks |
| **${formatDate(w3Start)} – ${formatDate(w3End)}** | All subjects + past papers | Mock exams per ${mockFrequency} schedule | Reach ${targetScore}/600 threshold |
| **${formatDate(w4Start)} – ${formatDate(w4End)}** | High-yield revisions | Light speed drills, no cramming | Peak confidence & focus |`;
    }

    // Persist the roadmap to the user's profile
    const { error: saveErr } = await supabase
      .from('student_profiles')
      .update({ custom_roadmap: planText })
      .eq('email', req.user!.email);

    if (saveErr) {
      console.warn('[ai] Failed to persist study plan:', saveErr.message);
    }

    res.json({ plan: sanitizeAIOutput(planText) });
  } catch (error: any) {
    console.error('Study Plan Error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// POST /api/ai/ask-tutor
router.post('/ask-tutor', requireAuth, aiLimiter, validateBody(askTutorSchema), async (req, res) => {
  try {
    const { question, subject } = req.body;
    const ai = getAIClient();
    if (!ai) {
      return res.json({
        reply: `Verified Tutor here. Great question on ${escapeMarkdownContent(subject || 'General')}. For the Matric exam, remember examiners test edge cases. Check equation symmetry and convert units to SI!`,
      });
    }

    let replyText = '';
    try {
      const response = await safeGenerateContent(ai, {
        model: 'gemini-3.5-flash',
        contents: `A student asked in the AceMatric forum:\nSubject: ${sanitizeInput(subject)}\nQuestion: "${sanitizeInput(question)}"\nWrite a friendly, encouraging, verified tutor reply explaining the answer concisely.`,
        config: { maxOutputTokens: 1500 },
      });
      replyText = response.text || '';
    } catch {
      replyText = `Verified Tutor here. I see you asked: "${escapeMarkdownContent(question || '')}".\n\nFor **${escapeMarkdownContent(subject || 'General')}**:\n- Double-check core definitions and conditions.\n- Review past exam patterns.\n- Practice similar questions in our Practice Bank.\n\nStay focused, you will ace this!`;
    }

    res.json({ reply: sanitizeAIOutput(replyText) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

// POST /api/ai/pro-audit
router.post('/pro-audit', requireAuth, aiLimiter, validateBody(proAuditSchema), async (req, res) => {
  try {
    const { name, school, region, preparationLevel, studyStyle, weakSubjects, targetScore, dailyGoalHours, totalMinutesStudied, studiedChaptersCount } = req.body;
    const ai = getAIClient();
    const systemInstruction = `You are the chief academic strategist at AceMatric. Produce elite study audit reports in professional Markdown. Use clear bullet points and actionable strategies.`;

    const promptText = `Generate a Pro Study Audit for:
- Name: ${sanitizeInput(name) || 'Student'}
- School: ${sanitizeInput(school) || 'General Secondary School'}
- Region: ${sanitizeInput(region) || 'Addis Ababa'}
- Target: ${targetScore || 520}/600
- Prep Level: ${sanitizeInput(preparationLevel) || 'Medium'}
- Style: ${sanitizeInput(studyStyle) || 'Visual'}
- Weak Subjects: ${weakSubjects?.map((s: string) => sanitizeInput(s)).join(', ') || 'None'}
- Daily Target: ${dailyGoalHours || 4} hrs
- Progress: ${totalMinutesStudied || 0} min, ${studiedChaptersCount || 0} units

Include: Executive Summary, Strengths, Weak Subject Attack Plan, Final Recommendations. Output ONLY clean markdown.`;

    let auditText = '';
    if (ai) {
      try {
        const response = await safeGenerateContent(ai, {
          model: 'gemini-3.5-flash',
          contents: promptText,
          config: { systemInstruction, temperature: 0.7, maxOutputTokens: 3000 },
        });
        auditText = response.text || '';
      } catch {
        console.warn('Gemini API failed for Pro Audit');
      }
    }

    if (!auditText) {
      auditText = `### Pro Study Audit
**Prepared for**: ${escapeMarkdownContent(name || 'Student')} | **Target**: ${targetScore || 520}/600

#### 1. Executive Summary
Your target of **${targetScore || 520}/600** is competitive. With **${dailyGoalHours || 4} hours/day**, you can reach it with consistency.

#### 2. Study Style: ${escapeMarkdownContent(studyStyle || 'Balanced')}
Leverage this style with mind maps, flashcards, and timed problem-solving.

#### 3. Weak Subject Attack: ${escapeMarkdownContent(weakSubjects?.join(', ') || 'All')}
- Allocate first 50% of daily time to weak areas
- Solve 15+ MCQs daily in these subjects
- Use the Curriculum Matrix to track progress

#### 4. Final Recommendations
1. Eliminate passive studying — every hour needs 10+ active recall questions
2. Focus on weak areas for 14 continuous days
3. Complete one full mock exam weekly under strict timing`;
    }

    res.json({ audit: sanitizeAIOutput(auditText) });
  } catch (error: any) {
    console.error('Pro Audit Error:', error);
    res.status(500).json({ error: 'Failed to generate audit' });
  }
});

export default router;
