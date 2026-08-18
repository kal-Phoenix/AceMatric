import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { supabase } from './db';

async function fix() {
  const { data: entries } = await supabase.from('content_entries').select('id, subtopics, materials').eq('subject', 'English');
  if (!entries) { console.log('No entries'); process.exit(1); }
  
  for (const entry of entries) {
    let subtopics = entry.subtopics;
    let materials = entry.materials;
    let changed = false;

    // Fix double-JSON subtopics
    if (typeof subtopics === 'string') {
      try {
        subtopics = JSON.parse(subtopics);
        changed = true;
      } catch {}
    }
    if (Array.isArray(subtopics) && subtopics.length > 0 && typeof subtopics[0] === 'string') {
      try {
        subtopics = subtopics.map((s: string) => JSON.parse(s));
        changed = true;
      } catch {}
    }

    // Fix double-JSON materials
    if (typeof materials === 'string') {
      try {
        materials = JSON.parse(materials);
        changed = true;
      } catch {}
    }
    if (Array.isArray(materials) && materials.length > 0 && typeof materials[0] === 'string') {
      try {
        materials = materials.map((m: string) => JSON.parse(m));
        changed = true;
      } catch {}
    }

    // Fix subtopic titles - remove numbering prefixes
    if (Array.isArray(subtopics)) {
      for (const st of subtopics) {
        if (st && st.title) {
          const cleaned = st.title.replace(/^\d+(\.\d+)*\s*/, '');
          if (cleaned !== st.title) {
            st.title = cleaned;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      const { error } = await supabase.from('content_entries').update({ subtopics, materials }).eq('id', entry.id);
      if (error) console.error('Error:', entry.id, error.message);
      else console.log('Fixed:', entry.id);
    }
  }
  console.log('Done');
  process.exit(0);
}

fix();
