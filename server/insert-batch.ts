import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { upsertContent } from './content-db';

const raw = fs.readFileSync(path.resolve(__dirname, '..', '_batch-data.json'), 'utf-8').replace(/^\uFEFF/, '');
const batch = JSON.parse(raw);

const targetGrades = process.argv[2] ? [parseInt(process.argv[2])] : Object.keys(batch.grades).map(Number);

async function insert() {
  let total = 0;
  let failed = 0;
  try {
    for (const grade of targetGrades) {
      const chapters = batch.grades[String(grade)] || [];
      for (const ch of chapters) {
        const data = {
          subject: batch.subject,
          grade,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          overview: ch.overview || '',
          corePoints: ch.corePoints || [],
          examTips: ch.examTips || '',
          youtubeVideoId: ch.youtubeVideoId || '',
          videoDuration: ch.videoDuration || '',
          materials: ch.materials || [],
          subtopics: ch.subtopics || [],
          contentHtml: ch.contentHtml || '',
          status: 'published' as const,
        };
        try {
          await upsertContent(data);
          total++;
          console.log(`[ok] ${batch.subject} g${grade} ch${ch.chapterNumber}: ${ch.title}`);
        } catch (err: any) {
          failed++;
          console.error(`[fail] ${batch.subject} g${grade} ch${ch.chapterNumber}: ${err.message}`);
        }
      }
    }
    console.log(`\nDone: ${total} inserted, ${failed} failed`);
    process.exit(0);
  } catch (err: any) {
    console.error('[insert] Fatal:', err.message);
    process.exit(1);
  }
}

insert();
