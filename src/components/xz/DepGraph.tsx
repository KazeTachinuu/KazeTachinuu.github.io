import { useEffect, useState } from "preact/hooks";
import scrollama from "scrollama";

type Stage = "legitimate" | "ifunc" | "attack";

interface Node {
  x: number;
  y: number;
  label: string;
  sub?: string;
}
const NODES: Record<string, Node> = {
  sshd: { x: 90, y: 60, label: "sshd", sub: "OpenSSH server" },
  libsystemd: {
    x: 300,
    y: 60,
    label: "libsystemd.so.0",
    sub: "sd_notify (distro patch)",
  },
  liblzma: {
    x: 510,
    y: 60,
    label: "liblzma.so.5",
    sub: "compression — and the implant",
  },
  rsa: {
    x: 300,
    y: 220,
    label: "RSA_public_decrypt",
    sub: "libcrypto / OpenSSL",
  },
  ifunc: {
    x: 510,
    y: 220,
    label: "IFUNC resolver",
    sub: "_get_cpuid (malicious)",
  },
};

interface Edge {
  from: keyof typeof NODES;
  to: keyof typeof NODES;
  label: string;
  stages: Stage[];
  malicious?: boolean;
  dashed?: boolean;
}
const EDGES: Edge[] = [
  {
    from: "sshd",
    to: "libsystemd",
    label: "sd_notify",
    stages: ["legitimate", "ifunc", "attack"],
  },
  {
    from: "libsystemd",
    to: "liblzma",
    label: "journal compress",
    stages: ["legitimate", "ifunc", "attack"],
  },
  {
    from: "liblzma",
    to: "ifunc",
    label: "IFUNC @ CRC64",
    stages: ["ifunc", "attack"],
    malicious: true,
  },
  {
    from: "ifunc",
    to: "rsa",
    label: "patches GOT",
    stages: ["ifunc", "attack"],
    malicious: true,
    dashed: true,
  },
  {
    from: "sshd",
    to: "rsa",
    label: "cert verify",
    stages: ["attack"],
    malicious: true,
  },
];

const STEPS: { stage: Stage; title: string; body: string }[] = [
  {
    stage: "legitimate",
    title: "1. The legitimate path",
    body: "OpenSSH upstream does not link libsystemd. Most distros patch sshd to call sd_notify() for socket activation — and libsystemd in turn links liblzma for journal compression. That's how a compression library ends up loaded into the SSH daemon.",
  },
  {
    stage: "ifunc",
    title: "2. The IFUNC resolver fires",
    body: "Glibc calls IFUNC resolvers exactly once per process, very early — before RELRO marks the GOT read-only. The malicious _get_cpuid resolver walks the dynamic linker's link map, finds sshd's GOT entry for RSA_public_decrypt, and overwrites it with a pointer to the attacker's stub.",
  },
  {
    stage: "attack",
    title: "3. An attack key arrives",
    body: "A remote SSH client connects with a crafted RSA key. The hooked RSA_public_decrypt parses the modulus as [tag][ed448_sig][cmd], verifies the signature against the embedded Ed448 public key, and on success calls system(cmd) as root, pre-auth, with no logs.",
  },
];

const NODE_W = 180;
const NODE_H = 44;

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

  function isHookedNode(id: string): boolean {
    if (stage === "legitimate") return false;
    return id === "ifunc" || id === "rsa";
  }

  return (
    <section
      class="xz-widget xz-dg"
      aria-label="Dependency hijack chain across three stages"
    >
      <div class="xz-dg-sticky" data-stage={stage}>
        <svg viewBox="0 0 600 280" class="xz-dg-svg" aria-hidden>
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
            const a = NODES[e.from];
            const b = NODES[e.to];
            const active = e.stages.includes(stage);
            const stroke = e.malicious ? "var(--xz-attacker)" : "currentColor";
            const marker = e.malicious
              ? "url(#xz-dg-arrow-attacker)"
              : "url(#xz-dg-arrow)";
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g
                key={`${e.from}-${e.to}`}
                style={{
                  opacity: active ? 1 : 0.12,
                  transition: "opacity 0.35s ease",
                }}
              >
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={stroke}
                  stroke-opacity={e.malicious ? 0.85 : 0.35}
                  stroke-width="1.5"
                  stroke-dasharray={e.dashed ? "5 4" : undefined}
                  marker-end={marker}
                />
                <text
                  x={midX}
                  y={midY - 8}
                  text-anchor="middle"
                  font-size="10"
                  fill="var(--muted)"
                  class="xz-dg-edge-label"
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {Object.entries(NODES).map(([id, n]) => {
            const hooked = isHookedNode(id);
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
                  stroke-opacity={hooked ? 1 : 0.3}
                  stroke-width="1.5"
                  style={{
                    transition: "stroke 0.35s ease, stroke-opacity 0.35s ease",
                  }}
                />
                <text
                  x={n.x}
                  y={n.y - 4}
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
                    y={n.y + 12}
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
          >
            <h4 class="xz-dg-title">{s.title}</h4>
            <p class="xz-dg-body">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
