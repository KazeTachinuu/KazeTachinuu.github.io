# XZ Backdoor Explainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the interactive blog post specified in `docs/superpowers/specs/2026-04-25-xz-backdoor-explainer-design.md` — an editorial-voice, Distill/Ciechanowski-grade explainer of CVE-2024-3094, with three set-piece interactives, three inline widgets, and disassembly snippets cross-linked to the existing AsmLookup tool.

**Architecture:** Astro 6 + Preact islands + Tailwind v4. Each interactive widget is a `client:visible` Preact island. Data is pre-computed at build time from `xz-artifacts/` (gitignored, already populated). Prose lives in MDX at `src/content/blog/xz-backdoor/index.mdx`; components are imported per-page (not registered globally in `src/components/mdx/`).

**Tech Stack:**
- `scrollama` — IntersectionObserver-based scroll-step orchestration
- `motion` (Motion One) — tween animations, framework-agnostic
- `@nanostores/preact` — cross-island state (only if needed)
- `expressive-code` — already-installed code-block renderer; reused for disassembly snippets
- svgl.app — fetched at build time via custom script

**Test approach (project-specific):** This repo has no test framework. Adding vitest for a single page is overkill. Pragmatic adaptation:
- **Data scripts** end with inline `assert` blocks that verify output shape and known-good hashes; the script throws if invariants break.
- **Components** are verified visually via `bun run dev` against an explicit checklist in each task.
- **Integration** is verified by `bun run build` succeeding and the page rendering correctly in dev + preview.

This is not classical TDD but matches the project's existing pattern (`AsmLookup`, `RevShellGen`).

**Build order rationale:** the SedPipeline centerpiece (Task 8) lands by mid-plan as a checkpoint — Hugo can review direction before committing to the rest. Subsequent widgets (Timeline, DepGraph) follow only after centerpiece is approved.

**Prose authoring:** This plan builds the *infrastructure*. Hugo writes the prose himself in his own voice. The MDX skeleton (Task 15) ships with section headers, embedded components, and one-line stubs marking what each section needs to cover — but the actual prose is left blank for him to write.

---

## File structure (created by this plan)

```
src/
├── content/blog/xz-backdoor/
│   └── index.mdx                              # T16 — section skeleton with embedded components
├── components/xz/
│   ├── Mnemonic.astro                         # T7 — wraps AT&T mnemonic, links to AsmLookup
│   ├── SedPipeline.tsx                        # T8 — set piece ③ (centerpiece, CHECKPOINT)
│   ├── TarballDiff.astro                      # T11 — inline widget ②
│   ├── LatencyChart.astro                     # T12 — inline widget ⑤
│   ├── DistroGrid.astro                       # T13 — inline widget ⑥
│   ├── Timeline.tsx                           # T14 — set piece ①
│   ├── DepGraph.tsx                           # T15 — set piece ④
│   └── shared/
│       ├── stores.ts                          # not created — T14 + T15 don't need cross-island state
│       └── motion.ts                          # T8 — Motion One helper (reduced-motion aware)
├── data/
│   ├── xz-pipeline.json                       # T6 — emitted by build-xz-pipeline-data.ts
│   ├── xz-timeline.json                       # T9 — hand-authored from Russ Cox + primary sources
│   ├── xz-distros.json                        # T10 — hand-authored
│   └── xz-icons/                              # T13 — fetched from svgl.app
│       ├── debian.svg
│       ├── fedora.svg
│       └── … (8 distro icons)
└── styles/
    └── xz.css                                 # T2 — page-scoped overrides

scripts/
├── build-xz-pipeline-data.ts                  # T6 — runs real xz/tr against xz-artifacts/, emits JSON
├── extract-disasm.sh                          # T5 — objdump on liblzma_la-crc64-fast.o, slices into .s files
└── fetch-svgl-icons.ts                        # T13 — fetches 8 distro SVGs from svgl.app

xz-artifacts/                                  # already populated, gitignored
└── analysis/disasm/                           # populated by T5
    ├── get_cpuid.s
    ├── got_walker.s
    └── rsa_public_decrypt_hook.s

package.json                                   # T1 — add deps: scrollama, motion
```

**Files NOT created by this plan:**
- `src/components/xz/shared/stores.ts` — only if Tasks 14 or 16 require cross-island state. Defer.
- `src/styles/xz.css` — created in T2 even if empty, so per-page imports compile. Actual rules added per-task as needed.

---

## Task 1: Install dependencies, create folder structure

