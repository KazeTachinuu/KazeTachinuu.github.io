/**
 * Stamp `updated:` in content frontmatter to today's date. Wired via lint-staged
 * to fire on every staged content file at commit time, so the timestamp tracks
 * real edits without manual upkeep.
 *
 *   bun run scripts/stamp-updated.ts <file> [<file>...]
 *
 * Behavior:
 *   - replaces an existing `updated:` line, or inserts one right after `date:`
 *   - skips files with no frontmatter or no `date:` field
 *   - byte-identical output for everything else (no YAML re-stringification)
 */

import { readFileSync, writeFileSync } from 'node:fs';

const today = new Date().toISOString().slice(0, 10);

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0);

for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const fm = match[1];
  let next: string;

  if (/^updated:.*$/m.test(fm)) {
    next = fm.replace(/^updated:.*$/m, `updated: ${today}`);
  } else if (/^date:.*$/m.test(fm)) {
    next = fm.replace(/^(date:.*)$/m, `$1\nupdated: ${today}`);
  } else {
    continue;
  }

  if (next === fm) continue;
  writeFileSync(file, raw.replace(match[0], `---\n${next}\n---`));
}
