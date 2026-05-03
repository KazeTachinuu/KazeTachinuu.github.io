# XZ Backdoor Interactive Explainer - Design

**Status:** draft for user review
**Date:** 2026-04-25
**Target page:** `src/content/blog/xz-backdoor/index.mdx`
**URL:** `https://hugosibony.com/blog/xz-backdoor/`

## Goal

A long-form interactive blog post that explains CVE-2024-3094 - the XZ Utils backdoor - clearly enough that a reverse-engineering student can rebuild a complete mental model of both the social-engineering arc and the runtime exploitation chain. The page is the **interactive version** of Thomas Roccia's "XZ Outbreak" infographic, with the citation discipline of Russ Cox's writeup and the visual restraint of Distill / Ciechanowski / Pudding.

## Audience

Reverse-engineering students. RE-literate: terms like GOT, PLT, IFUNC resolver, RELRO, AT&T syntax, dynamic linker can be used without first-principles definitions, but each is hyperlinked once on first use. Heavier interactive treatment goes to the runtime hijack (Act IV) than to the social-engineering narrative (Act I).

## Non-goals

- Not a general-audience explainer; not aimed at non-technical readers.
- Not a replacement for the primary sources (Russ Cox / Sam James / Andres Freund). The page links out aggressively rather than restating their work.
- No fancy animation for its own sake. Motion only where it teaches.
- No new framework, no new build pipeline. Stays inside the existing Astro + Preact + Tailwind v4 stack.
- No French version (deferred). Site stays English-only for now.

## Reference set

The page is composed from these five existing works. Every design choice traces back to one of them.