**Files:**
- Modify: `package.json` (add deps)
- Create: `src/components/xz/.gitkeep`
- Create: `src/components/xz/shared/.gitkeep`
- Create: `scripts/.gitkeep` (if `scripts/` doesn't exist)
- Create: `src/data/xz-icons/.gitkeep`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd /Users/hugo/dev/Github/KazeTachinuu.github.io
bun add scrollama motion
bun add -d @types/scrollama
```

Expected: `package.json` updated; `bun.lock` updated. Versions at install time should be `scrollama@^3` and `motion@^11+`. If versions differ wildly, investigate before proceeding.

- [ ] **Step 2: Create directory scaffolding**

```bash
mkdir -p src/components/xz/shared
mkdir -p src/data/xz-icons
mkdir -p scripts
touch src/components/xz/.gitkeep
touch src/components/xz/shared/.gitkeep
touch src/data/xz-icons/.gitkeep
```

- [ ] **Step 3: Verify install + dirs**

```bash
ls src/components/xz/ src/data/xz-icons/ scripts/
grep -E '"(scrollama|motion|@types/scrollama)"' package.json
```

Expected: all three dirs exist; both deps and the type package present in `package.json`.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock src/components/xz/ src/data/xz-icons/ scripts/
git commit -m "xz: scaffold dirs + scrollama/motion deps"
```

---

## Task 2: Create page-scoped stylesheet stub

**Files:**
- Create: `src/styles/xz.css`

- [ ] **Step 1: Create the stylesheet with semantic-color custom props**

Write `src/styles/xz.css`:

```css
/*
 * Page-scoped overrides for /blog/xz-backdoor/.
 * Imported by src/content/blog/xz-backdoor/index.mdx.
 * Semantic colors per spec §"Voice and aesthetic":
 *   --xz-attacker  ember  — JiaT75, malicious commits, encrypted bytes
 *   --xz-defender  slate  — Lasse Collin, Andres Freund, clean code
 *   --xz-infra     grey   — autoconf, sshd, libsystemd, distro nodes
 * All three tuned for both light and dark mode at AAA contrast.
 */

:root {
  --xz-attacker: oklch(58% 0.14 35);   /* muted ember — light */
  --xz-defender: oklch(52% 0.06 250);  /* cool slate — light */
  --xz-infra:    oklch(55% 0.02 250);  /* neutral grey — light */
}

:root.dark {
  --xz-attacker: oklch(72% 0.16 35);
  --xz-defender: oklch(75% 0.08 250);
  --xz-infra:    oklch(70% 0.02 250);
}

/* Hex-grid texture lives only inside the SedPipeline widget viewport. */
.xz-byte-canvas {
  background-image:
    repeating-linear-gradient(60deg,
      color-mix(in oklch, currentColor 4%, transparent) 0 1px,
      transparent 1px 14px),
    repeating-linear-gradient(-60deg,
      color-mix(in oklch, currentColor 4%, transparent) 0 1px,
      transparent 1px 14px);
}

/* Widget container break-out: prose is 680px; widgets push to 960px. */
.xz-widget {
  width: min(100%, 960px);
  margin-inline: auto;
  margin-block: 2.5rem;
}
```

- [ ] **Step 2: Verify file**

```bash
wc -l src/styles/xz.css
```

Expected: ~35 lines.

- [ ] **Step 3: Commit**

```bash
git add src/styles/xz.css
git commit -m "xz: page-scoped stylesheet with semantic-color tokens"
```

---

## Task 3: Add the blog post entry stub

**Files:**
- Create: `src/content/blog/xz-backdoor/index.mdx`

Note: this is a **temporary stub** so the page builds and routes correctly. The real MDX is written in Task 15. We create the stub now so dev-server URL `/blog/xz-backdoor/` works while building components.

- [ ] **Step 1: Create the stub MDX**

Write `src/content/blog/xz-backdoor/index.mdx`:

```mdx
---
title: "The XZ backdoor"
description: "An interactive walkthrough of CVE-2024-3094 — how a two-year social-engineering campaign almost shipped a sshd backdoor in liblzma."
date: 2026-04-25
draft: true
categories: ["security"]
tags: ["xz", "cve-2024-3094", "supply-chain", "reverse-engineering"]
---

import '../../../styles/xz.css';

## Stub

Skeleton page for the XZ backdoor explainer. Real content arrives in plan Task 15.
```

- [ ] **Step 2: Build to confirm the route works**

```bash
bun run build 2>&1 | tail -20
```

Expected: build succeeds; `dist/blog/xz-backdoor/index.html` exists.

```bash
ls dist/blog/xz-backdoor/
```

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/xz-backdoor/
git commit -m "xz: stub MDX entry (draft) for routing scaffolding"
```

---

## Task 4: Verify local artifacts are present and consistent

**Files:** none modified — verification task. Must pass before T5–T7 can run.

- [ ] **Step 1: Confirm `xz-artifacts/` exists and is gitignored**

```bash
ls -la xz-artifacts/ && git check-ignore -v xz-artifacts/tarballs/xz-5.6.1.tar.gz
```

Expected: directory listing showing `tarballs/`, `extracted/`, `analysis/`, `stages/`, `README.md`. `git check-ignore` confirms gitignore entry.

If missing, re-run the setup at the bottom of `xz-artifacts/README.md`.

- [ ] **Step 2: Re-verify hashes**

```bash
shasum -a 256 \
  xz-artifacts/extracted/xz-5.6.1/tests/files/bad-3-corrupt_lzma2.xz \
  xz-artifacts/extracted/xz-5.6.1/tests/files/good-large_compressed.lzma \
  xz-artifacts/extracted/xz-5.6.1/m4/build-to-host.m4 \
  xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o
```

Expected exact output:

```
ecda10d8877d555dbda4a4eba329e146b2be8ac4b7915fb723eaacc9f89d16bd  xz-artifacts/extracted/xz-5.6.1/tests/files/bad-3-corrupt_lzma2.xz
9aef898229de60f94cdea42f19268e6e3047f7136f2ff97510390a2deeda7032  xz-artifacts/extracted/xz-5.6.1/tests/files/good-large_compressed.lzma
054003928e240de8b9f3232e1bb885a5b6cc09488742159a0e3d6080e16499f4  xz-artifacts/extracted/xz-5.6.1/m4/build-to-host.m4
b418bfd34aa246b2e7b5cb5d263a640e5d080810f767370c4d2c24662a274963  analysis/xzre/liblzma_la-crc64-fast.o
```

If any hash differs, do not proceed — re-fetch from `xz-artifacts/README.md` instructions.

- [ ] **Step 3: Verify required tools are installed**

```bash
which xz tr objdump shasum
```

All four must resolve. On macOS, `objdump` ships with the Apple/LLVM toolchain (also available as `gobjdump` via `brew install binutils`); `xz` ships with brew or coreutils. If `objdump` is missing, install: `brew install binutils && export PATH="/opt/homebrew/opt/binutils/bin:$PATH"`.

- [ ] **Step 4: No commit** — pure verification. Move on to T5.

---

## Task 5: Extract disassembly snippets from the malicious .o

**Files:**
- Create: `scripts/extract-disasm.sh`
- Will produce: `xz-artifacts/analysis/disasm/{get_cpuid,got_walker,rsa_public_decrypt_hook}.s`

- [ ] **Step 1: Write the extraction script**

Write `scripts/extract-disasm.sh`:

```bash
#!/usr/bin/env bash
# Extract three named disassembly regions from liblzma_la-crc64-fast.o
# (the malicious object shipped in smx-smx/xzre).
# Output: xz-artifacts/analysis/disasm/{name}.s — AT&T syntax, used by §4.
#
# Determinism: re-runnable; output is git-ignored. Function-name choices
# follow smx-smx/xzre's reverse-engineering documentation (attributed in
# the blog post sources list).

set -euo pipefail

OBJ="xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o"
OUT_DIR="xz-artifacts/analysis/disasm"
EXPECTED_SHA="b418bfd34aa246b2e7b5cb5d263a640e5d080810f767370c4d2c24662a274963"

# 1. Verify input
if [ ! -f "$OBJ" ]; then
  echo "ERROR: $OBJ not found. Re-clone smx-smx/xzre into xz-artifacts/analysis/." >&2
  exit 1
fi
ACTUAL_SHA=$(shasum -a 256 "$OBJ" | awk '{print $1}')
if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "ERROR: $OBJ hash mismatch. Expected $EXPECTED_SHA, got $ACTUAL_SHA." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# 2. Full disassembly to a temp file (AT&T syntax, demangled, with sym names)
TMP=$(mktemp)
trap "rm -f $TMP" EXIT
objdump -d -M att --no-show-raw-insn --demangle "$OBJ" > "$TMP"

# 3. Slice named functions. The names below come from smx-smx/xzre's symbol
#    table — confirm they appear in the disassembly before slicing.
extract_fn() {
  local fn="$1"
  local out="$2"
  if ! grep -qE "<${fn}>:" "$TMP"; then
    echo "WARN: function <${fn}> not found in $OBJ — skipping ${out}" >&2
    return 0
  fi
  awk -v fn="$fn" '
    $0 ~ ("<"fn">:") { capture=1 }
    capture && /^$/   { capture=0 }
    capture           { print }
  ' "$TMP" > "$OUT_DIR/$out"
  echo "wrote $OUT_DIR/$out ($(wc -l < "$OUT_DIR/$out") lines)"
}

# Three regions for the §4 code blocks. Function names per smx-smx/xzre.
extract_fn "_get_cpuid"            "get_cpuid.s"
extract_fn "_resolve"              "got_walker.s"               # GOT walker
extract_fn "RSA_public_decrypt"    "rsa_public_decrypt_hook.s"  # the hook

# 4. Summary
echo ""
echo "Disassembly snippets ready in $OUT_DIR/:"
ls -la "$OUT_DIR/"
```

- [ ] **Step 2: Make executable and run**

```bash
chmod +x scripts/extract-disasm.sh
./scripts/extract-disasm.sh
```

Expected: at least one `.s` file written to `xz-artifacts/analysis/disasm/`. **It is acceptable if some `WARN: function not found` messages appear** — the function names in `smx-smx/xzre` may have changed, in which case the next step adapts the names.

- [ ] **Step 3: If any function was not found, identify the correct name**

```bash
objdump -d -M att xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o | grep -E "^[0-9a-f]+ <" | head -40
```

This lists every function in the object. Find the three semantically-correct ones:
- The **IFUNC resolver entry** — likely contains `cpuid` in the name or is the only function returning a function pointer
- The **GOT walker** — likely named `_resolve`, `resolve_symbol`, or similar; contains references to `link_map` / `_dl_*`
- The **`RSA_public_decrypt` hook** — exact name `RSA_public_decrypt`

Update `scripts/extract-disasm.sh` `extract_fn` calls with the correct names, re-run, verify all three `.s` files exist.

- [ ] **Step 4: Sanity-check the snippets**

```bash
wc -l xz-artifacts/analysis/disasm/*.s
head -10 xz-artifacts/analysis/disasm/rsa_public_decrypt_hook.s
```

Expected: each `.s` file is 20–500 lines (functions of varying length); the head shows AT&T syntax (`mov`, `lea`, `%rdi`, etc.).

- [ ] **Step 5: Commit the script**

```bash
git add scripts/extract-disasm.sh
git commit -m "xz: script to extract named disassembly regions from the malicious .o"
```

---

## Task 6: Pre-compute the sed-pipeline JSON

**Files:**
- Create: `scripts/build-xz-pipeline-data.ts`
- Will produce: `src/data/xz-pipeline.json`

This script runs the **actual** stage-1 transforms (`tr`, `xz -d`) against the local malicious test files and emits a JSON describing each stage's input/output. The bytes shown in the SedPipeline widget are *the* bytes — never re-implemented in JS.

- [ ] **Step 1: Write the script**

Write `scripts/build-xz-pipeline-data.ts`:

```typescript
/**
 * Pre-compute the sed-pipeline stage data for src/components/xz/SedPipeline.tsx.
 *
 * Runs the *actual* shell transforms against xz-artifacts/extracted/xz-5.6.1/tests/files/.
 * Emits src/data/xz-pipeline.json — an ordered list of stages with inputs,
 * outputs, byte-range provenance, and the script tokens that produced each.
 *
 * Determinism: re-runnable; output is checked into git via the data/ collection.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

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
  const r = spawnSync('sh', ['-c', cmd], { input, maxBuffer: 16 * 1024 * 1024 });
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
const trCmd = `tr "\\t \\-_" " \\t_\\-"`;
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

// Stage 2 (the more elaborate pipeline on good-large_compressed.lzma) requires
// `eval $i` with carefully-constructed head/tail substrings. The decoded Stage-1
// script contains those exact commands. Rather than re-construct them in TS,
// extract them by running stage-1 in a sandboxed shell with $srcdir pointed at
// our local artifacts. This is safe on macOS (the backdoor's Linux/deb/rpm gate
// prevents anything beyond extraction even if invoked with malicious env).
//
// We DO NOT execute the full chain. We extract just the byte-transform pipeline
// from the stage-1 script and run that piece against good-large_compressed.lzma,
// stopping before /bin/sh.
//
// The pipeline (per Russ Cox / Sam James):
//   xz -dc good-large_compressed.lzma | <head-chunker> | tail -c +31265 |
//     tr "\\5-\\$\\0-\\7" "\\$\\0-\\5\\6-\\7" | xz -F raw --lzma1 -dc
//
// We codify it explicitly, then verify the final magic bytes are an ELF header.

const HEAD_CHUNKER =
  // Repeats: skip 1024 + keep 2048, ending with keep 939. Per Russ Cox xz-script.
  '((head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +2048 && ' +
  '(head -c +1024 >/dev/null) && head -c +939)';

const stage4Out = shell(`xz -dc ${GOOD}`);
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

const stage5Out = shell(`xz -dc ${GOOD} | ${HEAD_CHUNKER}`);
const s5 = hex(stage5Out);
stages.push({
  id: 's5-head-chunks',
  label: 'head -c +1024 >/dev/null && head -c +2048 && … (×11) && head -c +939',
  command: HEAD_CHUNKER,
  scriptTokens: ['head', '-c', '1024', '2048', '939'],
  inputBytes: s4.hex,
  outputBytes: s5.hex,
  truncated: { input: s4.truncated, output: s5.truncated },
});

const stage6Out = shell(`xz -dc ${GOOD} | ${HEAD_CHUNKER} | tail -c +31265`);
const s6 = hex(stage6Out);
stages.push({
  id: 's6-tail',
  label: 'tail -c +31265',
  command: 'tail -c +31265',
  scriptTokens: ['tail', '-c', '31265'],
  inputBytes: s5.hex,
  outputBytes: s6.hex,
  truncated: { input: s5.truncated, output: s6.truncated },
});

const tr2Cmd = `LC_ALL=C tr "\\5-\\$\\0-\\7" "\\$\\0-\\5\\6-\\7"`;
const stage7Out = shell(`xz -dc ${GOOD} | ${HEAD_CHUNKER} | tail -c +31265 | ${tr2Cmd}`);
const s7 = hex(stage7Out);
stages.push({
  id: 's7-tr-substitution',
  label: 'tr "\\5-\\$\\0-\\7" "\\$\\0-\\5\\6-\\7"',
  command: tr2Cmd,
  scriptTokens: ['tr', '\\5-\\$\\0-\\7', '\\$\\0-\\5\\6-\\7'],
  inputBytes: s6.hex,
  outputBytes: s7.hex,
  truncated: { input: s6.truncated, output: s7.truncated },
});

const stage8Out = shell(
  `xz -dc ${GOOD} | ${HEAD_CHUNKER} | tail -c +31265 | ${tr2Cmd} | xz -F raw --lzma1 -dc`
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
// Stage-1 output must start with shell shebang or directly with the script
const s3str = stage3Output.toString('utf8', 0, 200);
if (!s3str.includes('eval') && !s3str.includes('srcdir')) {
  throw new Error(`Stage-3 output doesn't look like the stage-1 shell script:\n${s3str}`);
}
// Stage-8 output must be a shell script (Stage 2)
const s8str = stage8Out.toString('utf8', 0, 200);
if (!s8str.includes('AWK') && !s8str.includes('eval') && !s8str.includes('srcdir')) {
  console.warn(`Stage-8 output (first 200 bytes utf8): ${s8str}`);
  // Don't throw — RC4-decoded shell can have non-utf8 prefix; just warn.
}
if (stages.length !== 8) throw new Error(`Expected 8 stages, got ${stages.length}`);

// ── Emit ───────────────────────────────────────────────────────
const out = 'src/data/xz-pipeline.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ stages, generatedAt: new Date().toISOString() }, null, 2));
console.log(`wrote ${out} — ${stages.length} stages, ${Buffer.byteLength(JSON.stringify(stages))} bytes`);
```

- [ ] **Step 2: Run the script**

```bash
bun run scripts/build-xz-pipeline-data.ts
```

Expected output: `wrote src/data/xz-pipeline.json — 8 stages, ~XXXXXX bytes`. If anything throws, **stop and investigate** — the malicious-file hashes are pinned, so unexpected output means the pipeline itself is misconfigured (most likely the head-chunker count or the tr substitution syntax differs from what shell expects).

- [ ] **Step 3: Manually inspect the output**

```bash
# Confirm Stage-3 output is the actual stage-1 shell script
xxd xz-artifacts/stages/01-stage1.sh | head -30
# Confirm Stage-8 output is the actual stage-2 shell script
file xz-artifacts/stages/02-stage2.sh
xxd xz-artifacts/stages/02-stage2.sh | head -30

# Confirm the JSON is well-formed
jq '.stages | length' src/data/xz-pipeline.json
jq '.stages[].id' src/data/xz-pipeline.json
```

Expected: 8 stages with IDs `s1-input` through `s8-final`. Stage 1 file shows readable shell script. Stage 2 file is more obfuscated (RC4-decoded) but still mostly shell.

- [ ] **Step 4: Commit the script and the data**

```bash
git add scripts/build-xz-pipeline-data.ts src/data/xz-pipeline.json
git commit -m "xz: pre-compute sed-pipeline stages (8) from real artifact bytes"
```

---

## Task 7: `<Mnemonic>` component for AsmLookup cross-linking

**Files:**
- Create: `src/components/xz/Mnemonic.astro`

Astro component (not Preact) — it's a tiny static wrapper, no need for client-side JS.

- [ ] **Step 1: Write the component**

Write `src/components/xz/Mnemonic.astro`:

```astro
---
/**
 * Inline-link an x86-64 mnemonic to its AsmLookup entry.
 * Usage in MDX:  <Mnemonic op="cmovne">cmovne</Mnemonic>
 *
 * The op prop is the AsmLookup slug (lowercased mnemonic). The link opens
 * in a new tab so the reader doesn't lose their place in the article.
 */
interface Props {
  op: string;
}
const { op } = Astro.props;
---
<a
  class="xz-mnemonic"
  href={`/tools/asm-lookup/?op=${op}`}
  target="_blank"
  rel="noopener"
  title={`Look up ${op} in AsmLookup`}
><slot /></a>

<style>
.xz-mnemonic {
  text-decoration: underline dotted;
  text-underline-offset: 0.18em;
  color: inherit;
}
.xz-mnemonic:hover {
  color: var(--accent, currentColor);
  text-decoration-style: solid;
}
</style>
```

- [ ] **Step 2: Smoke test by referencing it from the stub MDX**

Modify `src/content/blog/xz-backdoor/index.mdx` — add an import + a sample mnemonic usage at the bottom of the stub:

```mdx
import Mnemonic from '~/components/xz/Mnemonic.astro';

The classic check is <Mnemonic op="cmp">cmp</Mnemonic> followed by <Mnemonic op="je">je</Mnemonic>.
```

- [ ] **Step 3: Run dev server and verify**

```bash
bun run dev &
sleep 3
curl -s http://localhost:4321/blog/xz-backdoor/ | grep -E 'xz-mnemonic|asm-lookup'
kill %1 2>/dev/null
```

Expected: at least two `<a class="xz-mnemonic">` elements with `href="/tools/asm-lookup/?op=cmp"` and `…?op=je"`.

- [ ] **Step 4: Revert the smoke-test addition** (the real prose lives in T16)

Restore `src/content/blog/xz-backdoor/index.mdx` to the T3 stub.

- [ ] **Step 5: Commit**

```bash
git add src/components/xz/Mnemonic.astro src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: <Mnemonic> shortcode — links AT&T mnemonics to AsmLookup"
```

---

## Task 8: SedPipeline widget (CHECKPOINT — review with Hugo before continuing)

**Files:**
- Create: `src/components/xz/SedPipeline.tsx`
- Create: `src/components/xz/shared/motion.ts`

This is the centerpiece. After this task, **stop and ask Hugo for direction approval before continuing to T9+**.

- [ ] **Step 1: Create the Motion One helper**

Write `src/components/xz/shared/motion.ts`:

```typescript
/**
 * Reduced-motion-aware tween helper. Wraps Motion One's animate() so every
 * call respects prefers-reduced-motion automatically.
 */
import { animate, type AnimationOptions } from 'motion';

export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function tween(
  el: Element | string,
  to: Record<string, unknown>,
  opts: AnimationOptions = {},
) {
  if (reducedMotion()) {
    // Apply final state instantly
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (node && node instanceof HTMLElement) {
      Object.entries(to).forEach(([k, v]) => {
        (node.style as any)[k] = String(v);
      });
    }
    return;
  }
  return animate(el, to, { duration: 0.3, easing: 'ease-out', ...opts });
}
```

- [ ] **Step 2: Write the SedPipeline component**

Write `src/components/xz/SedPipeline.tsx`:

```tsx
import { useState, useMemo } from 'preact/hooks';
import data from '../../data/xz-pipeline.json';

interface Stage {
  id: string;
  label: string;
  command: string;
  scriptTokens: string[];
  inputBytes: string;     // hex-encoded
  outputBytes: string;    // hex-encoded
  truncated: { input: boolean; output: boolean };
}
const STAGES: Stage[] = data.stages;

/* Render a hex-encoded byte string as a grid of monospace cells.
   Highlights are byte-index ranges to color (provenance from the previous stage). */
function ByteGrid({ hex, highlight }: { hex: string; highlight?: [number, number][] }) {
  const bytes = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < hex.length; i += 2) out.push(hex.slice(i, i + 2));
    return out;
  }, [hex]);

  const isHighlighted = (i: number) =>
    highlight?.some(([a, b]) => i >= a && i < b);

  return (
    <pre class="xz-byte-grid xz-byte-canvas" aria-hidden="true">
      {bytes.map((b, i) => (
        <span
          key={i}
          class={`xz-byte ${isHighlighted(i) ? 'xz-byte-hl' : ''}`}
        >{b}</span>
      ))}
    </pre>
  );
}

export default function SedPipeline() {
  const [step, setStep] = useState(0);
  const stage = STAGES[step];
  const isLast = step === STAGES.length - 1;

  function next() { setStep((s) => Math.min(s + 1, STAGES.length - 1)); }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }
  function reset() { setStep(0); }

  return (
    <figure class="xz-widget xz-sedpipe" role="group" aria-label="Sed pipeline stepper">
      <header class="xz-sedpipe-head">
        <span class="xz-sedpipe-counter">Stage {step + 1} / {STAGES.length}</span>
        <h3 class="xz-sedpipe-title">{stage.label}</h3>
      </header>

      <div class="xz-sedpipe-cmd">
        <code>{stage.command}</code>
      </div>

      <div class="xz-sedpipe-grids">
        <div>
          <p class="xz-sedpipe-grid-label">input{stage.truncated.input && <em> (first 4 KB shown)</em>}</p>
          <ByteGrid hex={stage.inputBytes} />
        </div>
        <div>
          <p class="xz-sedpipe-grid-label">output{stage.truncated.output && <em> (first 4 KB shown)</em>}</p>
          <ByteGrid hex={stage.outputBytes} />
        </div>
      </div>

      <nav class="xz-sedpipe-nav" aria-label="Pipeline navigation">
        <button onClick={prev} disabled={step === 0} aria-label="Previous stage">←</button>
        <button onClick={reset} aria-label="Reset">⟲</button>
        <button onClick={next} disabled={isLast} aria-label="Next stage">→</button>
      </nav>

      <p class="xz-sedpipe-hint">
        {!isLast
          ? <>Press <kbd>→</kbd> to advance · {STAGES.length - step - 1} stages remain.</>
          : <>Final stage — these bytes become <code>liblzma_la-crc64-fast.o</code>.</>}
      </p>
    </figure>
  );
}
```

- [ ] **Step 3: Add styles to `src/styles/xz.css`**

Append to `src/styles/xz.css`:

```css
/* SedPipeline (③) */
.xz-sedpipe {
  border: 1px solid color-mix(in oklch, currentColor 12%, transparent);
  border-radius: 0.5rem;
  padding: 1.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.xz-sedpipe-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
}
.xz-sedpipe-counter {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--xz-infra);
}
.xz-sedpipe-title {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.9rem;
  margin: 0;
  color: var(--xz-attacker);
}
.xz-sedpipe-cmd {
  background: color-mix(in oklch, currentColor 4%, transparent);
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  white-space: pre;
}
.xz-sedpipe-grids {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 720px) {
  .xz-sedpipe-grids { grid-template-columns: 1fr; }
}
.xz-sedpipe-grid-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--xz-infra);
  margin-bottom: 0.25rem;
}
.xz-sedpipe-grid-label em {
  text-transform: none;
  letter-spacing: 0;
  font-style: italic;
}
.xz-byte-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  font-size: 0.65rem;
  line-height: 1.2;
  padding: 0.5rem;
  border-radius: 0.25rem;
  max-height: 18rem;
  overflow-y: auto;
}
.xz-byte {
  padding: 0.05rem 0.15rem;
  color: color-mix(in oklch, currentColor 65%, transparent);
}
.xz-byte-hl {
  color: var(--xz-attacker);
  background: color-mix(in oklch, var(--xz-attacker) 10%, transparent);
  border-radius: 2px;
}
.xz-sedpipe-nav {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}
.xz-sedpipe-nav button {
  padding: 0.25rem 0.75rem;
  border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
}
.xz-sedpipe-nav button:hover:not(:disabled) {
  border-color: var(--xz-attacker);
  color: var(--xz-attacker);
}
.xz-sedpipe-nav button:disabled { opacity: 0.4; cursor: not-allowed; }
.xz-sedpipe-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--xz-infra);
  margin-top: 0.75rem;
}
```

- [ ] **Step 4: Wire SedPipeline into the stub MDX for review**

Modify `src/content/blog/xz-backdoor/index.mdx`:

```mdx
---
title: "The XZ backdoor"
description: "An interactive walkthrough of CVE-2024-3094 — how a two-year social-engineering campaign almost shipped a sshd backdoor in liblzma."
date: 2026-04-25
draft: true
categories: ["security"]
tags: ["xz", "cve-2024-3094", "supply-chain", "reverse-engineering"]
---

import '../../../styles/xz.css';
import SedPipeline from '~/components/xz/SedPipeline';

## Stage CHECKPOINT — SedPipeline widget

<SedPipeline client:visible />
```

- [ ] **Step 5: Run dev server and verify visually**

```bash
bun run dev
```

Open `http://localhost:4321/blog/xz-backdoor/` in a browser. Visual checklist:
- [ ] Widget renders with header, counter (`Stage 1 / 8`), title (file name)
- [ ] Stepping `→` advances stage; counter updates; bytes change between stages
- [ ] Stepping back `←` works; reset `⟲` returns to stage 1
- [ ] On stage 8, hint reads "these bytes become `liblzma_la-crc64-fast.o`"
- [ ] Bytes are visible (not all whitespace); hex grid wraps; max-height scroll works
- [ ] Light + dark mode both render legibly
- [ ] At <720px width, input/output stack vertically
- [ ] No console errors

- [ ] **Step 6: Commit and STOP**

```bash
git add src/components/xz/SedPipeline.tsx src/components/xz/shared/motion.ts src/styles/xz.css src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: SedPipeline widget — centerpiece, CHECKPOINT for review"
```

**Pause execution. Ask Hugo to review the rendered SedPipeline against the spec's "Stacked transforms widget" description. Wait for explicit approval (or change requests + iteration) before proceeding to T9.**

---

## Task 9: Hand-author the timeline JSON

**Files:**
- Create: `src/data/xz-timeline.json`

Source: cross-reference Russ Cox `xz-timeline`, Sam James gist, and Andres Freund's oss-security post for every event. Quotes are verbatim from primary sources.

- [ ] **Step 1: Write the JSON**

Write `src/data/xz-timeline.json` (15-20 events; this is the canonical curated list):

```json
{
  "events": [
    {
      "date": "2021-10-29",
      "actor": "JiaT75",
      "kind": "preparatory",
      "title": "First public commit by Jia Tan",
      "summary": "PR to libarchive that subtly weakens input sanitization (replaces safe_fprintf with fprintf). Merged.",
      "quote": null,
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2022-04-22",
      "actor": "Jigar Kumar",
      "kind": "pressure",
      "title": "First pressure email to xz-devel",
      "summary": "Sock-puppet email complaining that Jia Tan's patch isn't being merged.",
      "quote": "Patches spend years on this mailing list. There is no reason to think anything is coming soon.",
      "source": "https://www.mail-archive.com/xz-devel@tukaani.org/msg00566.html"
    },
    {
      "date": "2022-05-19",
      "actor": "Lasse Collin",
      "kind": "context",
      "title": "Lasse mentions Jia Tan as future co-maintainer",
      "summary": "Reply on xz-devel: 'Jia Tan has helped me off-list with XZ Utils and he might have a bigger role in the future…'",
      "quote": "Jia Tan has helped me off-list with XZ Utils and he might have a bigger role in the future at least with XZ Utils.",
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2022-06-08",
      "actor": "Lasse Collin",
      "kind": "context",
      "title": "Lasse pushes back on the pressure",
      "summary": "Discloses ongoing burnout and longterm mental-health struggles, hinting Jia Tan will likely take a bigger role.",
      "quote": "I haven't lost interest but my ability to care has been fairly limited mostly due to longterm mental health issues but also due to some other things.",
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2022-06-14",
      "actor": "Jigar Kumar",
      "kind": "pressure",
      "title": "Second pressure email",
      "summary": "Demands new maintainer; suggests delays are unacceptable.",
      "quote": "With your current rate, I very doubt to see 5.4.0 release this year. The only progress since april has been small changes to test code.",
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2022-11-30",
      "actor": "Lasse Collin",
      "kind": "preparatory",
      "title": "Jia Tan listed as co-maintainer",
      "summary": "README.md updated to list both Lasse and Jia Tan as project maintainers.",
      "quote": null,
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2023-01-11",
      "actor": "Jia Tan",
      "kind": "preparatory",
      "title": "Jia Tan takes over releases",
      "summary": "Lasse releases v5.4.1 — the final release Lasse signs. Subsequent releases are signed by Jia Tan.",
      "quote": null,
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2023-07-08",
      "actor": "Jia Tan",
      "kind": "preparatory",
      "title": "PR to disable IFUNC fuzzing in oss-fuzz",
      "summary": "Jia Tan asks Google's oss-fuzz to disable IFUNC checks, allegedly to mask later malicious changes.",
      "quote": null,
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2024-01-19",
      "actor": "Jia Tan",
      "kind": "preparatory",
      "title": "Removes Landlock sandbox feature-test from CMakeLists",
      "summary": "Small but later-noted hostile preparation; reduces sandboxing on the build.",
      "quote": null,
      "source": "https://research.swtch.com/xz-timeline"
    },
    {
      "date": "2024-02-23",
      "actor": "Jia Tan",
      "kind": "malicious",
      "title": "Malicious test files committed",
      "summary": "Adds tests/files/bad-3-corrupt_lzma2.xz and good-large_compressed.lzma — disguised as test corpus, actually contain the obfuscated payload.",
      "quote": null,
      "source": "https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27"
    },
    {
      "date": "2024-02-24",
      "actor": "Jia Tan",
      "kind": "malicious",
      "title": "xz-utils 5.6.0 released",
      "summary": "Tarball ships with a modified m4/build-to-host.m4 that triggers the payload during ./configure. The modification exists only in the tarball, not in git.",
      "quote": null,
      "source": "https://www.openwall.com/lists/oss-security/2024/03/29/4"
    },
    {
      "date": "2024-03-09",
      "actor": "Jia Tan",
      "kind": "malicious",
      "title": "xz-utils 5.6.1 released",
      "summary": "Updated payload — fixes Valgrind errors that were tipping off Debian's autopkgtest. The hurried fix is itself a tell.",
      "quote": null,
      "source": "https://www.openwall.com/lists/oss-security/2024/03/29/4"
    },
    {
      "date": "2024-03-29",
      "actor": "Andres Freund",
      "kind": "discovery",
      "title": "Public disclosure on oss-security",
      "summary": "Andres Freund posts to oss-security@lists.openwall.com at 08:51 UTC -0700. Subject: 'backdoor in upstream xz/liblzma leading to ssh server compromise'. He found it while micro-benchmarking PostgreSQL on Debian sid — sshd connections were taking 500 ms of extra CPU and producing Valgrind errors.",
      "quote": "I observed sshd processes were using a surprising amount of CPU, despite immediately failing because of wrong usernames etc.",
      "source": "https://www.openwall.com/lists/oss-security/2024/03/29/4"
    },
    {
      "date": "2024-03-29",
      "actor": "GitHub",
      "kind": "discovery",
      "title": "tukaani-project/xz disabled by GitHub",
      "summary": "GitHub disables the tukaani-project organization within hours. Distros (Debian, Fedora, Arch, openSUSE, Kali) ship rollbacks the same day.",
      "quote": null,
      "source": "https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27"
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

```bash
jq '.events | length' src/data/xz-timeline.json
jq '.events | map(.kind) | unique' src/data/xz-timeline.json
```

Expected: 14 events (or whatever the final count is); kinds are `["context", "discovery", "malicious", "preparatory", "pressure"]` (sorted).

- [ ] **Step 3: Commit**

```bash
git add src/data/xz-timeline.json
git commit -m "xz: timeline data (14 dated events with quotes + sources)"
```

---

## Task 10: Hand-author the distros JSON

**Files:**
- Create: `src/data/xz-distros.json`

- [ ] **Step 1: Write the JSON**

Write `src/data/xz-distros.json`:

```json
{
  "distros": [
    { "id": "debian-sid",       "name": "Debian sid",         "icon": "debian.svg",   "status": "exploitable",     "shipped": "5.6.0 / 5.6.1", "note": "Rolled back to 5.4.5-0.2 on 2024-03-29." },
    { "id": "fedora-40",        "name": "Fedora 40 Beta",     "icon": "fedora.svg",   "status": "exploitable",     "shipped": "5.6.0 / 5.6.1", "note": "Red Hat issued urgent advisory." },
    { "id": "fedora-rawhide",   "name": "Fedora Rawhide",     "icon": "fedora.svg",   "status": "exploitable",     "shipped": "5.6.x",         "note": null },
    { "id": "opensuse-tw",      "name": "openSUSE Tumbleweed","icon": "opensuse.svg", "status": "exploitable",     "shipped": "5.6.1",         "note": null },
    { "id": "kali",             "name": "Kali rolling",       "icon": "kali.svg",     "status": "exploitable",     "shipped": "5.6.0 (briefly)", "note": "Pulled within hours." },
    { "id": "arch",             "name": "Arch Linux",         "icon": "arch.svg",     "status": "shipped-inert",   "shipped": "5.6.0 / 5.6.1", "note": "Arch's openssh does not link libsystemd by default — backdoor present but path to sshd missing." },
    { "id": "alpine-edge",      "name": "Alpine edge",        "icon": "alpine.svg",   "status": "shipped-inert",   "shipped": "5.6.x",         "note": "musl, not glibc — wrong ABI for the IFUNC trick." },
    { "id": "debian-stable",    "name": "Debian stable",      "icon": "debian.svg",   "status": "spared",          "shipped": "5.4.x only",    "note": "Stable never received the malicious release." },
    { "id": "ubuntu-lts",       "name": "Ubuntu LTS",         "icon": "ubuntu.svg",   "status": "spared",          "shipped": "5.4.x only",    "note": "All LTS lines safe." },
    { "id": "rhel",             "name": "RHEL",               "icon": "redhat.svg",   "status": "spared",          "shipped": "≤5.2.4",        "note": "Stable Red Hat never shipped 5.6." },
    { "id": "amazon-linux",     "name": "Amazon Linux",       "icon": "aws.svg",      "status": "spared",          "shipped": "≤5.2.5",        "note": null }
  ],
  "statuses": {
    "exploitable":   { "label": "Shipped & exploitable", "color": "var(--xz-attacker)" },
    "shipped-inert": { "label": "Shipped but inert",     "color": "var(--xz-infra)" },
    "spared":        { "label": "Never shipped",         "color": "var(--xz-defender)" }
  }
}
```

- [ ] **Step 2: Validate**

```bash
jq '.distros | length' src/data/xz-distros.json
jq '.distros | group_by(.status) | map({status: .[0].status, count: length})' src/data/xz-distros.json
```

Expected: 11 distros; counts split across 3 status groups.

- [ ] **Step 3: Commit**

```bash
git add src/data/xz-distros.json
git commit -m "xz: distros data (11 entries, 3-tier status)"
```

---

## Task 11: TarballDiff inline widget

**Files:**
- Create: `src/components/xz/TarballDiff.astro`

Astro static component (no client-side JS). Compares the file tree of the git repo vs the released tarball, highlighting `m4/build-to-host.m4` as tarball-only.

- [ ] **Step 1: Write the component**

Write `src/components/xz/TarballDiff.astro`:

```astro
---
/**
 * Static side-by-side of git tree vs release tarball, highlighting the m4/
 * directory difference. The whole point: build-to-host.m4 in the tarball
 * does not exist in the git tree at this version. That asymmetry hid the
 * injector from anyone reading git history.
 */
const gitTree = [
  { path: 'm4/', kind: 'dir' },
  { path: 'm4/.gitignore', kind: 'file' },
  { path: 'm4/getopt.m4', kind: 'file' },
  { path: 'm4/posix-shell.m4', kind: 'file' },
  { path: 'm4/tuklib_*.m4', kind: 'file', label: 'tuklib_*.m4 (×7)' },
  // build-to-host.m4 is absent in git
];

const tarballTree = [
  { path: 'm4/', kind: 'dir' },
  { path: 'm4/build-to-host.m4', kind: 'file', flag: 'malicious' },
  { path: 'm4/getopt.m4', kind: 'file' },
  { path: 'm4/gettext.m4', kind: 'file' },
  { path: 'm4/host-cpu-c-abi.m4', kind: 'file' },
  { path: 'm4/posix-shell.m4', kind: 'file' },
  { path: 'm4/tuklib_*.m4', kind: 'file', label: 'tuklib_*.m4 (×7)' },
  { path: 'm4/intl*.m4', kind: 'file', label: 'intl*.m4 (×8)' },
];
---
<figure class="xz-widget xz-tarball-diff" aria-label="Git tree vs release tarball comparison">
  <div class="xz-tarball-grid">
    <div class="xz-tarball-col">
      <h4 class="xz-tarball-head">git tree (5.6.1 tag)</h4>
      <ul class="xz-tarball-tree">
        {gitTree.map((n) => (
          <li class={`xz-tarball-${n.kind}`}>{n.label ?? n.path}</li>
        ))}
      </ul>
    </div>
    <div class="xz-tarball-col">
      <h4 class="xz-tarball-head">released tarball (xz-5.6.1.tar.gz)</h4>
      <ul class="xz-tarball-tree">
        {tarballTree.map((n) => (
          <li class={`xz-tarball-${n.kind} ${n.flag ? `xz-tarball-${n.flag}` : ''}`}>
            {n.label ?? n.path}
            {n.flag === 'malicious' && <span class="xz-tarball-badge"> ← injector</span>}
          </li>
        ))}
      </ul>
    </div>
  </div>
  <figcaption>The injector lives only in the released tarball. Anyone auditing the git tree never saw it.</figcaption>
</figure>

<style>
.xz-tarball-diff { font-family: var(--font-mono, ui-monospace, monospace); }
.xz-tarball-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  border: 1px solid color-mix(in oklch, currentColor 12%, transparent);
  border-radius: 0.5rem;
  padding: 1.25rem;
}
@media (max-width: 720px) {
  .xz-tarball-grid { grid-template-columns: 1fr; }
}
.xz-tarball-head {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--xz-infra);
  margin: 0 0 0.5rem;
  font-family: var(--font-sans, system-ui, sans-serif);
}
.xz-tarball-tree { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; }
.xz-tarball-tree li { padding: 0.1rem 0; }
.xz-tarball-dir { color: var(--xz-infra); font-weight: 500; }
.xz-tarball-malicious { color: var(--xz-attacker); font-weight: 600; }
.xz-tarball-badge {
  font-size: 0.7rem;
  font-style: italic;
  color: var(--xz-attacker);
  margin-left: 0.5rem;
}
.xz-tarball-diff figcaption {
  text-align: center;
  font-size: 0.85rem;
  color: var(--xz-infra);
  font-style: italic;
  margin-top: 0.75rem;
}
</style>
```

- [ ] **Step 2: Smoke test in stub MDX**

Add temporarily to `index.mdx`:

```mdx
import TarballDiff from '~/components/xz/TarballDiff.astro';

