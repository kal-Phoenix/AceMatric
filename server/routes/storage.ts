import { Router } from 'express';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { requireAuth, uploadLimiter, isAdminUser } from '../middleware';
import { imageUpload, MIME_TO_EXT } from '../upload-utils';

const router = Router();

const BUCKET_MAP: Record<string, string> = {
  'payment-screenshots': 'payment-screenshots',
  'past-papers': 'past-papers',
  'avatars': 'avatars',
};

// These buckets contain sensitive/review-facing content — only admins may upload.
const ADMIN_BUCKETS = new Set(['payment-screenshots', 'past-papers']);

function isPathSafe(filePath: string): boolean {
  if (typeof filePath !== 'string' || !filePath) return false;
  // Supabase storage always uses forward slashes. Reject backslashes (which
  // normalize differently per-platform) and any '..' segment outright.
  const normalized = filePath.replace(/\\/g, '/');
  return normalized === filePath && !filePath.split('/').includes('..');
}

async function validateFileMagicBytes(buffer: Buffer, declaredMime: string): Promise<boolean> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return declaredMime === 'image/gif';
  return detected.mime === declaredMime;
}

// POST /api/storage/upload
router.post('/upload', requireAuth, uploadLimiter, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const bucket = req.body.bucket;
    if (!bucket || !BUCKET_MAP[bucket]) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }
    if (ADMIN_BUCKETS.has(bucket) && !(await isAdminUser(req.user!.email))) {
      return res.status(403).json({ error: 'You do not have permission to upload to this bucket' });
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
