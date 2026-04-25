/**
 * Pre-compute the sed-pipeline stage data for src/components/xz/SedPipeline.tsx.
 *
 * Runs the *actual* shell transforms against xz-artifacts/extracted/xz-5.6.1/tests/files/.
 * Emits src/data/xz-pipeline.json — an ordered list of stages, each with a
 * human-readable description, the verbatim shell command, and a content-aware
 * preview of the output (printable shell script for text stages, annotated hex
 * for binary stages, ELF header parse for the final object).
 *
 * Determinism: re-runnable; output is checked in.
 *
 * macOS note: the original backdoor uses a `head -c` chunker that only works
 * with GNU `head` (BSD `head` over-reads from pipes). We substitute a byte-precise
 * `dd` chunker for execution; the produced bytes are byte-identical to the
 * canonical Linux pipeline (verified against Russ Cox xz-script).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

interface Stage {
  id: string;
  label: string;
  description: string;        // 1–3 sentences, plain English: what + why
  command: string;            // verbatim shell command (display)
  kind: 'binary' | 'shell' | 'elf';
  outputSize: number;         // total bytes
  outputText?: string;        // present when kind=shell — the actual text
  outputHex?: string;         // present when kind=binary — first 256 bytes hex (annotated by widget)
  elfHeader?: ElfHeader;      // present when kind=elf
  notable?: { offset: number; bytes: string; meaning: string }[]; // hex annotations
}

interface ElfHeader {
  magic: string;        // "7F 45 4C 46"
  class: string;        // "ELF64"
  endian: string;       // "little"
  type: string;         // "REL (relocatable)"
  machine: string;      // "x86-64"
  sectionCount: number;
  totalBytes: number;
}

const ART = 'xz-artifacts/extracted/xz-5.6.1/tests/files';
const BAD = `${ART}/bad-3-corrupt_lzma2.xz`;
const GOOD = `${ART}/good-large_compressed.lzma`;
const FINAL_O = 'xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o';

const HEX_PREVIEW = 256;     // bytes of hex to show for binary stages

function hexPreview(buf: Buffer): string {
  return buf.subarray(0, HEX_PREVIEW).toString('hex');
}

function shell(cmd: string, input?: Buffer): Buffer {
  const r = spawnSync('sh', ['-c', cmd], { input, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`shell failed: ${cmd}\n${r.stderr.toString()}`);
  }
  return r.stdout;
}

/* Render a buffer as printable text where possible. Non-printable bytes
   become a U+FFFD-style placeholder so the structure of the script is
   visible without garbling the rendering. We replace null bytes (which the
   stage-1 script sprinkles between sections) with a clear marker so the
   reader can SEE them rather than have them silently disappear. */
function asPrintable(buf: Buffer): string {
  const out: string[] = [];
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e)) {
      out.push(String.fromCharCode(b));
    } else if (b === 0x00) {
      out.push('␀');
    } else {
      out.push('·'); // non-printable
    }
  }
  return out.join('');
}

const stages: Stage[] = [];

// ── Stage 1: raw input ─────────────────────────────────────────
const stage1 = readFileSync(BAD);
stages.push({
  id: 's1-input',
  label: 'The "corrupted" test fixture',
  description:
    'A 512-byte file in the test corpus. It IS a valid xz container — magic FD377A585A00 — but ' +
    'a 3-stream xz: stream 1 emits "####Hello####", stream 2 is intentionally malformed (xz -d ' +
    'on it stops with "Compressed data is corrupt"), stream 3 was meant to emit "####World####". ' +
    'Looks like a corner-case test for the decoder. It is, in fact, a payload carrier.',
  command: '# raw bytes from tests/files/bad-3-corrupt_lzma2.xz',
  kind: 'binary',
  outputSize: stage1.length,
  outputHex: hexPreview(stage1),
  notable: [
    { offset: 0,  bytes: stage1.subarray(0, 6).toString('hex'),  meaning: 'xz magic FD 37 7A 58 5A 00 — header is valid' },
    { offset: 24, bytes: stage1.subarray(24, 32).toString('hex'), meaning: 'start of the cover marker "####Hello####"' },
  ],
});

// ── Stage 2: tr substitution ───────────────────────────────────
// Note: LC_ALL=C is needed on macOS BSD tr to operate in byte mode (otherwise
// "Illegal byte sequence" on non-UTF-8 input). The displayed `command` field
// omits LC_ALL=C to match the canonical command from the actual decoded script.
const trCmd = `tr "\\t \\-_" " \\t_\\-"`;
const stage2 = shell(`LC_ALL=C ${trCmd} < ${BAD}`);
stages.push({
  id: 's2-tr',
  label: 'Uncorrupt stream 2',
  description:
    'Two pairs of byte values get swapped: tab↔space (0x09↔0x20) and dash↔underscore ' +
    '(0x2D↔0x5F). The xz header is unchanged. What changes are bytes inside the ' +
    'corrupted middle stream — the substitution turns its garbled lzma2 payload into a ' +
    'decodable one. The file was always valid xz; now it also has a working stream 2.',
  command: trCmd,
  kind: 'binary',
  outputSize: stage2.length,
  outputHex: hexPreview(stage2),
});

