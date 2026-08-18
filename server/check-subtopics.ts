import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { supabase } from './db';

async function check() {
  const { data: entries } = await supabase.from('content_entries').select('id, subtopics').eq('subject', 'English').eq('grade', 9).eq('chapter_number', 7).limit(1);
  if (!entries || !entries.length) { console.log('No entries'); process.exit(1); }
  
  const entry = entries[0];
  console.log('Entry:', entry.id);
  const subtopics = entry.subtopics as any[];
  console.log('First subtopic keys:', Object.keys(subtopics[0]));
  console.log('First subtopic:', JSON.stringify(subtopics[0]).substring(0, 500));
  process.exit(0);
}

check();
