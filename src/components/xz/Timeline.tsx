import { useEffect, useRef, useState } from "preact/hooks";
import scrollama from "scrollama";
import data from "../../data/xz-timeline.json";

interface Event {
  date: string;
  actor: string;
  kind: "context" | "discovery" | "malicious" | "preparatory" | "pressure";
  title: string;
  summary: string;
  quote: string | null;
  source: string;
}
const EVENTS: Event[] = data.events as Event[];

const KIND_COLOR: Record<Event["kind"], string> = {
  context: "var(--xz-infra)",
  preparatory: "var(--xz-infra)",
  pressure: "var(--xz-attacker)",
  malicious: "var(--xz-attacker)",
  discovery: "var(--xz-defender)",
};

function dayOf(date: string): number {
  return Math.floor(new Date(date).getTime() / 86_400_000);
}
const FIRST = dayOf(EVENTS[0].date);
const LAST = dayOf(EVENTS[EVENTS.length - 1].date);
const SPAN = LAST - FIRST || 1;

function xPercent(date: string): number {
  return ((dayOf(date) - FIRST) / SPAN) * 100;
}

/* Year ticks rendered along the arc — only those within the event range. */
const YEAR_TICKS = (() => {
  const firstYear = new Date(EVENTS[0].date).getUTCFullYear();
  const lastYear = new Date(EVENTS[EVENTS.length - 1].date).getUTCFullYear();
  const years: { year: number; x: number }[] = [];
  for (let y = firstYear; y <= lastYear; y++) {
    const jan1 = `${y}-01-01`;
    const x = xPercent(jan1);
    if (x >= 0 && x <= 100) years.push({ year: y, x });
  }
  return years;
})();

/* Phase bands — narrative arcs the spec calls out. Each spans a date range
   and gets a faint colored rect behind the arc. */
const PHASES: {
  label: string;
  from: string;
  to: string;
  kind: Event["kind"];
}[] = [
  {
    label: "infiltration",
    from: EVENTS[0].date,
    to: "2023-12-31",
    kind: "preparatory",
  },
  {
    label: "release",
    from: "2024-01-01",
    to: "2024-03-28",
    kind: "malicious",
  },
  {
    label: "discovery",
    from: "2024-03-29",
    to: EVENTS[EVENTS.length - 1].date,
    kind: "discovery",
  },
];

export default function Timeline() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: ".xz-tl-step", offset: 0.55 })
      .onStepEnter((res: { element: Element }) => {
        const idx = Number((res.element as HTMLElement).dataset.idx ?? 0);
        setActive(idx);
      });
    function onResize() {
      scroller.resize();
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      scroller.destroy();
    };
  }, []);

  const currentEvent = EVENTS[active];
  const playX = xPercent(currentEvent.date);

  return (
    <section
      class="xz-widget xz-tl"
      ref={rootRef}
      aria-label="Timeline of the XZ backdoor attack"
    >
      <div class="xz-tl-sticky">
        <svg
          viewBox="0 0 100 56"
          class="xz-tl-svg"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Phase bands */}
          {PHASES.map((p) => {
            const x1 = Math.max(0, xPercent(p.from));
            const x2 = Math.min(100, xPercent(p.to));
            return (
              <rect
                key={p.label}
                x={x1}
                y="14"
                width={x2 - x1}
                height="14"
                fill={KIND_COLOR[p.kind]}
                opacity="0.08"
                rx="0.5"
              />
            );
          })}

          {/* Year tick marks + labels */}
          {YEAR_TICKS.map(({ year, x }) => (
            <g key={year}>
              <line
                x1={x}
                x2={x}
                y1="14"
                y2="28"
                stroke="currentColor"
                stroke-opacity="0.18"
                stroke-width="0.25"
              />
              <text
                x={x}
                y="40"
                text-anchor="middle"
                font-size="4"
                font-family="var(--font-mono)"
                fill="var(--muted)"
              >
                {year}
              </text>
            </g>
          ))}

          {/* Baseline */}
          <line
            x1="0"
            y1="21"
            x2="100"
            y2="21"
            stroke="currentColor"
            stroke-opacity="0.22"
            stroke-width="0.4"
          />

          {/* Event ticks */}
          {EVENTS.map((e, i) => {
            const x = xPercent(e.date);
            const isActive = i === active;
            return (
              <g key={`${e.date}-${i}`} class="xz-tl-tick">
                {isActive && (
                  <circle
                    cx={x}
                    cy="21"
                    r="3.4"
                    fill="none"
                    stroke={KIND_COLOR[e.kind]}
                    stroke-width="0.6"
                    opacity="0.4"
                  />
                )}
                <circle
                  class={isActive ? "is-active" : undefined}
                  cx={x}
                  cy="21"
                  r={isActive ? 1.8 : 1.2}
                  fill={KIND_COLOR[e.kind]}
                />
              </g>
            );
          })}

          {/* Playhead */}
          <g class="xz-tl-playhead">
            <line
              x1={`${playX}%`}
              y1="6"
              x2={`${playX}%`}
              y2="34"
              stroke={KIND_COLOR[currentEvent.kind]}
              stroke-width="0.7"
            />
            <path
              d={`M ${playX} 4 l -1 -2 l 2 0 z`}
              fill={KIND_COLOR[currentEvent.kind]}
            />
          </g>
        </svg>

        <div class="xz-tl-current">
          <time class="xz-tl-date" data-numeric>
            {currentEvent.date}
          </time>
          <span class="xz-tl-kind" data-kind={currentEvent.kind}>
            {currentEvent.kind}
          </span>
          <span class="xz-tl-actor">{currentEvent.actor}</span>
          <span class="xz-tl-progress">
            {active + 1} / {EVENTS.length}
          </span>
        </div>
      </div>

      <ol class="xz-tl-steps">
        {EVENTS.map((e, i) => (
          <li
            key={`${e.date}-${i}`}
            class={`xz-tl-step xz-tl-${e.kind}`}
            data-idx={i}
            data-active={i === active}
            aria-current={i === active ? "step" : undefined}
          >
            <header class="xz-tl-step-head">
              <time class="xz-tl-step-date" data-numeric>
                {e.date}
              </time>
              <span class="xz-tl-step-kind" data-kind={e.kind}>
                {e.kind}
              </span>
              <span class="xz-tl-step-actor">{e.actor}</span>
            </header>
            <h4 class="xz-tl-title">{e.title}</h4>
            <p class="xz-tl-summary">{e.summary}</p>
            {e.quote && <blockquote class="xz-tl-quote">{e.quote}</blockquote>}
            <a
              href={e.source}
              target="_blank"
              rel="noopener noreferrer"
              class="xz-tl-source"
            >
              source ↗
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