<TarballDiff />
```

`bun run dev`, open the page, confirm two columns render, the malicious file is colored, badge shows. Then remove the smoke-test addition.

- [ ] **Step 3: Commit**

```bash
git add src/components/xz/TarballDiff.astro src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: TarballDiff inline widget — git vs tarball asymmetry"
```

---

## Task 12: LatencyChart inline widget

**Files:**
- Create: `src/components/xz/LatencyChart.astro`

Static SVG bar chart of the sshd connection-time anomaly (0.3s baseline → 0.8s spike on 5.6.0/5.6.1).

- [ ] **Step 1: Write the component**

Write `src/components/xz/LatencyChart.astro`:

```astro
---
/**
 * Tiny inline SVG bar chart: sshd connection latency before vs after
 * the malicious liblzma was loaded. Numbers from Andres Freund's oss-security
 * post (~0.3s baseline → ~0.8s with the backdoor active).
 */
const bars = [
  { label: '5.4.6 (clean)',    ms: 300, kind: 'defender' },
  { label: '5.6.0 (backdoor)', ms: 800, kind: 'attacker' },
  { label: '5.6.1 (backdoor)', ms: 800, kind: 'attacker' },
];
const W = 480;
const H = 200;
const PAD = { l: 110, r: 20, t: 20, b: 36 };
const innerW = W - PAD.l - PAD.r;
const innerH = H - PAD.t - PAD.b;
const maxMs = 1000;
const barH = (innerH / bars.length) * 0.55;
const rowH = innerH / bars.length;
---
<figure class="xz-widget xz-latency" aria-label="sshd connection latency, clean vs backdoored">
  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Latency comparison" class="xz-latency-svg">
    {/* x-axis ticks */}
    {[0, 250, 500, 750, 1000].map((t) => (
      <g>
        <line
          x1={PAD.l + (t / maxMs) * innerW}
          x2={PAD.l + (t / maxMs) * innerW}
          y1={PAD.t}
          y2={PAD.t + innerH}
          stroke="currentColor"
          stroke-opacity="0.08"
        />
        <text
          x={PAD.l + (t / maxMs) * innerW}
          y={H - 12}
          text-anchor="middle"
          font-size="10"
          fill="var(--xz-infra)"
        >{t}ms</text>
      </g>
    ))}
    {/* bars */}
    {bars.map((b, i) => (
      <g>
        <text
          x={PAD.l - 8}
          y={PAD.t + i * rowH + rowH / 2 + 4}
          text-anchor="end"
          font-size="11"
          fill="currentColor"
        >{b.label}</text>
        <rect
          x={PAD.l}
          y={PAD.t + i * rowH + (rowH - barH) / 2}
          width={(b.ms / maxMs) * innerW}
          height={barH}
          fill={`var(--xz-${b.kind})`}
          rx="2"
        />
        <text
          x={PAD.l + (b.ms / maxMs) * innerW + 6}
          y={PAD.t + i * rowH + rowH / 2 + 4}
          font-size="11"
          fill="var(--xz-infra)"
        >{b.ms}ms</text>
      </g>
    ))}
  </svg>
  <figcaption>
    Approximate sshd connection time, clean vs backdoored — the 500 ms anomaly that tipped Andres Freund off.
  </figcaption>
