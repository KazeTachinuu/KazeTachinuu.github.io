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

export default function Timeline() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: ".xz-tl-step", offset: 0.6 })
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

  const playX = xPercent(EVENTS[active].date);

  return (
    <section
      class="xz-widget xz-tl"
      ref={rootRef}
      aria-label="Timeline of the XZ backdoor attack"
    >
      <div class="xz-tl-sticky">
        <svg
          viewBox="0 0 100 30"
          class="xz-tl-svg"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1="0"
            y1="15"
            x2="100"
            y2="15"
            stroke="currentColor"
            stroke-opacity="0.18"
            stroke-width="0.3"
          />
          {EVENTS.map((e, i) => {
            const x = xPercent(e.date);
            const isActive = i === active;
            return (
              <circle
                key={`${e.date}-${i}`}
                class={isActive ? "is-active" : undefined}
                cx={x}
                cy="15"
                r={isActive ? 1.6 : 0.95}
                fill={KIND_COLOR[e.kind]}
              />
            );
          })}
          <line
            class="xz-tl-playhead"
            x1={`${playX}%`}
            y1="3"
            x2={`${playX}%`}
            y2="27"
            stroke={KIND_COLOR[EVENTS[active].kind]}
            stroke-width="0.5"
          />
        </svg>
        <div class="xz-tl-current">
          <time class="xz-tl-date">{EVENTS[active].date}</time>
          <span class="xz-tl-kind" data-kind={EVENTS[active].kind}>
            {EVENTS[active].kind}
          </span>
          <span class="xz-tl-actor">{EVENTS[active].actor}</span>
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
              <time class="xz-tl-step-date">{e.date}</time>
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
