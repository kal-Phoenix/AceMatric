/**
 * AceMatric Revised Content Importer
 *
 * Imports staged revisions from storage/revised/*.json into the
 * content_entries table via upsertContent, which automatically:
 *   - bumps the version number
 *   - snapshots the previous state into content_versions (rollback history)
 *
 * Safety:
 *   - skips entries whose DB version changed since revision (conflict)
 *   - --dry-run previews without writing
 *   - --force overwrites regardless of conflict
 *
 * Usage:
 *   npx tsx server/import-revised.ts --dry-run     # preview only
 *   npx tsx server/import-revised.ts               # import all staged
 *   npx tsx server/import-revised.ts --id History/g9/ch9
 *   npx tsx server/import-revised.ts --force       # ignore version conflicts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { supabaseAdmin } from './db';
import { upsertContent } from './content-db';

const supabase = supabaseAdmin as any;
const REVISED_DIR = path.join(process.cwd(), 'storage', 'revised');

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
};

const DRY_RUN = has('--dry-run');
const FORCE = has('--force');
const ONLY_ID = get('--id');

interface StagedEntry {
  id: string;
  subject: string;
  grade: number;
  chapter_number: number;
  title: string;
  overview: string;
  core_points: string[];
  exam_tips: string;
  youtube_video_id?: string;
  video_duration?: string;
  materials: any[];
  subtopics: any[];
  content_html: string;
  status: 'draft' | 'published';
  version?: number;
  __revisedAt?: string;
  __sourceVersion?: number | null;
  [k: string]: any;
}

function loadStaged(): StagedEntry[] {
  if (!fs.existsSync(REVISED_DIR)) return [];
  return fs
    .readdirSync(REVISED_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(REVISED_DIR, f), 'utf-8'));
      } catch {
        console.warn(`  ! skipping unreadable file: ${f}`);
        return null;
      }
    })
    .filter((e): e is StagedEntry => !!e && !!e.id);
}

function basicCheck(e: StagedEntry): string[] {
  const errs: string[] = [];
  if (!Array.isArray(e.core_points) || e.core_points.length < 5) errs.push('core_points < 5');
  if (!Array.isArray(e.subtopics) || e.subtopics.length === 0) errs.push('no subtopics');
  if (!e.title) errs.push('missing title');
  const problems = (e.subtopics || []).reduce(
    (a: number, s: any) => a + (s?.practiceProblems?.length || 0),
    0
  );
  if (problems < 3) errs.push(`only ${problems} practice problems total`);
  return errs;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (no writes) ===' : '=== Importing revised content ===');

  const staged = loadStaged();
  if (ONLY_ID) {
    const filtered = staged.filter((e) => e.id === ONLY_ID);
    if (!filtered.length) {
      console.error(`No staged file found for id: ${ONLY_ID}`);
      process.exit(1);
    }
    return run(filtered);
  }
  await run(staged);
}

async function run(staged: StagedEntry[]) {
  console.log(`Staged files found: ${staged.length}\n`);

  let imported = 0, skipped = 0, conflicts = 0, invalid = 0;

  for (let i = 0; i < staged.length; i++) {
    const e = staged[i];
    process.stdout.write(`[${i + 1}/${staged.length}] ${e.id} ... `);

    const errs = basicCheck(e);
    if (errs.length) {
      console.log(`INVALID (${errs.join(', ')})`);
      invalid++;
      continue;
    }

    // Fetch current row for conflict check + stream preservation
    const { data: row, error } = await supabase
      .from('content_entries')
      .select('*')
      .eq('id', e.id)
      .single();

    if (error || !row) {
      console.log(`MISSING in DB`);
      skipped++;
      continue;
    }

    const currentVersion = row.version ?? 0;
    const sourceVersion = e.__sourceVersion ?? e.version ?? null;

    if (!FORCE && sourceVersion !== null && currentVersion !== sourceVersion) {
      console.log(`CONFLICT (DB v${currentVersion}, revised from v${sourceVersion}) — use --force to override`);
      conflicts++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`would import (v${currentVersion} -> v${currentVersion + 1}, stream=${row.stream || 'none'})`);
      imported++;
      continue;
    }

    try {
      await upsertContent({
        subject: e.subject,
        grade: e.grade,
        chapterNumber: e.chapter_number,
        stream: row.stream || undefined, // staged files don't carry stream
        title: e.title,
        overview: e.overview || '',
        corePoints: e.core_points || [],
        examTips: e.exam_tips || '',
        youtubeVideoId: e.youtube_video_id || '',
        videoDuration: e.video_duration || '',
        materials: e.materials || [],
        subtopics: e.subtopics || [],
        contentHtml: e.content_html || '',
        status: e.status || row.status || 'draft',
      });
      console.log(`OK (v${currentVersion} -> v${currentVersion + 1})`);
      imported++;
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`  Imported:  ${imported}${DRY_RUN ? ' (dry run)' : ''}`);
  console.log(`  Conflicts: ${conflicts}`);
  console.log(`  Invalid:   ${invalid}`);
  console.log(`  Skipped:   ${skipped}`);
  if (conflicts) console.log(`  Re-run with --force to import conflicted entries anyway.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
