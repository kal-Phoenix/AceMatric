import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const NATURAL = ['Biology', 'Chemistry', 'Physics', 'Maths', 'English', 'SAT'];
const SOCIAL = ['Geography', 'History', 'Economics'];

const { data: entries } = await supabase
  .from('content_entries')
  .select('id, subject');

if (!entries) { console.log('No entries found'); process.exit(1); }

let updated = 0;
for (const entry of entries) {
  const isNatural = NATURAL.includes(entry.subject);
  const isSocial = SOCIAL.includes(entry.subject);
  const stream = isNatural ? 'Natural Science' : isSocial ? 'Social Science' : '';

  if (stream) {
    const { error } = await supabase
      .from('content_entries')
      .update({ stream })
      .eq('id', entry.id);
    if (error) console.error(`Failed: ${entry.id}: ${error.message}`);
    else updated++;
  }
}

console.log(`Updated ${updated}/${entries.length} entries with stream values`);