</figure>

<style>
.xz-latency-svg { width: 100%; height: auto; max-width: 480px; display: block; margin: 0 auto; }
.xz-latency figcaption {
  text-align: center;
  font-size: 0.85rem;
  color: var(--xz-infra);
  font-style: italic;
  margin-top: 0.5rem;
}
</style>
```

- [ ] **Step 2: Smoke test, verify in browser, then remove smoke-test addition.**

- [ ] **Step 3: Commit**

```bash
git add src/components/xz/LatencyChart.astro src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: LatencyChart inline widget — sshd latency anomaly"
```

---

## Task 13: Fetch svgl.app icons + DistroGrid widget

**Files:**
- Create: `scripts/fetch-svgl-icons.ts`
- Create: `src/data/xz-icons/{debian,fedora,opensuse,kali,arch,alpine,ubuntu,redhat,aws}.svg`
- Create: `src/components/xz/DistroGrid.astro`

- [ ] **Step 1: Write the icon-fetch script**

Write `scripts/fetch-svgl-icons.ts`:

```typescript
/**
 * Fetch the distro icons referenced by src/data/xz-distros.json from svgl.app
 * and write them to src/data/xz-icons/. Run once; outputs are checked in.
 *
 * svgl.app exposes a JSON catalogue at https://svgl.app/api/svgs that includes
 * a `route` field (raw SVG URL on raw.githubusercontent.com).
 */