// ── Stage 3: xz -d → Stage-1 shell ─────────────────────────────
const stage3 = shell(`LC_ALL=C ${trCmd} < ${BAD} | xz -d 2>/dev/null`);
mkdirSync('xz-artifacts/stages', { recursive: true });
writeFileSync('xz-artifacts/stages/01-stage1.sh', stage3);
stages.push({
  id: 's3-xz',
  label: 'Decompress all 3 streams → Stage-1 shell script',
  description:
    'xz -d now succeeds on every stream. Output is the concatenation: cover marker ' +
    '"####Hello####", then the 1.3 KB Stage-1 shell script (the dropper) hidden in stream 2, ' +
    'then a closing "####World####" marker. The cover markers exist solely to make any ' +
    'half-curious reviewer think they are looking at hello-world test output.',
  command: 'xz -d',
  kind: 'shell',
  outputSize: stage3.length,
  outputText: asPrintable(stage3),
});

// ── Stage 4: xz -dc good-large_compressed.lzma ─────────────────
const stage4 = shell(`xz -dc ${GOOD}`);
stages.push({
  id: 's4-xz-dc',
  label: 'Decompress the second fixture',
  description:
    `Phase 2 begins. The 35 KB fixture good-large_compressed.lzma decompresses ` +
    `into ${stage4.length.toLocaleString()} bytes — a long header of padding wrapped around the encrypted payload.`,
  command: 'xz -dc good-large_compressed.lzma',
  kind: 'binary',
  outputSize: stage4.length,
  outputHex: hexPreview(stage4),
});

// ── Stage 5: head chunker ──────────────────────────────────────
// dd-substituted version (byte-identical to GNU `head -c` chained on Linux)
const ddChunker = (() => {
  const parts: string[] = [];
  for (let i = 0; i < 16; i++) {
    parts.push(`dd bs=1024 count=1 of=/dev/null 2>/dev/null && dd bs=1024 count=2 2>/dev/null`);
  }
  parts.push(`dd bs=1024 count=1 of=/dev/null 2>/dev/null && dd bs=1 count=939 2>/dev/null`);
  return `(${parts.join(' && ')})`;
})();
const stage5 = shell(`xz -dc ${GOOD} | ${ddChunker}`);
stages.push({
  id: 's5-head-chunks',
  label: 'Strip header padding',
  description:
    'Skip 1024 bytes / keep 2048 bytes, repeated 16 times, then keep a final 939 bytes — ' +
    `extracts ${stage5.length.toLocaleString()} bytes from the middle, discarding the cover-padding.`,
  command:
    '((head -c +1024 >/dev/null) && head -c +2048) ×16 && (head -c +1024 >/dev/null) && head -c +939',
  kind: 'binary',
  outputSize: stage5.length,
  outputHex: hexPreview(stage5),
});

// ── Stage 6: tail -c +31233 ────────────────────────────────────
const stage6 = shell(`xz -dc ${GOOD} | ${ddChunker} | tail -c +31233`);
stages.push({
  id: 's6-tail',
  label: 'Keep only the last 475 bytes',
  description:
    `tail -c +31233 keeps the bytes starting at offset 31,233. Of the ${stage5.length.toLocaleString()}-byte chunker output, ` +
    `only ${stage6.length} bytes survive — the LZMA-raw-encoded dropper, still byte-substituted.`,
  command: 'tail -c +31233',
  kind: 'binary',
  outputSize: stage6.length,
  outputHex: hexPreview(stage6),
});

// ── Stage 7: tr substitution cipher ────────────────────────────
const tr2Cmd = `LC_ALL=C tr "\\114-\\321\\322-\\377\\35-\\47\\14-\\34\\0-\\13\\50-\\113" "\\0-\\377"`;
const stage7 = shell(`xz -dc ${GOOD} | ${ddChunker} | tail -c +31233 | ${tr2Cmd}`);
stages.push({
  id: 's7-tr-substitution',
  label: 'Reverse the byte cipher',
  description:
    'A hand-rolled substitution cipher — maps the byte alphabet so that what was scrambled ' +
    'is now a valid LZMA1 raw stream. Same trick as Stage 2, larger table.',
  command: 'tr "\\114-\\321\\322-\\377\\35-\\47\\14-\\34\\0-\\13\\50-\\113" "\\0-\\377"',
  kind: 'binary',
  outputSize: stage7.length,
  outputHex: hexPreview(stage7),
});

