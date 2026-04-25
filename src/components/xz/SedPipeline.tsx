import { useEffect, useState, useMemo } from 'preact/hooks';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import joshDark from '../../../themes/josh-dark.js';
import joshLight from '../../../themes/josh-light.js';
import data from '../../data/xz-pipeline.json';

interface ElfHeader {
  magic: string;
  class: string;
  endian: string;
  type: string;
  machine: string;
  sectionCount: number;
  totalBytes: number;
}

interface Notable { offset: number; bytes: string; meaning: string }

interface Stage {
  id: string;
  label: string;
  description: string;
  command: string;
  kind: 'binary' | 'shell' | 'elf';
  outputSize: number;
  outputText?: string;
  outputHex?: string;
  elfHeader?: ElfHeader;
  notable?: Notable[];
}

const STAGES: Stage[] = data.stages as Stage[];

/* The narrative beats. Three reveals, period.
   The pipeline string for each is the verbatim chain of commands the dropper runs. */
const PANELS = [
  {
    id: 'p1',
    title: 'Phase 1 — Stage-1 dropper',
    inputFile: 'tests/files/bad-3-corrupt_lzma2.xz',
    inputSize: STAGES[0].outputSize,
    pipeline: 'tr "\\t \\-_" " \\t_\\-" | xz -d',
    revealStageId: 's3-xz',
  },
  {
    id: 'p2',
    title: 'Phase 2 — Stage-2 dropper',
    inputFile: 'tests/files/good-large_compressed.lzma',
    inputSize: STAGES[3].outputSize,
    pipeline: 'xz -dc | (head -c +1024 >/dev/null && head -c +2048) ×16 && head -c +939 | tail -c +31233 | tr "\\114-\\321..." "\\0-\\377" | xz -F raw --lzma1 -dc',
    revealStageId: 's8-final-shell',
  },
  {
    id: 'p3',
    title: 'Result — the backdoor',
    inputFile: null,
    inputSize: null,
    pipeline: null,
    revealStageId: 's9-elf',
  },
];

const fmt = (n: number) => n.toLocaleString();
const fmtKb = (n: number) => n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;

/* ────────────────────────────────────────────────────────────
   Theme-aware Shiki highlighter (mirrors src/components/AsmLookup.tsx)
   ──────────────────────────────────────────────────────────── */
function useHighlighter() {
  const [hl, setHl] = useState<HighlighterCore | null>(null);
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    createHighlighterCore({
      themes: [joshDark as any, joshLight as any],
      langs: [import('shiki/langs/bash.mjs')],
      engine: createJavaScriptRegexEngine(),
    }).then(setHl);

    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return { hl, dark };
}

interface Token { content: string; color?: string }

