import { Router } from 'express';
import { requireAuth } from '../middleware';
import { getContent } from '../content-db';

const router = Router();

// Reads from content_entries table (seeded from TS files via seed script)
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const grade = parseInt(req.query.grade as string, 10);
    const subject = req.query.subject as string;
    const chapter = parseInt(req.query.chapter as string, 10);

    if (!grade || !subject || !chapter) {
      return res.status(400).json({ error: 'grade, subject, and chapter are required' });
    }

    const entry = await getContent(subject, grade, chapter, 'published');
    if (!entry) {
      return res.status(404).json({ error: 'Chapter content not found' });
    }

    res.json({
      title: entry.title,
      overview: entry.overview,
      corePoints: entry.corePoints,
      examTips: entry.examTips,
      youtubeVideoId: entry.youtubeVideoId,
      videoDuration: entry.videoDuration,
      materials: entry.materials,
      subtopics: entry.subtopics,
      contentHtml: entry.contentHtml,
    });
  } catch (err: any) {
    console.error('[content] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch chapter content' });
  }
});

export default router;