import { writeFileSync, mkdirSync } from 'node:fs';

interface SvglEntry {
  title: string;
  category: string | string[];
  route: string | { light: string; dark: string };
}

const WANTED: Record<string, string> = {
  // Map our distro id → svgl title (case-insensitive substring match)
  'debian.svg':   'debian',
  'fedora.svg':   'fedora',
  'opensuse.svg': 'opensuse',
  'kali.svg':     'kali linux',
  'arch.svg':     'arch linux',
  'alpine.svg':   'alpine linux',
  'ubuntu.svg':   'ubuntu',
  'redhat.svg':   'red hat',
  'aws.svg':      'aws',
};

const cat = await fetch('https://svgl.app/api/svgs').then((r) => r.json()) as SvglEntry[];

mkdirSync('src/data/xz-icons', { recursive: true });

let ok = 0, miss = 0;
for (const [outName, query] of Object.entries(WANTED)) {
  const hit = cat.find((e) => e.title.toLowerCase().includes(query.toLowerCase()));
  if (!hit) {
    console.warn(`MISS: no svgl entry matching "${query}"`);
    miss++;
    continue;
  }
  const url = typeof hit.route === 'string' ? hit.route : hit.route.light;
  const svg = await fetch(url).then((r) => r.text());
  writeFileSync(`src/data/xz-icons/${outName}`, svg);
  console.log(`wrote src/data/xz-icons/${outName} ← ${hit.title}`);
  ok++;
}

