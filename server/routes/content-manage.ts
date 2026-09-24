import { Router } from 'express';
import sanitizeHtml from 'sanitize-html';
import { requireAuth, requireAdmin } from '../middleware';
import { logAudit } from '../audit';
import {
  upsertContent,
  getContent,
  listContent,
  deleteContent,
  duplicateContent,
  getContentVersions,
  type ContentEntry,
} from '../content-db';

const router = Router();

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

// GET /api/content-manage/list
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const filters = {
      subject: req.query.subject as string | undefined,
      grade: req.query.grade ? Number(req.query.grade) : undefined,
      stream: req.query.stream as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const data = await listContent(filters);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list content' });
  }
});

// GET /api/content-manage/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const all = await listContent();
    const subjects = [...new Set(all.map((e: any) => e.subject))].sort();
    res.json({
      total: all.length,
      published: all.filter((e: any) => e.status === 'published').length,
      draft: all.filter((e: any) => e.status === 'draft').length,
      subjects,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// POST /api/content-manage/save
router.post('/save', requireAdmin, async (req, res) => {
  try {
    const input = req.body;
    if (!input.subject || !input.grade || !input.chapterNumber || !input.title) {
      return res.status(400).json({ error: 'subject, grade, chapterNumber, and title are required' });
    }

    // Sanitize HTML fields before saving
    if (input.contentHtml) input.contentHtml = sanitizeContentHtml(input.contentHtml);
    if (input.overview) input.overview = sanitizeContentHtml(input.overview);
    if (input.examTips) input.examTips = sanitizeContentHtml(input.examTips);
    if (input.subtopics && Array.isArray(input.subtopics)) {
      for (const sub of input.subtopics) {
        if (sub.content) sub.content = sanitizeContentHtml(sub.content);
      }
    }

    const saved = await upsertContent(input);
    await logAudit({ adminEmail: req.user!.email, action: 'content.save', details: { subject: input.subject, grade: input.grade, chapter: input.chapterNumber } });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// POST /api/content-manage/batch-save
router.post('/batch-save', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    let saved = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const input of items) {
      try {
        if (!input.subject || !input.grade || !input.chapterNumber || !input.title) {
          failed++;
          errors.push(`Missing required fields for item: ${JSON.stringify({ subject: input.subject, grade: input.grade, chapter: input.chapterNumber })}`);
          continue;
        }
        if (input.contentHtml) input.contentHtml = sanitizeContentHtml(input.contentHtml);
        if (input.overview) input.overview = sanitizeContentHtml(input.overview);
        if (input.examTips) input.examTips = sanitizeContentHtml(input.examTips);
        if (input.subtopics && Array.isArray(input.subtopics)) {
          for (const sub of input.subtopics) {
            if (sub.content) sub.content = sanitizeContentHtml(sub.content);
          }
        }
        await upsertContent(input);
        saved++;
      } catch (err: any) {
        failed++;
        errors.push(`Failed to save ${input.subject} G${input.grade} Ch${input.chapterNumber}: ${err.message}`);
      }
    }

    await logAudit({ adminEmail: req.user!.email, action: 'content.batch-save', details: { total: items.length, saved, failed } });
    res.json({ saved, failed, total: items.length, errors });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to batch save content' });
  }
});

// POST /api/content-manage/duplicate
router.post('/duplicate', requireAdmin, async (req, res) => {
  try {
    const { subject, grade, chapterNumber, newChapterNumber } = req.body;
    if (!subject || !grade || !chapterNumber || !newChapterNumber) {
      return res.status(400).json({ error: 'subject, grade, chapterNumber, and newChapterNumber are required' });
    }
    const result = await duplicateContent(subject, grade, chapterNumber, newChapterNumber);
    await logAudit({ adminEmail: req.user!.email, action: 'content.duplicate', details: { subject, grade, from: chapterNumber, to: newChapterNumber } });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate content' });
  }
});

// GET /api/content-manage/:subject/:grade/:chapter/versions
router.get('/:subject/:grade/:chapter/versions', requireAdmin, async (req, res) => {
  try {
    const { grade, subject, chapter } = req.params;
    const versions = await getContentVersions(subject, Number(grade), Number(chapter));
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// GET /api/content-manage/:subject/:grade/:chapter
router.get('/:subject/:grade/:chapter', requireAdmin, async (req, res) => {
  try {
    const { grade, subject, chapter } = req.params;
    const entry = await getContent(subject, Number(grade), Number(chapter));
    if (!entry) return res.status(404).json({ error: 'Content not found' });
    res.json(entry);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// DELETE /api/content-manage/:subject/:grade/:chapter
router.delete('/:subject/:grade/:chapter', requireAdmin, async (req, res) => {
  try {
    const { grade, subject, chapter } = req.params;
    const chapterNumber = Number(chapter);
    const gradeNum = Number(grade);
    if (!subject || isNaN(gradeNum) || isNaN(chapterNumber)) {
      return res.status(400).json({ error: 'subject, grade, and chapter are required' });
    }

    const entry = await getContent(subject, gradeNum, chapterNumber);
    if (!entry) return res.status(404).json({ error: 'Content not found' });

    await deleteContent(subject, gradeNum, chapterNumber);
    await logAudit({ adminEmail: req.user!.email, action: 'content.delete', details: { subject, grade: gradeNum, chapter: chapterNumber } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

export default router;
