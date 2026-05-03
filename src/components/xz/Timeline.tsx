import { useEffect, useRef, useState } from "preact/hooks";
import data from "../../data/xz-timeline.json";

interface Trace {
  cmd: string;
  out?: string;
  comment?: string;
}

interface Event {
  date: string;
  actor: string;
  kind: "context" | "discovery" | "malicious" | "preparatory" | "pressure";
  subkind?: string;
  title: string;
  summary: string;
  quote: string | null;
  trace?: Trace;
  source: string;
}
const EVENTS: Event[] = data.events as Event[];

type Phase = "infiltration" | "release" | "discovery";
const PHASES: Record<Phase, { num: string; title: string; range: string }> = {
  infiltration: { num: "I", title: "Infiltration", range: "Oct 2021 - Jan 2024" },
  release: { num: "II", title: "Release", range: "Feb - Mar 2024" },
  discovery: { num: "III", title: "Discovery", range: "Mar 29, 2024" },
};

function phaseOf(e: Event): Phase {
  if (e.kind === "discovery") return "discovery";
  if (e.kind === "malicious") return "release";
  return "infiltration";
}

const PHASE_GROUPS = (() => {
  const groups: { phase: Phase; events: Event[] }[] = [];
  let current: { phase: Phase; events: Event[] } | null = null;
  for (const e of EVENTS) {
    const p = phaseOf(e);
    if (!current || current.phase !== p) {
      current = { phase: p, events: [] };
      groups.push(current);
    }
    current.events.push(e);
  }
  return groups;
})();

const DISCLOSURE_EMAIL = {
  from: "Andres Freund <andres@anarazel.de>",
  to: "oss-security@lists.openwall.com",
  date: "Fri, 29 Mar 2024 08:51:26 -0700",
  subject: "backdoor in upstream xz/liblzma leading to ssh server compromise",
};

export default function Timeline() {
  const containerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onScroll() {
      if (!innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      const winH = window.innerHeight;
      // Progress: 0 when section top hits 85% of viewport,
      // 1 when section bottom hits 50%.
      const start = winH * 0.85;
      const end = -rect.height + winH * 0.5;
      const p = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      setProgress(reduce ? 1 : p);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      class="xz-widget xz-tl not-prose"
      ref={containerRef}
      aria-label="Timeline of the XZ backdoor attack"
    >
      <div class="xz-tl-inner" ref={innerRef}>
        {/* Vertical beam - full-height background line + animated fill */}
        <div class="xz-tl-beam" aria-hidden>
          <div
            class="xz-tl-beam-fill"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        {PHASE_GROUPS.map(({ phase, events }) => {
          const meta = PHASES[phase];
          return (
            <div class={`xz-tl-row is-${phase}`} key={phase}>
              {/* Sticky phase column (left) */}
              <div class="xz-tl-phase">
                <div class="xz-tl-phase-marker" aria-hidden>
                  <span class="xz-tl-phase-marker-dot" />
                </div>
                <div class="xz-tl-phase-stack">
                  <span class="xz-tl-phase-num">{meta.num}</span>
                  <h3 class="xz-tl-phase-name">{meta.title}</h3>
                  <span class="xz-tl-phase-range">{meta.range}</span>
                </div>
              </div>

              {/* Events column (right) */}
              <div class="xz-tl-events">
                {events.map((e, i) => {
                  const isDisclosure = e.subkind === "disclosure";
                  const tone =
                    e.kind === "discovery"
                      ? "def"
                      : e.kind === "malicious" || e.kind === "pressure"
                        ? "att"
                        : "neutral";
                  return (
                    <article
                      class={`xz-tl-event is-${tone}`}
                      key={`${e.date}-${i}`}
                    >
                      <header class="xz-tl-event-meta">
                        <time class="xz-tl-event-date">{e.date}</time>
                        <span class="xz-tl-event-actor">{e.actor}</span>
                        <span class={`xz-tl-event-kind is-${tone}`}>
                          {e.subkind ?? e.kind}
                        </span>
                      </header>

                      <h4 class="xz-tl-event-title">{e.title}</h4>

                      {isDisclosure ? (
                        <div
                          class="xz-tl-email"
                          role="figure"
                          aria-label="Andres Freund's oss-security disclosure email"
                        >
                          <div class="xz-tl-email-headers">
                            <span class="xz-tl-email-h-key">From</span>
                            <span class="xz-tl-email-h-val">{DISCLOSURE_EMAIL.from}</span>
                            <span class="xz-tl-email-h-key">To</span>
                            <span class="xz-tl-email-h-val">{DISCLOSURE_EMAIL.to}</span>
                            <span class="xz-tl-email-h-key">Date</span>
                            <span class="xz-tl-email-h-val">{DISCLOSURE_EMAIL.date}</span>
                            <span class="xz-tl-email-h-key">Subject</span>
                            <span class="xz-tl-email-h-val">{DISCLOSURE_EMAIL.subject}</span>
                          </div>
                          <div class="xz-tl-email-body">{e.quote}</div>
                        </div>
                      ) : (
                        <>
                          <p class="xz-tl-event-summary">{e.summary}</p>
                          {e.quote && (
                            <blockquote class={`xz-tl-event-quote is-${tone}`}>
                              {e.quote}
                            </blockquote>
                          )}
                        </>
                      )}

                      {e.trace && (
                        <div class="xz-tl-event-trace">
                          <span class="xz-tl-trace-line">
                            <span class="xz-tl-trace-prompt">$</span>
                            <span class="xz-tl-trace-cmd">{e.trace.cmd}</span>
                          </span>
                          {e.trace.out && (
                            <span class="xz-tl-trace-out">{e.trace.out}</span>
                          )}
                          {e.trace.comment && (
                            <span class="xz-tl-trace-cmt">
                              # {e.trace.comment}
                            </span>
                          )}
                        </div>
                      )}

                      <a
                        href={e.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="xz-tl-event-source"
                      >
                        source <span class="xz-tl-event-source-arrow">↗</span>
                      </a>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
