import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { upsertContent } from './content-db';

const raw = fs.readFileSync(path.resolve(__dirname, '..', '_chapter-data.json'), 'utf-8').replace(/^\uFEFF/, '');
const chapterData = JSON.parse(raw);

const subject = process.argv[2] || chapterData.subject || 'SAT';
const GRADES = process.argv[3] ? [parseInt(process.argv[3])] : [9, 10, 11, 12];

async function insert() {
  try {
    for (const grade of GRADES) {
      const data = {
        subject,
        grade,
        chapterNumber: chapterData.chapterNumber,
        title: chapterData.title,
        overview: chapterData.overview,
        corePoints: chapterData.corePoints,
        examTips: chapterData.examTips,
        youtubeVideoId: chapterData.youtubeVideoId || '',
        videoDuration: chapterData.videoDuration || '',
        materials: chapterData.materials,
        subtopics: chapterData.subtopics,
        contentHtml: chapterData.contentHtml || '',
        status: 'published' as const,
      };
      console.log(`[insert] ${data.subject} Grade ${data.grade} Chapter ${data.chapterNumber}: ${data.title}`);
      const result = await upsertContent(data);
      console.log(`[insert] Saved: ${result.subject}/g${result.grade}/ch${result.chapterNumber}`);
      console.log(`[insert] Subtopics: ${result.subtopics.length} | Materials: ${result.materials.length} | Core Points: ${result.corePoints.length}`);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('[insert] Failed:', err.message);
    process.exit(1);
  }
}

insert();
