import { useEffect, useState } from "preact/hooks";
import scrollama from "scrollama";

type Stage = "legitimate" | "ifunc" | "attack";

interface Node {
  /** rect center, in viewBox units */
  x: number;
  y: number;
  label: string;
  sub?: string;
}

const NODE_W = 168;
const NODE_H = 44;

/* Layout: top row is the legitimate dep chain (sshd → libsystemd → liblzma).
   Bottom row hosts the two malicious targets, each placed directly under
   the node it pairs with so edges run along the rectangle perimeter and
   never cross another node. */
const NODES: Record<string, Node> = {
  sshd: { x: 110, y: 60, label: "sshd" },
  libsystemd: {
    x: 360,
    y: 60,
    label: "libsystemd.so.0",
    sub: "sd_notify (distro patch)",
  },
  liblzma: { x: 610, y: 60, label: "liblzma.so.5" },
  rsa: { x: 110, y: 280, label: "RSA_public_decrypt", sub: "libcrypto" },
  ifunc: { x: 610, y: 280, label: "IFUNC resolver", sub: "_get_cpuid" },
};

interface Edge {
  from: keyof typeof NODES;
  to: keyof typeof NODES;
  label: string;
  /** "h" = horizontal, "v" = vertical — used to choose endpoint trim. */
  axis: "h" | "v";
  /** Where to place the label relative to the edge midpoint. */
  labelSide: "above" | "below" | "left" | "right";
  stages: Stage[];
  malicious?: boolean;
  dashed?: boolean;
}

const EDGES: Edge[] = [
  {
    from: "sshd",
    to: "libsystemd",
    label: "sd_notify",
    axis: "h",
    labelSide: "above",
    stages: ["legitimate", "ifunc", "attack"],
  },
  {
    from: "libsystemd",
    to: "liblzma",
    label: "journal compress",
    axis: "h",
    labelSide: "above",
    stages: ["legitimate", "ifunc", "attack"],
  },
  {
    from: "liblzma",
    to: "ifunc",
    label: "IFUNC @ CRC64",
    axis: "v",
    labelSide: "right",
    stages: ["ifunc", "attack"],
    malicious: true,
  },
  {
    from: "ifunc",
    to: "rsa",
    label: "patches GOT",
    axis: "h",
    labelSide: "below",
    stages: ["ifunc", "attack"],
    malicious: true,
    dashed: true,
  },
  {
    from: "sshd",
    to: "rsa",
    label: "cert verify",
    axis: "v",
    labelSide: "left",
    stages: ["attack"],
    malicious: true,
  },
];

const STEPS: { stage: Stage; title: string; body: string }[] = [
  {
    stage: "legitimate",
    title: "1. Legitimate path",
    body: "OpenSSH upstream does not link libsystemd. Most distros patch sshd to call sd_notify() for socket activation; libsystemd in turn links liblzma for journal compression.",
  },
  {
    stage: "ifunc",
    title: "2. IFUNC resolver fires",
    body: "Glibc calls IFUNC resolvers once per process, before RELRO marks the GOT read-only. The malicious _get_cpuid resolver walks the linker's link map, finds sshd's GOT entry for RSA_public_decrypt, and overwrites it with a pointer to the attacker's stub.",
  },
  {
    stage: "attack",
    title: "3. Attack key arrives",
    body: "A remote SSH client connects with a crafted RSA key. The hooked RSA_public_decrypt parses the modulus as [tag][ed448_sig][cmd], verifies the signature against the embedded Ed448 public key, and on success calls system(cmd) as root, pre-auth.",
  },
];

/* Compute the segment endpoints trimmed to the rect edges, plus a label
   anchor offset perpendicular to the edge. Pure geometry, no rendering. */
function edgeGeom(e: Edge) {
  const a = NODES[e.from];
  const b = NODES[e.to];
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;
  const labelGap = 14;

  let x1 = a.x;
  let y1 = a.y;
  let x2 = b.x;
  let y2 = b.y;
  let lx = (a.x + b.x) / 2;
  let ly = (a.y + b.y) / 2;

  if (e.axis === "h") {
    if (b.x > a.x) {
      x1 = a.x + halfW;
      x2 = b.x - halfW;
    } else {
      x1 = a.x - halfW;
      x2 = b.x + halfW;
    }
    ly += e.labelSide === "above" ? -labelGap : labelGap;
  } else {
    if (b.y > a.y) {
      y1 = a.y + halfH;
      y2 = b.y - halfH;
    } else {
      y1 = a.y - halfH;
      y2 = b.y + halfH;
    }
    lx += e.labelSide === "right" ? labelGap : -labelGap;
  }
  return { x1, y1, x2, y2, lx, ly };
}

