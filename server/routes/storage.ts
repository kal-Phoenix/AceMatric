import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { requireAuth, uploadLimiter } from '../middleware';

const router = Router();

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  }
});

const BUCKET_MAP: Record<string, string> = {
  'payment-screenshots': 'payment-screenshots',
  'note-images': 'note-images',
  'study-images': 'study-images',
  'past-papers': 'past-papers',
};

function isPathSafe(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return normalized === filePath && !filePath.includes('..');
}

async function validateFileMagicBytes(buffer: Buffer, declaredMime: string): Promise<boolean> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return declaredMime === 'image/gif';
  return detected.mime === declaredMime;
}

// POST /api/storage/upload
router.post('/upload', requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const bucket = req.body.bucket;
    if (!bucket || !BUCKET_MAP[bucket]) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    // Validate magic bytes
    const valid = await validateFileMagicBytes(req.file.buffer, req.file.mimetype);
    if (!valid) {
      return res.status(400).json({ error: 'File content does not match declared type' });
    }

    const ext = MIME_TO_EXT[req.file.mimetype] || '.jpg';
    const fileName = `${crypto.randomUUID()}${ext}`;
    const userFilePath = `${req.user!.email}/${fileName}`;

    const { getSupabase } = await import('../db');
    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(userFilePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(userFilePath);

    res.json({ url: urlData.publicUrl, path: userFilePath });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/storage/delete
router.post('/delete', requireAuth, async (req, res) => {
  try {
    const { bucket, path: filePath } = req.body;
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'bucket and path are required' });
    }
    if (!BUCKET_MAP[bucket]) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    // Path traversal protection: normalize and reject .. segments
    if (!isPathSafe(filePath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Ownership check: users can only delete their own files
    const userEmail = req.user!.email;
    const expectedPrefix = userEmail + '/';
    if (!filePath.startsWith(expectedPrefix) || filePath === expectedPrefix) {
      return res.status(403).json({ error: 'You can only delete your own files' });
    }

    // Ensure no directory traversal after the email prefix
    const relativePath = filePath.slice(expectedPrefix.length);
    if (relativePath.includes('/') || relativePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const { getSupabase } = await import('../db');
    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
