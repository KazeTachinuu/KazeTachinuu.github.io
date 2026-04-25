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