export default function DepGraph() {
  const [stage, setStage] = useState<Stage>("legitimate");

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: ".xz-dg-step", offset: 0.6 })
      .onStepEnter((res: { element: Element }) => {
        const s = (res.element as HTMLElement).dataset.stage as Stage;
        if (s) setStage(s);
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

  function isHooked(id: string): boolean {
    if (stage === "legitimate") return false;
    return id === "ifunc" || id === "rsa";
  }

  return (
    <section
      class="xz-widget xz-dg"
      aria-label="Dependency hijack chain across three stages"
    >
      <div class="xz-dg-sticky" data-stage={stage}>
        <svg viewBox="0 0 720 360" class="xz-dg-svg" aria-hidden>
          <defs>
            <marker
              id="xz-dg-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
            <marker
              id="xz-dg-arrow-attacker"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--xz-attacker)" />
            </marker>
          </defs>

          {EDGES.map((e) => {
            const { x1, y1, x2, y2, lx, ly } = edgeGeom(e);
            const active = e.stages.includes(stage);
            const stroke = e.malicious ? "var(--xz-attacker)" : "currentColor";
            const marker = e.malicious
              ? "url(#xz-dg-arrow-attacker)"
              : "url(#xz-dg-arrow)";
            const labelAnchor =
              e.labelSide === "left"
                ? "end"
                : e.labelSide === "right"
                  ? "start"
                  : "middle";
            return (
              <g
                key={`${e.from}-${e.to}`}
                style={{
                  opacity: active ? 1 : 0.12,
                  transition: "opacity 0.35s ease",
                }}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  stroke-opacity={e.malicious ? 0.9 : 0.4}
                  stroke-width="1.5"
                  stroke-dasharray={e.dashed ? "5 4" : undefined}
                  marker-end={marker}
                />
                <text
                  x={lx}
                  y={ly}
                  text-anchor={labelAnchor}
                  font-size="11"
                  fill="var(--muted)"
                  class="xz-dg-edge-label"
                  dominant-baseline="middle"
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {Object.entries(NODES).map(([id, n]) => {
            const hooked = isHooked(id);
            const subY = n.sub ? n.y - 4 : n.y + 4;
            return (
              <g key={id}>
                <rect
                  x={n.x - NODE_W / 2}
                  y={n.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx="6"
                  fill="var(--page-bg)"
                  stroke={hooked ? "var(--xz-attacker)" : "currentColor"}
                  stroke-opacity={hooked ? 1 : 0.35}
                  stroke-width="1.5"
                  style={{
                    transition: "stroke 0.35s ease, stroke-opacity 0.35s ease",
                  }}
                />
                <text
                  x={n.x}
                  y={subY}
                  text-anchor="middle"
                  font-size="12"
                  font-weight="600"
                  fill="var(--page-text)"
                  class="xz-dg-node-label"
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    x={n.x}
                    y={n.y + 11}
                    text-anchor="middle"
                    font-size="10"
                    fill="var(--muted)"
                    class="xz-dg-node-sub"
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div class="xz-dg-current">
          <span class="xz-dg-stage-pill" data-stage={stage}>
            {stage === "legitimate"
              ? "Legitimate path"
              : stage === "ifunc"
                ? "IFUNC fires"
                : "Attack key arrives"}
          </span>
        </div>
      </div>
      <ol class="xz-dg-steps">
        {STEPS.map((s) => (
          <li
            key={s.stage}
            class={`xz-dg-step xz-dg-step-${s.stage}`}
            data-stage={s.stage}
            data-active={stage === s.stage}
            aria-current={stage === s.stage ? "step" : undefined}
          >
            <h4 class="xz-dg-title">{s.title}</h4>
            <p class="xz-dg-body">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
