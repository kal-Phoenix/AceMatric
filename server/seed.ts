import 'dotenv/config';

import { supabaseAdmin as supabase, formatSupabaseError } from './db';

export async function seedAllData() {
  await ensureRoleColumn();
  await verifySeededData();
}

async function ensureRoleColumn() {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('role')
      .limit(1);

    if (!error) {
      const { getAdminEmails } = await import('./middleware');
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        for (const email of adminEmails) {
          await supabase
            .from('student_profiles')
            .update({ role: 'admin' })
            .eq('email', email);
        }
        console.log(`[setup] Admin roles set for: ${adminEmails.join(', ')}`);
      }
      return;
    }

    if (!error.message?.includes('column') && !error.message?.includes('does not exist')) {
      return;
    }

    console.log('[setup] Adding role column to student_profiles...');
    const { error: rpcError } = await supabase.rpc('sql_exec', {
      query: `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';`
    });

    if (rpcError) {
      console.log('[setup] Auto-add not available. Run migration manually:');
      console.log('  Paste SQL from server/migrations/004_user_roles.sql into Supabase SQL Editor');
    } else {
      console.log('[setup] role column added to student_profiles');
      const { getAdminEmails } = await import('./middleware');
      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0) {
        for (const email of adminEmails) {
          await supabase
            .from('student_profiles')
            .update({ role: 'admin' })
            .eq('email', email);
        }
        console.log(`[setup] Admin roles set for: ${adminEmails.join(', ')}`);
      }
    }
  } catch (err) {
    console.warn('[setup] ensureRoleColumn failed (non-critical):', err instanceof Error ? err.message : err);
  }
}

async function verifySeededData() {
  try {
    const [questionsRes, contentRes, pastExamRes] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('content_entries').select('id', { count: 'exact', head: true }),
      supabase.from('past_exam_entries').select('id', { count: 'exact', head: true }),
    ]);

    const qCount = questionsRes.count || 0;
    const cCount = contentRes.count || 0;
    const pCount = pastExamRes.count || 0;

    console.log(`[seed] Data check: ${qCount} questions, ${cCount} content entries, ${pCount} past exams`);

    if (qCount === 0) console.warn('[seed] WARNING: No questions found. Seed via admin panel or Supabase SQL Editor.');
    if (cCount === 0) console.warn('[seed] WARNING: No content entries found. Use admin Content Manager to add content.');
    if (pCount === 0) console.warn('[seed] WARNING: No past exams found. Use admin Past Exam Manager to add exams.');
  } catch (err) {
    console.warn('[seed] verifySeededData failed (non-critical):', err instanceof Error ? err.message : err);
  }
}

// CLI entry point
if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  seedAllData()
    .then(() => { console.log('[seed] Done.'); process.exit(0); })
    .catch((err) => { console.error('[seed] Fatal:', err); process.exit(1); });
}
