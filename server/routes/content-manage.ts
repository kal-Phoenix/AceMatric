import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sanitizeHtml from 'sanitize-html';
import { requireAuth, requireAdmin, uploadLimiter } from '../middleware';
import { logAudit } from '../audit';
import { getSupabase } from '../db';
import {
  upsertContent,
  getContent,
  listContent,
  deleteContent,
  duplicateContent,
  getContentVersions,
  listContentImages,
  extractImageFilesFromEntry,
  type ContentEntry,
} from '../content-db';

const router = Router();

const BUCKET = 'content-images';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'figure', 'figcaption', 'div', 'span', 'br',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'style', 'draggable'],
    div: ['data-image-wrap', 'data-position', 'data-width', 'style', 'class'],
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
  allowedSchemesByTag: {
    img: ['https', 'http'],
  },
  exclusiveFilter: (frame) => {
    if (frame.tag === 'p' && frame.text.trim() === '') return false;
    return false;
  },
};

function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

async function validateFileMagicBytes(buffer: Buffer, declaredMime: string): Promise<boolean> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return declaredMime === 'image/gif';
  return detected.mime === declaredMime;
}

// ── Static routes (must come before parameterized routes) ────────────────

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

// GET /api/content-manage/images — list all uploaded content images
router.get('/images', requireAdmin, async (_req, res) => {
  try {
    const images = await listContentImages();
    res.json(images);
  } catch {
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// GET /api/content-manage/images/:filename — serve a single image (redirect to Supabase URL)
// No auth required — bucket is public; <img> tags cannot send Bearer tokens
router.get('/images/:filename', async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (safeName !== req.params.filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const supabase = getSupabase();
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(safeName);
    if (!data?.publicUrl) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.redirect(data.publicUrl);
  } catch {
    res.status(500).json({ error: 'Failed to serve image' });
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

// POST /api/content-manage/upload-image
router.post('/upload-image', requireAdmin, uploadLimiter, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate magic bytes match declared MIME type
    const valid = await validateFileMagicBytes(req.file.buffer, req.file.mimetype);
    if (!valid) {
      return res.status(400).json({ error: 'File content does not match declared type' });
    }

    const ext = MIME_TO_EXT[req.file.mimetype] || path.extname(req.file.originalname) || '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('[content-manage] Supabase upload error:', error.message);
      return res.status(500).json({ error: 'Image upload failed' });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    const imageUrl = urlData?.publicUrl || `/api/content-manage/images/${filename}`;
    res.json({
      url: imageUrl,
      publicUrl: urlData?.publicUrl || imageUrl,
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// POST /api/content-manage/delete-image
router.post('/delete-image', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename is required' });
    const safeName = path.basename(filename);

    const supabase = getSupabase();
    await supabase.storage.from(BUCKET).remove([safeName]);

    await logAudit({ adminEmail: req.user!.email, action: 'content.delete-image', details: { filename: safeName } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete image' });
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

// ── Parameterized routes (must come after static routes) ─────────────────

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

    const imageFiles = extractImageFilesFromEntry(entry);
    if (imageFiles.length > 0) {
      const supabase = getSupabase();
      await supabase.storage.from(BUCKET).remove(imageFiles);
    }

    await deleteContent(subject, gradeNum, chapterNumber);
    await logAudit({ adminEmail: req.user!.email, action: 'content.delete', details: { subject, grade: gradeNum, chapter: chapterNumber } });
    res.json({ success: true, imagesRemoved: imageFiles.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

export default router;
