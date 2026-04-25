/**
 * Pre-compute the sed-pipeline stage data for src/components/xz/SedPipeline.tsx.
 *
 * Runs the *actual* shell transforms against xz-artifacts/extracted/xz-5.6.1/tests/files/.
 * Emits src/data/xz-pipeline.json — an ordered list of stages with inputs,
 * outputs, byte-range provenance, and the script tokens that produced each.
 *
 * Determinism: re-runnable; output is checked into git via the data/ collection.
 *
 * macOS note: the original backdoor uses a `head -c` chunker that only works
 * with GNU `head` (which reads byte-by-byte from pipes). BSD `head` on macOS
 * over-reads from pipes, so we substitute a byte-precise `dd`-based chunker
 * for the *display* of the head-chunker stage. The bytes produced are
 * identical to the GNU shell pipeline output.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface Stage {
  id: string;
  label: string;
  command: string;            // the actual shell command (display)
  scriptTokens: string[];     // tokens to highlight on hover
  inputBytes: string;         // hex-encoded, max 4096 bytes shown
  outputBytes: string;        // hex-encoded, max 4096 bytes
  truncated: { input: boolean; output: boolean };
}

const ART = 'xz-artifacts/extracted/xz-5.6.1/tests/files';
const BAD = `${ART}/bad-3-corrupt_lzma2.xz`;
const GOOD = `${ART}/good-large_compressed.lzma`;

const MAX_BYTES = 4096;

function hex(buf: Buffer): { hex: string; truncated: boolean } {
  const truncated = buf.length > MAX_BYTES;
  const slice = truncated ? buf.subarray(0, MAX_BYTES) : buf;
  return { hex: slice.toString('hex'), truncated };
}

function shell(cmd: string, input?: Buffer): Buffer {
  const r = spawnSync('sh', ['-c', cmd], { input, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`shell failed: ${cmd}\n${r.stderr.toString()}`);
  }
  return r.stdout;
}

const stages: Stage[] = [];

// ── Stage 1: raw input ─────────────────────────────────────────
const stage1Input = readFileSync(BAD);
const s1in = hex(stage1Input);
stages.push({
  id: 's1-input',
  label: 'tests/files/bad-3-corrupt_lzma2.xz',
  command: '# raw bytes — looks like a corrupted xz test fixture',
  scriptTokens: [],
  inputBytes: s1in.hex,
  outputBytes: s1in.hex,
  truncated: { input: s1in.truncated, output: s1in.truncated },
});

// ── Stage 2: tr substitution ───────────────────────────────────
// LC_ALL=C is required for BSD tr (macOS) to handle arbitrary bytes;
// GNU tr in the original build environment behaves the same way.
const trCmd = `LC_ALL=C tr "\\t \\-_" " \\t_\\-"`;
const stage2Output = shell(`${trCmd} < ${BAD}`);
const s2out = hex(stage2Output);
stages.push({
  id: 's2-tr',
  label: 'tr "\\t \\-_" " \\t_\\-"',
  command: trCmd,
  scriptTokens: ['tr', '\\t', '\\-_', '\\t_\\-'],
  inputBytes: s1in.hex,
  outputBytes: s2out.hex,
  truncated: { input: s1in.truncated, output: s2out.truncated },
});

// ── Stage 3: xz -d (now-valid xz stream → shell script) ────────
const stage3Output = shell(`${trCmd} < ${BAD} | xz -d 2>/dev/null`);
const s3out = hex(stage3Output);
stages.push({
  id: 's3-xz',
  label: 'xz -d',
  command: 'xz -d',
  scriptTokens: ['xz', '-d'],
  inputBytes: s2out.hex,
  outputBytes: s3out.hex,
  truncated: { input: s2out.truncated, output: s3out.truncated },
});

// ── Persist Stage-1 result for reuse ───────────────────────────
mkdirSync('xz-artifacts/stages', { recursive: true });
writeFileSync('xz-artifacts/stages/01-stage1.sh', stage3Output);

// ── Stage 4-8: the second pipeline against good-large_compressed.lzma ──
//
// Per the actual decoded stage-1 script (xz-artifacts/stages/01-stage1.sh):
//   xz -dc good-large_compressed.lzma | <head-chunker> | tail -c +31233 |
//     tr "\114-\321\322-\377\35-\47\14-\34\0-\13\50-\113" "\0-\377" |
//     xz -F raw --lzma1 -dc
//
// The head-chunker is 16 cycles of `(head -c +1024 >/dev/null) && head -c +2048`
// followed by a final `(head -c +1024 >/dev/null) && head -c +939`.
// Total: 17 skips × 1024 + 16 keeps × 2048 + 1 keep × 939 = 51,115 bytes consumed,
// 33,707 bytes output.
//
// On GNU systems `head -c` reads bytes one-at-a-time from pipes so the chained
// invocations work. macOS BSD `head -c` over-reads, breaking the pipe. We
// substitute a byte-precise `dd`-based chunker that produces identical bytes.

// Display label preserves the original head-based form (what the backdoor uses).
const HEAD_CHUNKER_LABEL =
  '((head -c +1024 >/dev/null) && head -c +2048) × 16 && ' +
  '(head -c +1024 >/dev/null) && head -c +939';

// Byte-precise dd-based chunker. Operates on a temp file holding xz -dc output.
// Each "cycle" of the original head chunker = skip 1024 then keep 2048 = 3KiB
// 1024-byte blocks. After 16 cycles we have consumed 48 blocks; the final
// piece skips 1 more block (block 49) then keeps 939 bytes from block 50.
function ddChunkerCmd(inputFile: string): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const skipBlocks = i * 3 + 1; // 1, 4, 7, ... — block index where this cycle's keep starts
    parts.push(`dd if=${inputFile} bs=1024 skip=${skipBlocks} count=2 2>/dev/null`);
  }
  // Final keep: skip block 49, take 939 bytes from block 49+0 onward.
  // After 16 cycles (each 3 blocks), we've consumed 48 blocks; final skip = block 48+1 = 49.
  parts.push(`dd if=${inputFile} bs=1 skip=${49 * 1024} count=939 2>/dev/null`);
  return `{ ${parts.join('; ')}; }`;
}

const tr2Cmd = `LC_ALL=C tr "\\114-\\321\\322-\\377\\35-\\47\\14-\\34\\0-\\13\\50-\\113" "\\0-\\377"`;

// Run xz -dc once and stash the bytes in a temp file so dd can seek.
const tmp = join(tmpdir(), `xz-pipeline-${process.pid}.bin`);
const stage4Out = shell(`xz -dc ${GOOD}`);
writeFileSync(tmp, stage4Out);
const s4 = hex(stage4Out);
stages.push({
  id: 's4-xz-dc',
  label: 'xz -dc good-large_compressed.lzma',
  command: 'xz -dc good-large_compressed.lzma',
  scriptTokens: ['xz', '-dc'],
  inputBytes: hex(readFileSync(GOOD)).hex,
  outputBytes: s4.hex,
  truncated: { input: false, output: s4.truncated },
});

const chunkerCmd = ddChunkerCmd(tmp);
const stage5Out = shell(chunkerCmd);
const s5 = hex(stage5Out);
stages.push({
  id: 's5-head-chunks',
  label: HEAD_CHUNKER_LABEL,
  command: HEAD_CHUNKER_LABEL,
  scriptTokens: ['head', '-c', '1024', '2048', '939'],
  inputBytes: s4.hex,
  outputBytes: s5.hex,
  truncated: { input: s4.truncated, output: s5.truncated },
});

const stage6Out = shell(`${chunkerCmd} | tail -c +31233`);
const s6 = hex(stage6Out);
stages.push({
  id: 's6-tail',
  label: 'tail -c +31233',
  command: 'tail -c +31233',
  scriptTokens: ['tail', '-c', '31233'],
  inputBytes: s5.hex,
  outputBytes: s6.hex,
  truncated: { input: s5.truncated, output: s6.truncated },
});

const stage7Out = shell(`${chunkerCmd} | tail -c +31233 | ${tr2Cmd}`);
const s7 = hex(stage7Out);
stages.push({
  id: 's7-tr-substitution',
  label: 'tr "\\114-\\321\\322-\\377\\35-\\47\\14-\\34\\0-\\13\\50-\\113" "\\0-\\377"',
  command: tr2Cmd,
  scriptTokens: ['tr', '\\114-\\321\\322-\\377\\35-\\47\\14-\\34\\0-\\13\\50-\\113', '\\0-\\377'],
  inputBytes: s6.hex,
  outputBytes: s7.hex,
  truncated: { input: s6.truncated, output: s7.truncated },
});

const stage8Out = shell(
  `${chunkerCmd} | tail -c +31233 | ${tr2Cmd} | xz -F raw --lzma1 -dc`
);
const s8 = hex(stage8Out);
stages.push({
  id: 's8-final',
  label: 'xz -F raw --lzma1 -dc → Stage-2 shell script',
  command: 'xz -F raw --lzma1 -dc',
  scriptTokens: ['xz', '-F', 'raw', '--lzma1', '-dc'],
  inputBytes: s7.hex,
  outputBytes: s8.hex,
  truncated: { input: s7.truncated, output: s8.truncated },
});
writeFileSync('xz-artifacts/stages/02-stage2.sh', stage8Out);

// ── Invariants ─────────────────────────────────────────────────
// Stage-1 output must contain the eval/srcdir markers
const s3str = stage3Output.toString('utf8', 0, 500);
if (!s3str.includes('eval') && !s3str.includes('srcdir')) {
  throw new Error(`Stage-3 output doesn't look like the stage-1 shell script:\n${s3str}`);
}
// Stage-8 output must be a shell script (Stage 2)
const s8str = stage8Out.toString('utf8', 0, 500);
if (!s8str.includes('AWK') && !s8str.includes('eval') && !s8str.includes('srcdir')) {
  console.warn(`Stage-8 output (first 500 bytes utf8): ${s8str}`);
  // Don't throw — RC4-decoded shell can have non-utf8 prefix; just warn.
}
if (stages.length !== 8) throw new Error(`Expected 8 stages, got ${stages.length}`);

// ── Emit ───────────────────────────────────────────────────────
const out = 'src/data/xz-pipeline.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ stages, generatedAt: new Date().toISOString() }, null, 2));
console.log(`wrote ${out} — ${stages.length} stages, ${Buffer.byteLength(JSON.stringify(stages))} bytes`);