function HighlightedShell({ text, hl, dark }: { text: string; hl: HighlighterCore | null; dark: boolean }) {
  const tokens = useMemo<Token[][] | null>(() => {
    if (!hl) return null;
    try {
      const r = hl.codeToTokens(text, { lang: 'bash', theme: dark ? 'josh-dark' : 'josh-light' });
      return r.tokens as Token[][];
    } catch {
      return null;
    }
  }, [hl, dark, text]);

  if (!tokens) {
    return <pre class="xz-code"><code>{text}</code></pre>;
  }
  return (
    <pre class="xz-code">
      <code>
        {tokens.map((line, i) => (
          <span class="line" key={i}>
            {line.map((t, j) => (
              <span key={j} style={t.color ? { color: t.color } : undefined}>{t.content}</span>
            ))}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

function ShellPanel({ stage, hl, dark }: { stage: Stage; hl: HighlighterCore | null; dark: boolean }) {
  return <HighlightedShell text={stage.outputText ?? ''} hl={hl} dark={dark} />;
}

function ElfPanel({ stage }: { stage: Stage }) {
  if (!stage.elfHeader || !stage.outputHex) return null;
  const h = stage.elfHeader;
  const bytes: string[] = [];
  for (let i = 0; i < stage.outputHex.length; i += 2) bytes.push(stage.outputHex.slice(i, i + 2));
  const rows: { offset: number; cells: string[] }[] = [];
  for (let i = 0; i < bytes.length; i += 16) rows.push({ offset: i, cells: bytes.slice(i, i + 16) });

  function notableAt(idx: number): Notable | null {
    if (!stage.notable) return null;
    for (const n of stage.notable) {
      const len = n.bytes.length / 2;
      if (idx >= n.offset && idx < n.offset + len) return n;
    }
    return null;
  }

  return (
    <div class="xz-elf">
      <dl class="xz-elf-meta">
        <div><dt>Magic</dt><dd><code>{h.magic}</code></dd></div>
        <div><dt>Class</dt><dd>{h.class}</dd></div>
        <div><dt>Type</dt><dd>{h.type}</dd></div>
        <div><dt>Machine</dt><dd>{h.machine}</dd></div>
        <div><dt>Sections</dt><dd>{h.sectionCount}</dd></div>
        <div><dt>Size</dt><dd>{fmt(h.totalBytes)} bytes</dd></div>
      </dl>
      <p class="xz-elf-caption">First {Math.min(256, stage.outputHex.length / 2)} bytes — the ELF header, then start of the section table:</p>
      <pre class="xz-hex">
        {rows.slice(0, 8).map((row) => (
          <div class="xz-hex-row" key={row.offset}>
            <span class="xz-hex-offset">{row.offset.toString(16).padStart(4, '0')}</span>
            <span class="xz-hex-bytes">
              {row.cells.map((b, i) => {
                const n = notableAt(row.offset + i);
                return (
                  <span class={n ? 'xz-hex-byte xz-hex-notable' : 'xz-hex-byte'} title={n?.meaning} key={i}>{b}</span>
                );
              })}
            </span>
            <span class="xz-hex-ascii">
              {row.cells.map((b) => {
                const v = parseInt(b, 16);
                return v >= 0x20 && v <= 0x7e ? String.fromCharCode(v) : '·';
              }).join('')}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Panel({
  panel, stage, hl, dark,
}: {
  panel: typeof PANELS[number];
  stage: Stage;
  hl: HighlighterCore | null;
  dark: boolean;
}) {
  const isResult = panel.id === 'p3';
  const lines = stage.outputText?.split('\n').length ?? 0;

  return (
    <article class={`xz-panel${isResult ? ' xz-panel-result' : ''}`}>
      <header class="xz-panel-head">
        <h3 class="xz-panel-title">{panel.title}</h3>
        {!isResult && (
          <p class="xz-panel-source">
            from <code>{panel.inputFile}</code> ({fmtKb(panel.inputSize!)}) — produces {fmtKb(stage.outputSize)} of {stage.kind === 'shell' ? 'shell script' : 'binary'} {stage.kind === 'shell' ? `(${lines} lines)` : ''}
          </p>
        )}
        {isResult && (
          <p class="xz-panel-source">
            extracted by the Stage-2 dropper, then linked into <code>liblzma.so.5</code> at build time
          </p>
        )}
      </header>

      {panel.pipeline && (
        <div class="xz-panel-pipe">
          <span class="xz-panel-pipe-label">decoded by</span>
          <code class="xz-panel-pipe-cmd">{panel.pipeline}</code>
        </div>
      )}

      <div class="xz-panel-body">
        {stage.kind === 'shell' && <ShellPanel stage={stage} hl={hl} dark={dark} />}
        {stage.kind === 'elf' && <ElfPanel stage={stage} />}
      </div>
    </article>
  );
}

export default function SedPipeline() {
  const { hl, dark } = useHighlighter();

  return (
    <section class="xz-widget xz-sedpipe" aria-label="The XZ build-time payload pipeline">
      {PANELS.map((panel) => {
        const stage = STAGES.find((s) => s.id === panel.revealStageId);
        if (!stage) return null;
        return <Panel key={panel.id} panel={panel} stage={stage} hl={hl} dark={dark} />;
      })}
    </section>
  );
}