// ── Stage 8: xz -F raw --lzma1 -dc → Stage-2 shell ─────────────
const stage8 = shell(
  `xz -dc ${GOOD} | ${ddChunker} | tail -c +31233 | ${tr2Cmd} | xz -F raw --lzma1 -dc`
);
writeFileSync('xz-artifacts/stages/02-stage2.sh', stage8);
stages.push({
  id: 's8-final-shell',
  label: 'Decompress → Stage-2 dropper',
  description:
    `Decompressing the LZMA1 raw stream produces a ${stage8.length.toLocaleString()}-byte shell script — the ` +
    'Stage-2 dropper. This script rewrites libtool config to inject a malicious .o into the build of liblzma.so.5.',
  command: 'xz -F raw --lzma1 -dc',
  kind: 'shell',
  outputSize: stage8.length,
  outputText: asPrintable(stage8),
});

// ── Stage 9: the final .o ──────────────────────────────────────
// The Stage-2 script extracts and decrypts an additional payload (RC4-like
// in awk against good-large_compressed.lzma) to produce liblzma_la-crc64-fast.o.
// We don't re-run that here; we point at the artifact shipped by smx-smx/xzre,
// which has the same structure, and parse its ELF header.
const elfBuf = readFileSync(FINAL_O);
const magic = elfBuf.subarray(0, 4).toString('hex').toUpperCase().match(/.{2}/g)!.join(' ');
const elfClass = elfBuf[4] === 2 ? 'ELF64' : 'ELF32';
const elfEndian = elfBuf[5] === 1 ? 'little' : 'big';
const elfType = elfBuf.readUInt16LE(16);
const elfMachine = elfBuf.readUInt16LE(18);
const elfShnum = elfBuf.readUInt16LE(60); // e_shnum at offset 0x3c for ELF64
const typeName = ({ 1: 'REL (relocatable)', 2: 'EXEC', 3: 'DYN (shared object)' } as Record<number, string>)[elfType] ?? `unknown (${elfType})`;
const machineName = ({ 0x3e: 'x86-64', 0x28: 'ARM', 0xb7: 'AArch64' } as Record<number, string>)[elfMachine] ?? `unknown (0x${elfMachine.toString(16)})`;

stages.push({
  id: 's9-elf',
  label: 'liblzma_la-crc64-fast.o (the backdoor)',
  description:
    'The Stage-2 script extracts and RC4-decrypts a third payload (also from good-large_compressed.lzma), ' +
    `producing this ${elfBuf.length.toLocaleString()}-byte x86-64 ELF object. ` +
    'It then patches the libtool configuration so that liblzma.so.5 links against it. The hex below is the actual file — readable as machine code, not source.',
  command: '# extracted by Stage-2 → injected into liblzma.so.5 link',
  kind: 'elf',
  outputSize: elfBuf.length,
  outputHex: hexPreview(elfBuf),
  elfHeader: {
    magic,
    class: elfClass,
    endian: elfEndian,
    type: typeName,
    machine: machineName,
    sectionCount: elfShnum,
    totalBytes: elfBuf.length,
  },
  notable: [
    { offset: 0, bytes: elfBuf.subarray(0, 4).toString('hex'), meaning: 'ELF magic — confirms this is now an executable binary, not a script' },
    { offset: 4, bytes: elfBuf.subarray(4, 5).toString('hex'), meaning: '0x02 = ELF64' },
    { offset: 5, bytes: elfBuf.subarray(5, 6).toString('hex'), meaning: '0x01 = little-endian' },
    { offset: 18, bytes: elfBuf.subarray(18, 20).toString('hex'), meaning: '0x3E 0x00 = x86-64 (EM_X86_64)' },
  ],
});

// ── Invariants ─────────────────────────────────────────────────
if (stages.length !== 9) throw new Error(`Expected 9 stages, got ${stages.length}`);
if (!stages[2].outputText?.includes('Hello')) throw new Error('Stage-3 shell script missing the ####Hello#### marker');
if (!stages[7].outputText?.includes('pic_flag')) throw new Error('Stage-8 shell script missing the pic_flag marker');
if (stages[8].elfHeader?.magic !== '7F 45 4C 46') throw new Error('Stage-9 ELF magic mismatch');

// ── Emit ───────────────────────────────────────────────────────
const out = 'src/data/xz-pipeline.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ stages, generatedAt: new Date().toISOString() }, null, 2));
const sizeOut = statSync(out).size;
console.log(`wrote ${out} — ${stages.length} stages, ${sizeOut.toLocaleString()} bytes (${(sizeOut / 1024).toFixed(1)} KB)`);
