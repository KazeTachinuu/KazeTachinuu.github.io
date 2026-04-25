import { useState } from 'preact/hooks';
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

/* Phase boundaries — stages 1-3 are Phase 1, 4-8 are Phase 2, 9 is the Result. */
const PHASES = [
  { idx: 0, title: 'Phase 1', subtitle: 'starting from bad-3-corrupt_lzma2.xz', range: [0, 3] as [number, number] },
  { idx: 1, title: 'Phase 2', subtitle: 'triggered by Stage-1; operates on good-large_compressed.lzma', range: [3, 8] as [number, number] },
  { idx: 2, title: 'Result',  subtitle: 'the malicious object that gets linked into liblzma.so.5', range: [8, 9] as [number, number] },
];

const fmt = (n: number) => n.toLocaleString();

/* Render hex as offset-prefixed rows of 16 bytes each, with optional
   highlighting for "notable" byte ranges that the data file flags. */
function HexView({ hex, notable, maxRows = 8 }: { hex: string; notable?: Notable[]; maxRows?: number }) {
  const bytes: string[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(hex.slice(i, i + 2));

  function isNotable(byteIdx: number): Notable | null {
    if (!notable) return null;
    for (const n of notable) {
      const len = n.bytes.length / 2;
      if (byteIdx >= n.offset && byteIdx < n.offset + len) return n;
    }
    return null;
  }

  const rows: { offset: number; cells: string[] }[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    rows.push({ offset: i, cells: bytes.slice(i, i + 16) });
  }
  const visible = rows.slice(0, maxRows);
  const hidden = rows.length - visible.length;

  return (
    <div class="xz-hex-wrap">
      <pre class="xz-hex">
        {visible.map((row) => (
          <div class="xz-hex-row" key={row.offset}>
            <span class="xz-hex-offset">{row.offset.toString(16).padStart(4, '0')}</span>
            <span class="xz-hex-bytes">
              {row.cells.map((b, i) => {
                const n = isNotable(row.offset + i);
                return (
                  <span
                    class={n ? 'xz-hex-byte xz-hex-notable' : 'xz-hex-byte'}
                    title={n?.meaning}
                    key={i}
                  >{b}</span>
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
      {hidden > 0 && (
        <p class="xz-hex-more">… {hidden} more rows hidden ({fmt(hidden * 16)} bytes)</p>
      )}
    </div>
  );
}

/* Side-by-side first-16-byte comparison: shows what `tr` actually changes.
   Bytes that differ between previous and current are highlighted. */
function ByteDiff({ prevHex, currHex }: { prevHex: string; currHex: string }) {
  const N = 32; // 16 bytes = 32 hex chars
  const prev: string[] = [];
  const curr: string[] = [];
  for (let i = 0; i < N; i += 2) {
    prev.push(prevHex.slice(i, i + 2));
    curr.push(currHex.slice(i, i + 2));
  }
  const changed = prev.map((p, i) => p !== curr[i]);
  return (
    <div class="xz-bytediff">
      <div class="xz-bytediff-row">
        <span class="xz-bytediff-label">before</span>
        <span class="xz-bytediff-bytes">
          {prev.map((b, i) => (
            <span class={changed[i] ? 'xz-byte changed-from' : 'xz-byte'} key={i}>{b}</span>
          ))}
        </span>
      </div>
      <div class="xz-bytediff-row">
        <span class="xz-bytediff-label">after</span>
        <span class="xz-bytediff-bytes">
          {curr.map((b, i) => (
            <span class={changed[i] ? 'xz-byte changed-to' : 'xz-byte'} key={i}>{b}</span>
          ))}
        </span>
      </div>
      <p class="xz-bytediff-caption">
        {changed.filter(Boolean).length} of the first 16 bytes changed.
      </p>
    </div>
  );
}

function ShellView({ text, defaultLines = 14 }: { text: string; defaultLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n');
  const truncated = lines.length > defaultLines;
  const shown = expanded || !truncated ? text : lines.slice(0, defaultLines).join('\n');
  return (
    <div class="xz-shell-wrap">
      <pre class="xz-shell"><code>{shown}</code></pre>
      {truncated && (
        <button
          type="button"
          class="xz-shell-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? `Collapse — show first ${defaultLines} lines` : `Show full — ${lines.length - defaultLines} more lines`}
        </button>
      )}
    </div>
  );
}

function ElfView({ header, hex, notable }: { header: ElfHeader; hex: string; notable?: Notable[] }) {
  return (
    <div class="xz-elf">
      <table class="xz-elf-table">
        <tbody>
          <tr><th>Magic</th><td><code>{header.magic}</code></td></tr>
          <tr><th>Class</th><td>{header.class}</td></tr>
          <tr><th>Endian</th><td>{header.endian}</td></tr>
          <tr><th>Type</th><td>{header.type}</td></tr>
          <tr><th>Machine</th><td>{header.machine}</td></tr>
          <tr><th>Sections</th><td>{header.sectionCount}</td></tr>
          <tr><th>Total size</th><td>{fmt(header.totalBytes)} bytes</td></tr>
        </tbody>
      </table>
      <p class="xz-elf-caption">First {Math.min(256, hex.length / 2)} bytes of the file (the ELF header + start of section table):</p>
      <HexView hex={hex} notable={notable} maxRows={8} />
    </div>
  );
}

function StageCard({ stage, prev, isResult }: { stage: Stage; prev: Stage | null; isResult: boolean }) {
  const truncated =
    (stage.kind === 'binary' || stage.kind === 'elf')
    && (stage.outputHex?.length ?? 0) / 2 < stage.outputSize;
  const showDiff = stage.kind === 'binary' && prev?.outputHex && stage.outputHex && stage.id !== 's1-input';

  return (
    <article class={`xz-stage xz-stage-${stage.kind}${isResult ? ' xz-stage-result' : ''}`}>
      <header class="xz-stage-head">
        <div class="xz-stage-title-row">
          <span class="xz-stage-kind" data-kind={stage.kind}>
            {stage.kind === 'shell' ? 'shell script' : stage.kind === 'elf' ? 'ELF object' : 'binary'}
          </span>
          <h4 class="xz-stage-title">{stage.label}</h4>
        </div>
        <span class="xz-stage-size">
          {fmt(stage.outputSize)} bytes
          {truncated && <em> · first {fmt((stage.outputHex!.length / 2))} shown</em>}
        </span>
      </header>

      <p class="xz-stage-desc">{stage.description}</p>

      {stage.command && stage.id !== 's1-input' && stage.kind !== 'elf' && (
        <div class="xz-stage-cmd">
          <span class="xz-stage-cmd-prompt">$</span>
          <code>{stage.command}</code>
        </div>
      )}

      {showDiff && (
        <ByteDiff prevHex={prev!.outputHex!} currHex={stage.outputHex!} />
      )}

      {stage.kind === 'shell' && stage.outputText && <ShellView text={stage.outputText} />}
      {stage.kind === 'binary' && stage.outputHex && !showDiff && <HexView hex={stage.outputHex} notable={stage.notable} maxRows={6} />}
      {stage.kind === 'binary' && showDiff && <HexView hex={stage.outputHex!} notable={stage.notable} maxRows={4} />}
      {stage.kind === 'elf' && stage.elfHeader && stage.outputHex && (
        <ElfView header={stage.elfHeader} hex={stage.outputHex} notable={stage.notable} />
      )}

      {stage.notable && stage.kind !== 'elf' && (
        <ul class="xz-stage-notes">
          {stage.notable.map((n, i) => (
            <li key={i}>
              <code>0x{n.offset.toString(16).padStart(4, '0')}</code> · <strong>{n.bytes}</strong> — {n.meaning}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PhaseDivider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div class="xz-phase">
      <div class="xz-phase-rule" aria-hidden="true"></div>
      <div class="xz-phase-text">
        <h3 class="xz-phase-title">{title}</h3>
        <p class="xz-phase-sub">{subtitle}</p>
      </div>
      <div class="xz-phase-rule" aria-hidden="true"></div>
    </div>
  );
}

export default function SedPipeline() {
  return (
    <section class="xz-widget xz-sedpipe" aria-label="The XZ build-time payload pipeline">
      {PHASES.map((phase) => {
        const phaseStages = STAGES.slice(phase.range[0], phase.range[1]);
        return (
          <div class="xz-phase-block" key={phase.idx}>
            <PhaseDivider title={phase.title} subtitle={phase.subtitle} />
            <div class="xz-stage-stack">
              {phaseStages.map((stage, i) => {
                const globalIdx = phase.range[0] + i;
                const prev = globalIdx > 0 ? STAGES[globalIdx - 1] : null;
                return (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    prev={prev}
                    isResult={phase.idx === 2}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