| # | Reference | What we steal |
|---|---|---|
| 1 | [Roccia "XZ Outbreak" infographic](https://infosec.exchange/@fr0gger/112189232773640259) | Structural spine: title → 2y activity arc → m4 trigger → Stage 1 Bash → Stage 2 Bash → extracted .o → liblzma + IFUNC + RSA hook |
| 2 | [Distill - Why Momentum Really Works](https://distill.pub/2017/momentum/) | Typography (serif body + display italic), single restrained accent, hover-coupled cross-references between prose and viz |
| 3 | [Ciechanowski - Internal Combustion Engine](https://ciechanow.ski/internal-combustion-engine/) | One persistent diagram reused across sections, semantic color per role, generous whitespace, calm narrator voice |
| 4 | [Pudding - Pockets](https://pudding.cool/2018/08/pockets/) | Clean two-tone SVG illustrations as paragraph punctuation |
| 5 | [Russ Cox - XZ Timeline](https://research.swtch.com/xz-timeline) | Citation discipline - every claim hyperlinked to a primary source |

## Voice and aesthetic

- **Voice:** Russ Cox. Calm, evidence-first, every claim hyperlinked. No drama, no second-person hype.
- **Typography:** unchanged from existing site stack - Newsreader italic for display headings, Wotfard for body, JetBrains Mono for code.
- **Layout:** 680px prose column (existing reading width); widgets break out to ~960px when needed.
- **Semantic color, single accent per role:**
  - **attacker / payload** → muted ember (JiaT75, malicious commits, encrypted bytes)
  - **defender / discovery** → cool slate (Lasse Collin, Andres Freund, clean code)
  - **infrastructure** → neutral grey (autoconf, sshd, libsystemd, distro nodes)
  - All three roles tuned for both light and dark mode at AAA contrast.
- **Atmosphere:** prose is plain. A subtle hex-grid texture appears *only* inside the sed-pipeline widget viewport, signaling "we are in byte territory."
- **Distinctive flourish (the page's signature moment):** when the final stage of the sed pipeline resolves, the rendered bytes morph into the ELF magic sequence `7F 45 4C 46`, then into the file icon for `liblzma_la-crc64-fast.o`. One satisfying transition, no encore.

## Page structure

Eight sections. Word counts are targets, not promises.

| § | Section | ~words | Widget |
|---|---|---|---|
| 0 | **Prelude** - what xz is, why a compression library shipped a sshd backdoor, what's at stake | 150 | none |
| 1 | **Act I - Arrival** - Lasse's burnout, JiaT75's first patches (Oct 2021), Jigar/Dennis pressure campaign, co-maintainer status (Jun 2022 → Jan 2023) | 600 | **① Sticky scrollytelling timeline** (set piece) |
| 2 | **Act II - The Trigger** - what autoconf is, the tarball-vs-git asymmetry, the modified `build-to-host.m4`, the test-file trick | 500 | **② Tarball vs git diff** (small inline) |
| 3 | **Act III - The Payload** - the sed/tr/xz pipeline | 700 | **③ Stacked transforms widget** (set piece, the centerpiece) |
| 4 | **Act IV - The Hijack** - `sshd → libsystemd → liblzma`, IFUNC resolvers, GOT patch on `RSA_public_decrypt`, Ed448 gate (longest section, RE-course weighted) | 800 | **④ Persistent dep-graph** (set piece, reused 3×) + **Try it yourself** sidebar |
| 5 | **Act V - The Discovery** - Andres Freund, 500 ms latency, valgrind, oss-security 2024-03-29 08:51 UTC | 400 | **⑤ Latency chart** (small inline) |
| 6 | **Coda** - distros affected vs spared, cleanup, what we learned | 250 | **⑥ Distro grid** (small inline, svgl.app icons) |
| 7 | **Notes & sources** - citation list, every claim linked | - | none |

**Totals:** ~3400 words, ~18-min read. Three set-piece interactives + three small inline widgets.

## Set-piece interactives

### ① Sticky scrollytelling timeline (§1)

- **Pattern:** Pudding sticky-vis - the timeline pins on one side of the viewport while the prose column scrolls.
- **Visual:** horizontal timeline arc from Oct 2021 → Mar 2024, dates as ticks, color-coded by event type (legitimate / preparatory / malicious / discovery). A playhead advances as the reader scrolls.
- **State machine:** scrollama drives an `activeStep: 0..N` index. Each prose section maps to a step; entering a step tweens the playhead and highlights the relevant tick(s) on the timeline.
- **Interactivity:** hover any tick to surface the underlying email or commit (with link to mail-archive.com / commit URL). Clicking a tick scrolls the page to the relevant prose section.
- **Animation:** Motion One tween, 300ms ease-out, on `activeStep` change. Reduced-motion users get instant transitions.

### ③ Stacked transforms widget (§3, the centerpiece)

- **Pattern:** CyberChef + Godbolt + Distill hover-coupling.
- **Visual:** vertical stack of stages, each rendered as a `<pre>` block of bytes. The current stage's input and output are visible simultaneously. Bytes carry color from input to output, so the reader can see which input bytes produced which output bytes.
- **Stages (precomputed at build time, not run live):**
  1. Raw bytes of `tests/files/bad-3-corrupt_lzma2.xz`
  2. After `tr "\t \-_" " \t_\-"` → "uncorrupted" xz stream
  3. After `xz -d` → Stage 1 Bash script
  4. Stage 1 invokes the more elaborate pipeline on `good-large_compressed.lzma`
  5. After `head -c` chunking + `tail -c +31265` skip
  6. After `tr "\5-\$\0-\7" "\$\0-\5\6-\7"` substitution
  7. After `xz -F raw --lzma1 -dc` → Stage 2 Bash script
  8. Stage 2 produces `liblzma_la-crc64-fast.o`
- **Interactivity:**
  - "Step" button or arrow keys advance one stage at a time.
  - Hover any token in the script (e.g., `head -c +1024`) to highlight the byte range it operates on (Distill pattern).
  - Click a stage to expand its full output in a modal.
- **Signature flourish:** at stage 8, the bytes animate into ELF magic `7F 45 4C 46 ...`, then into the icon for `liblzma_la-crc64-fast.o`.
- **Data:** pre-baked as `src/data/xz-pipeline.json` - array of stage descriptors with `{stdin, stdout, sourceMap, scriptTokens}`. No runtime sed; deterministic.

### ④ Persistent dep-graph (§4, reused 3×)

- **Pattern:** Ciechanowski persistent diagram.
- **Visual:** SVG of five nodes - `sshd`, `libsystemd.so.0`, `liblzma.so.5`, `RSA_public_decrypt` (in libcrypto), `IFUNC resolver` (the malicious `_get_cpuid`). Edges labeled with the symbol or function being called.
- **Three states (same diagram, different highlights):**
  1. **Legitimate** - show the surprising path `sshd → libsystemd` (note: this is a distro patch for `sd_notify`, not upstream OpenSSH). `libsystemd → liblzma` is the natural edge.
  2. **IFUNC fires** - animate the dynamic linker calling `_get_cpuid` as the CRC64 resolver; the resolver walks `_r_debug` to find sshd's GOT; the GOT entry for `RSA_public_decrypt` flips to point at the malicious stub.
  3. **Attack key arrives** - a remote SSH client connects with a crafted RSA `N` field; the malicious `RSA_public_decrypt` parses it as `[tag][ed448_sig][cmd]`, verifies the signature against the embedded pubkey, and on success calls `system(cmd)` as root pre-auth.
- **State driver:** scrollama, three steps inside the same sticky container. Same SVG instance, only the highlight overlay and the animated edges change. Reader's spatial memory carries the load.

### "Inside the object" disassembly snippets (§4 subsection)

Three short textual disassembly snippets embedded in §4 prose, each preceded by a one-sentence prose pointer. **No tool screenshots** - disassembly renders as code blocks via Expressive Code with the existing josh-dark/light themes, matching the rest of the site.

1. **`_get_cpuid` (the IFUNC resolver entry)** - shows the resolver doesn't actually return CPU info
2. **The GOT walker** - code that locates sshd's entry for `RSA_public_decrypt`
3. **The hooked `RSA_public_decrypt`** - parses `[tag][ed448_sig][cmd]` from the malicious RSA `N` field

**AsmLookup integration:** a small MDX component `<Mnemonic op="cmovne">cmovne</Mnemonic>` wraps each AT&T mnemonic. Clicking it opens `/tools/asm-lookup/?op=cmovne` in a new tab. This is the page's structural cross-link to the existing site tool - a Distill-style hover-coupled cross-reference, but cross-page.

**Source:** snippets extracted from `xz-artifacts/extracted/xz-5.6.1/.../liblzma_la-crc64-fast.o` via `scripts/extract-disasm.sh`. Function names follow `smx-smx/xzre`'s reverse-engineering (attributed in §7 sources). Deterministic; re-runnable.

**Try it yourself sidebar (RE-course):** points students at the same local `.o` file. Hints: offsets of the three named functions, suggested `gdb`/`r2` commands, breakpoint to set on `RSA_public_decrypt`.

## Small inline widgets

### ② Tarball vs git diff (§2)

Two file-tree columns side by side: `git/m4/` vs `tarball/m4/`. The diff highlights `build-to-host.m4` (present in tarball, absent in git for the malicious version). Hover the file to expand the diff inline. Static SVG, no scrollama.

### ⑤ Latency chart (§5)

Small chart of sshd connection latency: clean ~0.3s baseline, then the 5.6.0/5.6.1 spike to ~0.8s. Annotated with Andres Freund's quote from oss-security. Static SVG. Embedded next to a screenshot of the email header.

### ⑥ Distro grid (§6)

Grid of distro logos (svgl.app SVGs: Debian, Fedora, Arch, openSUSE, Kali, Ubuntu, RHEL, Alpine), color-coded red/yellow/green:
- **red** - shipped & exploitable (Debian sid, Fedora 40 Beta, openSUSE Tumbleweed, Kali rolling)
- **yellow** - shipped but non-exploitable (Arch, Alpine edge)
- **green** - never shipped (Debian stable, Ubuntu LTS, RHEL, Amazon Linux)

Each tile shows version + status on hover.

## Local artifacts (`xz-artifacts/`)

Gitignored. Used (a) by the build step that pre-computes pipeline stage JSON, (b) as a "Try it yourself" target for RE-course readers.

```
xz-artifacts/
├── README.md                              # what's here, safety notes, provenance
├── tarballs/
│   ├── xz-5.6.0.tar.gz  + .sig            # from thesamesam/xz-archive
│   └── xz-5.6.1.tar.gz  + .sig
├── extracted/xz-5.6.1/                    # tar -xzf result
│   ├── m4/build-to-host.m4                # the injector (tarball-only)
│   └── tests/files/
│       ├── bad-3-corrupt_lzma2.xz
│       └── good-large_compressed.lzma
├── stages/                                # pre-computed pipeline outputs
│   ├── 01-stage1.sh
│   ├── 02-stage2.sh
│   └── 03-liblzma_la-crc64-fast.o
└── analysis/
    ├── xzre/                              # smx-smx/xzre clone
    ├── xzbot/                             # amlweems/xzbot clone (ED448 key, honeypot)
    └── disasm/                            # objdump output for §4 code blocks
        ├── get_cpuid.s                    # IFUNC resolver entry
        ├── got_walker.s                   # finds sshd's RSA_public_decrypt GOT entry
        └── rsa_public_decrypt_hook.s      # malicious RSA_public_decrypt parser
```

**Safety:** all artifacts are inert on Hugo's macOS - backdoor activation is gated to x86_64 Linux + gcc + GNU ld + `DEB_BUILD_OPTIONS`/`RPM_ARCH` env vars.

**Verified hashes:**
- `bad-3-corrupt_lzma2.xz` = `ecda10d8877d555dbda4a4eba329e146b2be8ac4b7915fb723eaacc9f89d16bd` (locally verified 2026-04-25)
- `good-large_compressed.lzma` = `9aef898229de60f94cdea42f19268e6e3047f7136f2ff97510390a2deeda7032` (locally verified)
- `m4/build-to-host.m4` = `054003928e240de8b9f3232e1bb885a5b6cc09488742159a0e3d6080e16499f4` (locally verified)
- `liblzma_la-crc64-fast.o` (from `smx-smx/xzre`) = `b418bfd34aa246b2e7b5cb5d263a640e5d080810f767370c4d2c24662a274963` (locally verified)
- `liblzma_la-crc64-fast.o` (Binarly's, from a real distro `.deb`) = `cbeef92e67bf41ca9c015557d81f39adaba67ca9fb3574139754999030b83537` - **does not match** the xzre version, but contains the same backdoor structurally; see `xz-artifacts/README.md` for the discrepancy note.

## File structure to add

```
src/
├── content/blog/xz-backdoor/
│   └── index.mdx                          # the prose, with <Timeline/>, <SedPipeline/>, etc. embedded
├── components/xz/                         # one folder for the page's islands
│   ├── Timeline.tsx                       # ① set piece
│   ├── SedPipeline.tsx                    # ③ set piece
│   ├── DepGraph.tsx                       # ④ set piece
│   ├── TarballDiff.tsx                    # ② inline
│   ├── LatencyChart.tsx                   # ⑤ inline
│   ├── DistroGrid.tsx                     # ⑥ inline
│   └── shared/
│       ├── stores.ts                      # nanostores for cross-widget state (if needed)
│       └── icons.ts                       # svgl.app icon resolver
├── data/
│   ├── xz-pipeline.json                   # pre-computed stage data for ③
│   ├── xz-timeline.json                   # dated events + email quotes for ①
│   └── xz-distros.json                    # distro status grid for ⑥
└── styles/
    └── xz.css                             # page-scoped overrides only
xz-artifacts/                              # gitignored
scripts/
├── build-xz-pipeline-data.ts              # consumes xz-artifacts/, emits src/data/xz-pipeline.json
└── extract-disasm.sh                      # objdump -d on liblzma_la-crc64-fast.o, slices named regions into .s files
```

The MDX page imports the `.s` files as raw strings and renders them via Expressive Code. The `<Mnemonic>` component is a tiny Preact island (or a static MDX shortcode) that wraps an AT&T mnemonic in an `<a href="/tools/asm-lookup/?op=…">`.

## Library choices

- **`scrollama`** (~2KB) - IntersectionObserver-based scroll-step orchestration. One parent island wraps each sticky section; uses `useEffect` to wire up.
- **`motion`** (Motion One, ~5KB, framework-agnostic) - tween animations. Not Framer Motion (React-only, heavyweight).
- **`@nanostores/preact`** (~1KB) - only if cross-widget state is needed (likely just for "current attack stage" shared between Timeline and DepGraph; defer until the second widget is built).
- **svgl.app** - fetched at build time via a small script in `scripts/`, written into `src/data/icons/`. Never client-side fetch.
- **No GSAP, no Framer Motion, no D3.** Hand-rolled SVG for all four diagrams (4–10 nodes each - d3 is overkill).
- **No View Transitions API** - wrong tool, that's for page-to-page morphing.

## Accessibility

- Reduced-motion: all widgets check `prefers-reduced-motion` and switch to instant state changes.
- Keyboard navigation: SedPipeline supports arrow-key stepping; Timeline ticks are focusable buttons.
- Screen readers: every widget has a prose fallback in the surrounding MDX. Widgets are `aria-hidden="true"` and the prose carries the meaning.
- Color: never use color alone to convey state (always pair with shape, label, or position).

## Performance budget

- Page weight target: **< 200KB JS** total (gzipped), excluding fonts (already loaded by site).
- Pre-computed JSON budget: **< 80KB gzipped** total across the three data files.
- Above-the-fold render: prose + first widget should paint within 1s on cable.
- All widgets `client:visible`, never `client:load` - they hydrate as the reader scrolls into them.

## Out of scope (explicit)

- French translation - deferred.
- Audio narration - no.
- A "live" sed pipeline that actually runs in the browser - no, pre-computed only.
- Comments / discussion - no.
- A live PoC against a vulnerable sshd - no, link out to amlweems/xzbot instead.
- A new content collection - reuses existing `blog` collection.
- Any change to the article shell, theme, or navigation - no.

## Open risks

1. **Width of the timeline widget on mobile** - sticky-side scrollytelling typically degrades to a vertical stack on narrow viewports. Need a responsive plan: below 768px, the Timeline stops being sticky and the dates inline with prose.
2. **Pipeline data realism vs. determinism** - pre-computing every stage means we trust our re-implementation of `tr` / `xz -d` / etc. Mitigation: generate the JSON via a Node script that shells out to real `xz` / `tr` against the local artifacts, so the displayed bytes are the actual bytes.
3. **`liblzma_la-crc64-fast.o` provenance** - must come from `smx-smx/xzre` (extracted from a real 5.6.1 build), not regenerated. Verify hash matches Binarly's.
4. **Render performance of ~30KB byte grids** - at the longest stages, the byte view is several hundred lines. Use virtualised rendering (only paint visible lines) if profiling shows jank.

## Sources

Same set as the prose will use, listed here for reference during implementation:

- [Andres Freund's oss-security disclosure](https://www.openwall.com/lists/oss-security/2024/03/29/4) - primary source for the sed pipeline + discovery
- [Russ Cox - Timeline of the xz open source attack](https://research.swtch.com/xz-timeline) - primary source for dated events and email quotes
- [Russ Cox - The xz attack shell script](https://research.swtch.com/xz-script) - primary source for build-to-host.m4 mechanics
- [Sam James gist (canonical FAQ)](https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27)
- [Thomas Roccia "XZ Outbreak" infographic](https://infosec.exchange/@fr0gger/112189232773640259) - structural reference
- [Gynvael Coldwind deep-dive](https://gynvael.coldwind.pl/?id=782)
- [smx-smx/xzre](https://github.com/smx-smx/xzre) - RE artifacts, source of `liblzma_la-crc64-fast.o`
- [amlweems/xzbot](https://github.com/amlweems/xzbot) - ED448 key, honeypot
- [Binarly analysis](https://github.com/binarly-io/binary-risk-intelligence/tree/master/xz-backdoor) - hashes
- [thesamesam/xz-archive](https://github.com/thesamesam/xz-archive) - tarball mirror
- [LWN - A backdoor in xz](https://lwn.net/Articles/967180/)
- [Wired profile of Andres Freund](https://www.wired.com/story/jia-tan-xz-backdoor/) - for one well-chosen pull-quote, not the page's voice
- [tukaani.org/xz-backdoor](https://tukaani.org/xz-backdoor/) - Lasse Collin's official statement