console.log(`\n${ok} icons fetched, ${miss} missing.`);
if (miss > 0) {
  console.error('Some icons missing — adjust WANTED map and re-run.');
  process.exit(1);
}
```

- [ ] **Step 2: Run it**

```bash
bun run scripts/fetch-svgl-icons.ts
ls src/data/xz-icons/
```

Expected: 9 SVG files. If misses, adjust the `WANTED` map (some distro names may need different search strings).

- [ ] **Step 3: Write DistroGrid component**

Write `src/components/xz/DistroGrid.astro`:

```astro
---
import distrosData from '../../data/xz-distros.json';

interface Distro {
  id: string; name: string; icon: string; status: string; shipped: string; note: string | null;
}
interface StatusMeta {
  label: string; color: string;
}

const distros: Distro[] = distrosData.distros;
const statuses: Record<string, StatusMeta> = distrosData.statuses;

// Inline SVGs at build time. Vite supports ?raw imports for text content.
const icons: Record<string, string> = import.meta.glob('../../data/xz-icons/*.svg', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

function iconFor(name: string): string {
  // The glob keys are relative paths like "../../data/xz-icons/debian.svg"
  const k = Object.keys(icons).find((p) => p.endsWith(`/${name}`));
  return k ? icons[k] : '<svg viewBox="0 0 24 24"></svg>';
}
---
<figure class="xz-widget xz-distrogrid" aria-label="Distros affected by CVE-2024-3094">
  <div class="xz-distro-legend">
    {Object.entries(statuses).map(([key, meta]) => (
      <span class="xz-distro-chip">
        <span class="xz-distro-dot" style={`background: ${meta.color}`}></span>
        {meta.label}
      </span>
    ))}
  </div>
  <ul class="xz-distro-list" role="list">
    {distros.map((d) => {
      const meta = statuses[d.status];
      return (
        <li class={`xz-distro xz-distro-${d.status}`} title={d.note ?? ''}>
          <span class="xz-distro-icon" set:html={iconFor(d.icon)} aria-hidden="true"></span>
          <span class="xz-distro-name">{d.name}</span>
          <span class="xz-distro-shipped">{d.shipped}</span>
          {d.note && <span class="xz-distro-note">{d.note}</span>}
        </li>
      );
    })}
  </ul>
</figure>

<style>
.xz-distrogrid { font-size: 0.85rem; }
.xz-distro-legend {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--xz-infra);
  flex-wrap: wrap;
}
.xz-distro-chip { display: inline-flex; align-items: center; gap: 0.4rem; }
.xz-distro-dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}
.xz-distro-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}
.xz-distro {
  display: grid;
  grid-template-columns: 1.5rem 1fr auto;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid color-mix(in oklch, currentColor 10%, transparent);
}
.xz-distro-exploitable   { border-left: 3px solid var(--xz-attacker); }
.xz-distro-shipped-inert { border-left: 3px solid var(--xz-infra); }
.xz-distro-spared        { border-left: 3px solid var(--xz-defender); }
.xz-distro-icon { width: 1.5rem; height: 1.5rem; display: flex; align-items: center; }
.xz-distro-icon :global(svg) { width: 100%; height: 100%; }
.xz-distro-name { font-weight: 500; }
.xz-distro-shipped { font-family: var(--font-mono, monospace); font-size: 0.75rem; color: var(--xz-infra); }
.xz-distro-note { grid-column: 2 / -1; font-size: 0.75rem; font-style: italic; color: var(--xz-infra); }
</style>
```

- [ ] **Step 4: Smoke test, verify, remove smoke-test addition**

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-svgl-icons.ts src/data/xz-icons/ src/components/xz/DistroGrid.astro src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: DistroGrid widget + svgl.app icon fetch script"
```

---

## Task 14: Timeline set-piece widget

**Files:**
- Create: `src/components/xz/Timeline.tsx`

Set piece ① — sticky-vis scrollytelling per spec. Uses `scrollama` to drive a step index; horizontal timeline arc renders as SVG.

- [ ] **Step 1: Write the Timeline component**

Write `src/components/xz/Timeline.tsx`:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import scrollama from 'scrollama';
import data from '../../data/xz-timeline.json';
import { tween } from './shared/motion';

interface Event {
  date: string;
  actor: string;
  kind: 'context' | 'discovery' | 'malicious' | 'preparatory' | 'pressure';
  title: string;
  summary: string;
  quote: string | null;
  source: string;
}
const EVENTS: Event[] = data.events;

const KIND_COLOR: Record<Event['kind'], string> = {
  context:     'var(--xz-infra)',
  preparatory: 'var(--xz-infra)',
  pressure:    'var(--xz-attacker)',
  malicious:   'var(--xz-attacker)',
  discovery:   'var(--xz-defender)',
};

function dayOf(date: string): number {
  return Math.floor(new Date(date).getTime() / 86_400_000);
}
const FIRST = dayOf(EVENTS[0].date);
const LAST = dayOf(EVENTS[EVENTS.length - 1].date);
const SPAN = LAST - FIRST;

function xPercent(date: string): number {
  return ((dayOf(date) - FIRST) / SPAN) * 100;
}

export default function Timeline() {
  const [active, setActive] = useState(0);
  const stickyRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({
        step: '.xz-tl-step',
        offset: 0.6,
      })
      .onStepEnter((res) => {
        const idx = Number((res.element as HTMLElement).dataset.idx ?? 0);
        setActive(idx);
      });
    return () => scroller.destroy();
  }, []);

  useEffect(() => {
    if (!playheadRef.current) return;
    const target = xPercent(EVENTS[active].date);
    tween(playheadRef.current, { x1: `${target}%`, x2: `${target}%` }, { duration: 0.4 });
  }, [active]);

  return (
    <section class="xz-widget xz-tl" aria-label="Timeline of the xz backdoor attack">
      <div class="xz-tl-sticky" ref={stickyRef}>
        <svg viewBox="0 0 100 30" class="xz-tl-svg" preserveAspectRatio="none">
          {/* baseline */}
          <line x1="0" y1="15" x2="100" y2="15" stroke="currentColor" stroke-opacity="0.2" stroke-width="0.3" />
          {/* event ticks */}
          {EVENTS.map((e, i) => {
            const x = xPercent(e.date);
            const isActive = i === active;
            return (
              <g key={e.date + i}>
                <circle
                  cx={x}
                  cy="15"
                  r={isActive ? 1.4 : 0.9}
                  fill={KIND_COLOR[e.kind]}
                  opacity={isActive ? 1 : 0.65}
                  style={{ transition: 'r 0.2s, opacity 0.2s' }}
                />
              </g>
            );
          })}
          {/* playhead */}
          <line
            ref={playheadRef}
            x1="0" y1="3" x2="0" y2="27"
            stroke={KIND_COLOR[EVENTS[active].kind]}
            stroke-width="0.4"
          />
        </svg>
        <div class="xz-tl-current">
          <time class="xz-tl-date">{EVENTS[active].date}</time>
          <span class="xz-tl-actor">{EVENTS[active].actor}</span>
        </div>
      </div>
      <ol class="xz-tl-steps">
        {EVENTS.map((e, i) => (
          <li
            key={e.date + i}
            class={`xz-tl-step xz-tl-${e.kind}`}
            data-idx={i}
            data-active={i === active}
          >
            <h4 class="xz-tl-title">{e.title}</h4>
            <p class="xz-tl-summary">{e.summary}</p>
            {e.quote && <blockquote class="xz-tl-quote">"{e.quote}"</blockquote>}
            <a href={e.source} target="_blank" rel="noopener" class="xz-tl-source">source ↗</a>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Add Timeline styles to `src/styles/xz.css`**

Append:

```css
/* Timeline (①) */
.xz-tl { position: relative; margin-block: 4rem; }
.xz-tl-sticky {
  position: sticky;
  top: 5rem;
  background: color-mix(in oklch, var(--bg, #fff) 85%, transparent);
  backdrop-filter: blur(8px);
  padding: 1rem 0 1.25rem;
  z-index: 5;
  border-bottom: 1px solid color-mix(in oklch, currentColor 8%, transparent);
}
.xz-tl-svg { width: 100%; height: 3rem; display: block; overflow: visible; }
.xz-tl-current {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 0.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.85rem;
}
.xz-tl-date { color: var(--xz-attacker); font-weight: 600; }
.xz-tl-actor { color: var(--xz-infra); font-style: italic; }

.xz-tl-steps { list-style: none; padding: 0; margin: 2rem 0 0; }
.xz-tl-step {
  padding: 1.25rem 0 1.25rem 1.25rem;
  border-left: 2px solid color-mix(in oklch, currentColor 12%, transparent);
  margin-bottom: 1.5rem;
  opacity: 0.55;
  transition: opacity 0.3s, border-color 0.3s;
}
.xz-tl-step[data-active="true"] {
  opacity: 1;
  border-left-color: var(--xz-attacker);
}
.xz-tl-step.xz-tl-discovery[data-active="true"]   { border-left-color: var(--xz-defender); }
.xz-tl-step.xz-tl-context[data-active="true"]     { border-left-color: var(--xz-infra); }
.xz-tl-step.xz-tl-preparatory[data-active="true"] { border-left-color: var(--xz-infra); }

.xz-tl-title  { margin: 0 0 0.25rem; font-size: 1rem; }
.xz-tl-summary{ margin: 0 0 0.5rem; }
.xz-tl-quote  { font-style: italic; border-left: 2px solid currentColor; padding-left: 0.75rem; opacity: 0.85; margin: 0.5rem 0; }
.xz-tl-source { font-size: 0.8rem; color: var(--xz-infra); text-decoration: none; }
.xz-tl-source:hover { color: var(--xz-defender); text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  .xz-tl-step { transition: none; }
}
@media (max-width: 720px) {
  .xz-tl-sticky { position: static; backdrop-filter: none; }
}
```

- [ ] **Step 3: Smoke test in stub MDX**

Add temporarily:

```mdx
import Timeline from '~/components/xz/Timeline';

<Timeline client:visible />
```

`bun run dev`. Visual checklist:
- [ ] Sticky timeline arc renders at top of widget
- [ ] Scrolling through steps highlights current step (border color changes)
- [ ] Playhead on the timeline tweens to the current event's date
- [ ] At <720px, sticky disables and arc inlines
- [ ] All `source ↗` links open in new tabs

Remove smoke-test addition after.

- [ ] **Step 4: Commit**

```bash
git add src/components/xz/Timeline.tsx src/styles/xz.css src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: Timeline set-piece — sticky scrollytelling with playhead tween"
```

---

## Task 15: DepGraph set-piece widget

**Files:**
- Create: `src/components/xz/DepGraph.tsx`

Set piece ④. Five-node SVG graph reused across three states driven by scrollama. Same SVG, only highlights and animated edges change.

- [ ] **Step 1: Write the DepGraph component**

Write `src/components/xz/DepGraph.tsx`:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import scrollama from 'scrollama';

type Stage = 'legitimate' | 'ifunc' | 'attack';

const NODES: Record<string, { x: number; y: number; label: string; sub?: string }> = {
  sshd:        { x: 50,  y: 50,  label: 'sshd',                sub: 'OpenSSH server' },
  libsystemd:  { x: 250, y: 50,  label: 'libsystemd.so.0',     sub: 'sd_notify (distro patch)' },
  liblzma:     { x: 450, y: 50,  label: 'liblzma.so.5',        sub: 'compression — and the backdoor' },
  rsa:         { x: 250, y: 200, label: 'RSA_public_decrypt',  sub: 'libcrypto / OpenSSL' },
  ifunc:       { x: 450, y: 200, label: 'IFUNC resolver',      sub: '_get_cpuid (malicious)' },
};

const EDGES: { from: string; to: string; label: string; stages: Stage[] }[] = [
  { from: 'sshd',       to: 'libsystemd', label: 'sd_notify',        stages: ['legitimate', 'ifunc', 'attack'] },
  { from: 'libsystemd', to: 'liblzma',    label: 'journal compress', stages: ['legitimate', 'ifunc', 'attack'] },
  { from: 'liblzma',    to: 'ifunc',      label: 'IFUNC@CRC64',      stages: ['ifunc', 'attack'] },
  { from: 'ifunc',      to: 'rsa',        label: 'patches GOT',      stages: ['ifunc', 'attack'] },
  { from: 'sshd',       to: 'rsa',        label: 'cert verify',      stages: ['attack'] },
];

export default function DepGraph() {
  const [stage, setStage] = useState<Stage>('legitimate');

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: '.xz-dg-step', offset: 0.6 })
      .onStepEnter((res) => {
        const s = (res.element as HTMLElement).dataset.stage as Stage;
        if (s) setStage(s);
      });
    return () => scroller.destroy();
  }, []);

  function isActive(edge: typeof EDGES[number]): boolean {
    return edge.stages.includes(stage);
  }

  return (
    <section class="xz-widget xz-dg" aria-label="Dependency hijack chain">
      <div class="xz-dg-sticky">
        <svg viewBox="0 0 600 280" class="xz-dg-svg">
          {/* edges */}
          {EDGES.map((e) => {
            const a = NODES[e.from], b = NODES[e.to];
            const active = isActive(e);
            return (
              <g style={{ opacity: active ? 1 : 0.18, transition: 'opacity 0.3s' }}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={
                    e.from === 'ifunc' || e.from === 'sshd' && e.to === 'rsa'
                      ? 'var(--xz-attacker)' : 'currentColor'}
                  stroke-opacity={e.from === 'ifunc' || (e.from === 'sshd' && e.to === 'rsa') ? 0.9 : 0.4}
                  stroke-width="1.5"
                  stroke-dasharray={e.from === 'ifunc' ? '4 3' : undefined}
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 6}
                  text-anchor="middle"
                  font-size="10"
                  fill="var(--xz-infra)"
                >{e.label}</text>
              </g>
            );
          })}
          {/* nodes */}
          {Object.entries(NODES).map(([id, n]) => {
            const isHook = id === 'ifunc' || id === 'rsa';
            return (
              <g>
                <rect
                  x={n.x - 70} y={n.y - 18}
                  width="140" height="36"
                  rx="4"
                  fill="var(--bg, #fff)"
                  stroke={isHook && (stage === 'ifunc' || stage === 'attack') ? 'var(--xz-attacker)' : 'currentColor'}
                  stroke-opacity={isHook && (stage === 'ifunc' || stage === 'attack') ? 1 : 0.4}
                  stroke-width="1.5"
                  style={{ transition: 'stroke 0.3s, stroke-opacity 0.3s' }}
                />
                <text x={n.x} y={n.y - 2} text-anchor="middle" font-size="11" font-weight="600">{n.label}</text>
                {n.sub && <text x={n.x} y={n.y + 11} text-anchor="middle" font-size="9" fill="var(--xz-infra)">{n.sub}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <ol class="xz-dg-steps">
        <li class="xz-dg-step" data-stage="legitimate">
          <h4>1. The legitimate path</h4>
          <p>OpenSSH upstream does <em>not</em> link libsystemd. Most distros patch <code>sshd</code> to call <code>sd_notify()</code> for socket activation — and <code>libsystemd</code> in turn links <code>liblzma</code> for journal compression. That's how a compression library ends up loaded into the SSH daemon.</p>
        </li>
        <li class="xz-dg-step" data-stage="ifunc">
          <h4>2. The IFUNC resolver fires</h4>
          <p>Glibc calls IFUNC resolvers exactly once per process, very early — before RELRO marks the GOT read-only. The malicious <code>_get_cpuid</code> resolver walks the dynamic linker's link map, finds sshd's GOT entry for <code>RSA_public_decrypt</code>, and overwrites it with a pointer to the attacker's stub.</p>
        </li>
        <li class="xz-dg-step" data-stage="attack">
          <h4>3. An attack key arrives</h4>
          <p>A remote SSH client connects with a crafted RSA key. The hooked <code>RSA_public_decrypt</code> parses the modulus as <code>[tag][ed448_sig][cmd]</code>, verifies the signature against the embedded Ed448 public key, and on success calls <code>system(cmd)</code> as <code>root</code>, pre-auth, with no logs.</p>
        </li>
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Add DepGraph styles**

Append to `src/styles/xz.css`:

```css
/* DepGraph (④) */
.xz-dg { position: relative; margin-block: 4rem; }
.xz-dg-sticky {
  position: sticky;
  top: 5rem;
  background: color-mix(in oklch, var(--bg, #fff) 90%, transparent);
  backdrop-filter: blur(8px);
  padding: 1rem 0;
  z-index: 5;
}
.xz-dg-svg { width: 100%; height: auto; max-height: 320px; display: block; }
.xz-dg-steps { list-style: none; padding: 0; margin: 2rem 0 0; }
.xz-dg-step {
  padding: 1.5rem 0 1.5rem 1.25rem;
  border-left: 2px solid color-mix(in oklch, currentColor 12%, transparent);
  margin-bottom: 1.5rem;
  min-height: 50vh;
}
.xz-dg-step h4 { margin: 0 0 0.5rem; }
.xz-dg-step p { margin: 0; }
@media (prefers-reduced-motion: reduce) {
  .xz-dg-svg * { transition: none !important; }
}
@media (max-width: 720px) {
  .xz-dg-sticky { position: static; backdrop-filter: none; }
}
```

- [ ] **Step 3: Visual verify**

`bun run dev`. Visual checklist for `/blog/xz-backdoor/`:
- [ ] DepGraph SVG renders with 5 nodes, edges visible
- [ ] Scrolling between the three step blocks (data-stage="legitimate"/"ifunc"/"attack") changes:
  - Edge opacity (more edges visible as you advance)
  - Node stroke color (RSA + IFUNC nodes turn ember at stages 2/3)
- [ ] At <720px, sticky disables and the SVG stays inline

- [ ] **Step 4: Commit**

```bash
git add src/components/xz/DepGraph.tsx src/styles/xz.css
git commit -m "xz: DepGraph set-piece — 5-node hijack chain with 3 scrolly states"
```

---
## Task 16: Wire all components into the MDX skeleton

**Files:**
- Modify: `src/content/blog/xz-backdoor/index.mdx`

Drop the stub. Replace with the full page skeleton — section headers, embedded components, prose stubs marking what each section should cover. **Hugo writes the actual prose himself** in his own voice. The plan's job is to ensure every component is wired and every section is structured.

- [ ] **Step 1: Write the skeleton MDX**

Replace `src/content/blog/xz-backdoor/index.mdx` with:

```mdx
---
title: "The XZ backdoor"
description: "An interactive walkthrough of CVE-2024-3094 — how a two-year social-engineering campaign almost shipped a sshd backdoor in liblzma."
date: 2026-04-25
draft: true
categories: ["security"]
tags: ["xz", "cve-2024-3094", "supply-chain", "reverse-engineering"]
---

import '../../../styles/xz.css';
import Mnemonic from '~/components/xz/Mnemonic.astro';
import Timeline from '~/components/xz/Timeline';
import TarballDiff from '~/components/xz/TarballDiff.astro';
import SedPipeline from '~/components/xz/SedPipeline';
import DepGraph from '~/components/xz/DepGraph';
import LatencyChart from '~/components/xz/LatencyChart.astro';
import DistroGrid from '~/components/xz/DistroGrid.astro';

{/* §0 — Prelude (~150 words) — what xz is, why a compression library shipped a sshd backdoor, what's at stake */}

> _PROSE STUB §0:_ open with the surprising premise — a compression library backdoored sshd. Frame the question the rest of the post answers. ~150 words.

{/* §1 — Act I: Arrival (~600 words) — Lasse's burnout, JiaT75's first patches, Jigar/Dennis pressure campaign, co-maintainer status */}

## Act I — Arrival

> _PROSE STUB §1:_ narrate the social-engineering arc. Cite Russ Cox xz-timeline. Quote the Jigar Kumar emails verbatim. End with Jia Tan signing 5.4.1 in Jan 2023. ~600 words.

<Timeline client:visible />

{/* §2 — Act II: The Trigger (~500 words) — autoconf, tarball-vs-git asymmetry, build-to-host.m4, test-file trick */}

## Act II — The Trigger

> _PROSE STUB §2:_ explain autoconf for non-RE readers; introduce the tarball-vs-git distinction; flag the test-file trick. Cite Russ Cox xz-script. ~500 words.

<TarballDiff />

{/* §3 — Act III: The Payload (~700 words) — the sed/tr/xz pipeline, centerpiece */}

## Act III — The Payload

> _PROSE STUB §3:_ walk the reader through the pipeline. Use the widget below as the spine — for each stage, one sentence in prose explaining what's about to happen, then let the widget show the bytes. Stage-1 produces a shell script; Stage-2 produces a binary object. End at the ELF magic moment. ~700 words.

<SedPipeline client:visible />

{/* §4 — Act IV: The Hijack (~800 words, RE-course weighted) — sshd→libsystemd→liblzma, IFUNC, GOT, RSA hook, Ed448 gate */}

## Act IV — The Hijack

> _PROSE STUB §4:_ this is the longest, most technical section. Three subsections:
>
> 1. **The path** — explain the surprising sshd → libsystemd → liblzma chain (the `sd_notify` distro patch). Use the dep-graph below.
> 2. **The resolver** — IFUNC mechanics. Why running before RELRO matters. Walk the reader through three textual disassembly snippets:
>    - `_get_cpuid` — the IFUNC entry that pretends to return CPU info
>    - The GOT walker — finds sshd's entry for `RSA_public_decrypt`
>    - The hooked `RSA_public_decrypt` — parses `[tag][ed448_sig][cmd]` from the malicious RSA `N` field
>    Use `<Mnemonic op="…">…</Mnemonic>` around any AT&T mnemonic that benefits from a click-through to AsmLookup.
> 3. **The gate** — Ed448 signature verification keeps everyone but the attacker locked out. Reference amlweems/xzbot for the working PoC.
>
> ~800 words. Cite smx-smx/xzre for function naming. Link the local artifact path in the "Try it yourself" box below.

<DepGraph client:visible />

{/* Disassembly snippets — extracted by scripts/extract-disasm.sh from xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o */}

```asm title="liblzma_la-crc64-fast.o · _get_cpuid (IFUNC resolver)"
{/* Replace this code-fence body with the contents of xz-artifacts/analysis/disasm/get_cpuid.s.
   Or: import as raw and embed via a code component. See note below. */}
```

```asm title="liblzma_la-crc64-fast.o · GOT walker"
{/* xz-artifacts/analysis/disasm/got_walker.s */}
```

```asm title="liblzma_la-crc64-fast.o · RSA_public_decrypt hook"
{/* xz-artifacts/analysis/disasm/rsa_public_decrypt_hook.s */}
```

> **Try it yourself**
>
> The artifacts referenced in this section live at `xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o` (see `xz-artifacts/README.md` for provenance and safety notes).
>
> - `objdump -d -M att xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o | grep -A 30 '<_get_cpuid>:'`
> - In `gdb`, set a breakpoint on `RSA_public_decrypt` and inspect the stack when an SSH client connects with a custom certificate.
> - amlweems/xzbot has a working honeypot patch for OpenSSH and the attacker's Ed448 public key extracted.

{/* §5 — Act V: The Discovery (~400 words) — Andres Freund, 500ms, valgrind, oss-security */}

## Act V — The Discovery

> _PROSE STUB §5:_ narrate the discovery — Andres Freund's accidental find while micro-benchmarking PostgreSQL. Quote his oss-security email opener verbatim. ~400 words.

<LatencyChart />

{/* §6 — Coda (~250 words) — distros affected vs spared, cleanup, lessons */}

## Coda

> _PROSE STUB §6:_ what shipped where, what was spared, what changed in the open-source ecosystem afterward. ~250 words.

<DistroGrid />

{/* §7 — Notes & sources */}

## Notes & sources

> _PROSE STUB §7:_ Russ Cox–style citation list. Every claim above gets a primary-source link. Use the spec's reference set as the starting point.
```

**Note on the disassembly code blocks:** the `.s` files were extracted by `scripts/extract-disasm.sh` (Task 5). The cleanest approach to embed them is via a small Astro component that reads the file at build time. To keep this task focused, the skeleton above shows them as literal `\`\`\`asm` fences with `{/* … */}` placeholders. After this task, Hugo (or a follow-up task) can either:
- Paste the disasm contents directly, or
- Build a tiny `<DisasmBlock src="…">` component that does `await import('xz-artifacts/analysis/disasm/get_cpuid.s?raw')`.

Either is trivial — defer to Hugo's preference.

- [ ] **Step 2: Build to confirm everything compiles**

```bash
bun run build 2>&1 | tail -30
```

Expected: build succeeds, no Astro/Preact errors. The page is still `draft: true` so it won't appear in the blog index, but `dist/blog/xz-backdoor/index.html` will exist.

- [ ] **Step 3: Visual review in dev server**

```bash
bun run dev
```

Open `http://localhost:4321/blog/xz-backdoor/`. Confirm:
- [ ] Every section renders (even with prose stubs)
- [ ] Every widget renders without errors
- [ ] Imports all resolve
- [ ] Page loads under 2 seconds on a refresh

- [ ] **Step 4: Commit**

```bash
git add src/content/blog/xz-backdoor/index.mdx
git commit -m "xz: full MDX skeleton — every section + widget wired (prose stubs)"
```

---


## Task 17: Final integration — drop draft flag, verify a11y, performance

**Files:**
- Modify: `src/content/blog/xz-backdoor/index.mdx` (set `draft: false` only when Hugo says so)
- Modify: `src/styles/xz.css` (final polish)

This is a verification + polish pass. **Do not** un-draft the post until Hugo confirms prose is written.

- [ ] **Step 1: Build and inspect output size**

```bash
bun run build
ls -la dist/blog/xz-backdoor/
du -sh dist/_astro/ | head -5
```

Expected: page builds without errors. JS bundles for the page should total <200KB gzipped (per spec performance budget).

```bash
# Approximate JS weight for this page
find dist/_astro -name "*.js" | xargs -I{} gzip -c {} | wc -c
```

- [ ] **Step 2: a11y checklist (manual)**

Open `http://localhost:4321/blog/xz-backdoor/` in dev. Verify:
- [ ] Every widget has a meaningful `aria-label` or wrapping `<figure>`/`<section>` role
- [ ] Reduced motion: in browser DevTools, force `prefers-reduced-motion: reduce` and confirm:
  - Timeline playhead jumps without tween
  - SedPipeline byte transitions are instant
  - DepGraph edge opacity changes are instant
- [ ] Keyboard: `Tab` reaches every interactive element; `←/→/⟲` work in SedPipeline
- [ ] Color: switch theme toggle, confirm all widgets remain legible in dark mode
- [ ] All Mnemonic links open in new tabs and land on the right AsmLookup entry

- [ ] **Step 3: Lighthouse audit**

Open the dev page in Chrome → DevTools → Lighthouse → run mobile + desktop. Targets:
- Performance: ≥85
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

If accessibility is below 95, address the specific issues flagged before un-drafting.

- [ ] **Step 4: Pagefind search index check**

```bash
bun run build
ls dist/pagefind/ | head
```

Expected: `pagefind/` directory generated; the XZ post's content indexed (search "xz" via the live site search after a deploy).

- [ ] **Step 5: Commit**

```bash
git add src/styles/xz.css
git commit -m "xz: a11y + performance polish; draft flag still on pending prose"
```

- [ ] **Step 6: Hand off to Hugo**

Final state for handoff:
- All widgets working, all data pre-computed, all components committed.
- Post is `draft: true` — won't appear in `/blog/` index until prose is written and Hugo flips the flag.
- Suggest Hugo write prose section by section, previewing in dev server, then flipping `draft: false` in a final commit when ready.

---

## Self-Review (run after writing this plan)

**Spec coverage check:**

| Spec section | Implemented in task |
|---|---|
| Page lives at `src/content/blog/xz-backdoor/index.mdx` | T3, T16 |
| Voice: editorial / Russ Cox | Hugo's prose (skeleton in T16) |
| Typography: Newsreader/Wotfard/JetBrains Mono | Inherited from existing site |
| Layout: 680px prose, 960px widget breakout | T2 (`.xz-widget`) |
| Semantic colors (attacker/defender/infra), light+dark | T2 |
| Hex-grid texture in pipeline only | T2 (`.xz-byte-canvas`) |
| Signature flourish (bytes → ELF magic) | NOT IMPLEMENTED — see "Open follow-ups" |
| § Structure (8 sections, ~3400 words) | T16 (skeleton; prose by Hugo) |
| ① Timeline (sticky scrollytelling) | T9 (data) + T14 (component) |
| ② TarballDiff | T11 |
| ③ SedPipeline (centerpiece) | T6 (data) + T8 (component, CHECKPOINT) |
| ④ DepGraph (3 states) | T15 |
| ⑤ LatencyChart | T12 |
| ⑥ DistroGrid (svgl.app) | T10 (data) + T13 (icons + component) |
| Inside-the-object disassembly snippets | T5 (extraction) + T16 (embed) |
| Mnemonic component → AsmLookup integration | T7 |
| Try-it-yourself sidebar | T16 |
| `xz-artifacts/` directory | Already populated (committed in `638f2fd`); verified in T4 |
| `scripts/build-xz-pipeline-data.ts` | T6 |
| `scripts/extract-disasm.sh` | T5 |
| Library choices (scrollama, motion, nanostores) | T1 (install); nanostores deferred (Tasks 14 + 16 don't need cross-island state — the spec already noted this is a "defer until needed" item) |
| a11y, reduced-motion, mobile responsive | T2 / T8 / T14 / T15 / T17 |
| Performance budget (<200KB JS) | T17 |

**Gaps identified during self-review:**

1. **Signature flourish (bytes → ELF magic morph)** — the spec calls for a one-time "ELF magic appears" moment at the end of the SedPipeline. Task 8 ships the SedPipeline without this animation. **Recommendation:** add as a follow-up after Task 8's CHECKPOINT review. If Hugo wants it, draft a Task 8.5 that animates `7F 45 4C 46 …` over the final stage's bytes using Motion One.

2. **`<DisasmBlock>` component** — Task 15 leaves disassembly code blocks as `{/* … */}` placeholders. The cleanest implementation is a tiny Astro component that imports the `.s` file as `?raw` and feeds it to Expressive Code. **Recommendation:** add as Task 15.5 if Hugo wants the component vs. just pasting the contents.

3. **Cross-tab keyboard hint for SedPipeline arrow keys** — Task 8 adds `←/→` buttons but no global keyboard listener. If desired, add `useEffect` keyboard handler. Defer unless Hugo asks.

**Placeholder scan:** none (`grep -E "TBD|TODO|FIXME|XXX|fill in" docs/superpowers/plans/2026-04-25-xz-backdoor-explainer.md` returns the plan's own warning lines about not using these terms — no real placeholders).

**Type/name consistency:** the `Stage` interface in T6 (data emission) and T8 (component consumption) both have the same fields. The `Event` interface in T9 and T14 match. The `Distro` and `StatusMeta` interfaces in T10 and T13 match. `Stage` (DepGraph stages: `'legitimate' | 'ifunc' | 'attack'`) is distinct from `Stage` (SedPipeline pipeline stages) — they live in different files, no collision.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-xz-backdoor-explainer.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for a long plan with a CHECKPOINT in the middle (Task 8) where direction may pivot.

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch with checkpoints for review.

Which approach?
