import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import darkTheme from "../../../themes/josh-dark.js";
import lightTheme from "../../../themes/josh-light.js";
import { ARTIFACTS, VERSIONS, type Artifact } from "../../data/xz-pipeline";

type VersionKey = keyof typeof VERSIONS;
const VERSION_KEYS = Object.keys(VERSIONS) as VersionKey[];

/* Lucide stroke icons, inlined. ISC-licensed (lucide.dev). */
const ICON_STROKE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 1.75,
  "stroke-linecap": "round" as const,
  "stroke-linejoin": "round" as const,
};

function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      {...ICON_STROKE_PROPS}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      {...ICON_STROKE_PROPS}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      {...ICON_STROKE_PROPS}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface Token {
  content: string;
  color?: string;
}

function ShikiCode({
  code,
  lang,
  highlighter,
  dark,
}: {
  code: string;
  lang: string;
  highlighter: HighlighterCore | null;
  dark: boolean;
}) {
  const tokens = useMemo<Token[][] | null>(() => {
    if (!highlighter || lang === "plaintext") return null;
    try {
      const res = highlighter.codeToTokens(code, {
        lang,
        theme: dark ? "josh-dark" : "josh-light",
      });
      return res.tokens as Token[][];
    } catch (err) {
      console.error("[PayloadChain] Shiki tokenize failed:", err);
      return null;
    }
  }, [code, lang, highlighter, dark]);

  if (!tokens)
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  return (
    <pre>
      <code>
        {tokens.map((line, i) => (
          <span key={i} class="line">
            {line.map((t, j) => (
              <span key={j} style={t.color ? { color: t.color } : undefined}>
                {t.content}
              </span>
            ))}
            {"\n"}
          </span>
        ))}
      </code>
    </pre>
  );
}

function HashChip({ short, full }: { short: string; full: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: Event) {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }
  return (
    <button
      type="button"
      class={`xz-hash-chip${copied ? " is-copied" : ""}`}
      onClick={copy}
      title={`Click to copy: ${full}`}
      aria-label={`Copy SHA-256 ${full}`}
    >
      <span>{copied ? "copied" : short}</span>
      <span class="xz-hash-chip-icon">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
    </button>
  );
}

function ChainStep({
  art,
  idx,
  total,
  active,
  onSelect,
}: {
  art: Artifact;
  idx: number;
  total: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div class={`xz-chain-step${active ? " is-active" : ""}`}>
      <button
        type="button"
        class="xz-chain-step-btn"
        onClick={() => onSelect(art.id)}
        aria-pressed={active}
      >
        <span class={`xz-chain-step-pill is-${art.role}`}>{art.roleLabel}</span>
        <span class="xz-chain-step-name">{art.name}</span>
        <span class="xz-chain-step-meta">
          <span class="xz-chain-step-size">{art.size}</span>
          <span class="xz-chain-step-hash">{art.sha}</span>
        </span>
      </button>
      {idx < total - 1 && (
        <span class={`xz-chain-arrow${active ? " is-active" : ""}`} aria-hidden>
          <span class="xz-chain-arrow-line" />
          <span class="xz-chain-arrow-tip">
            <ChevronRightIcon />
          </span>
        </span>
      )}
    </div>
  );
}

function DetailPanel({
  art,
  version,
  highlighter,
  dark,
}: {
  art: Artifact;
  version: VersionKey;
  highlighter: HighlighterCore | null;
  dark: boolean;
}) {
  const [tab, setTab] = useState<"main" | "alt">("main");
  // ELF gets one moment of motion: the magic-bytes overlay fades into the hex
  // ~700ms after mount. `key={art.id}` on this component re-mounts it per
  // artifact, so the timer restarts cleanly each time.
  const [revealed, setRevealed] = useState(art.id !== "elf");

  useEffect(() => {
    if (art.id !== "elf") return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(t);
  }, [art.id]);

  const isMain = tab === "main";
  const mainCode = art.id === "stage1" ? VERSIONS[version].stage1 : art.code;
  const code = isMain ? mainCode : (art.altTab?.code ?? mainCode);
  const lang = isMain ? art.lang : (art.altTab?.lang ?? art.lang);
  const cap = isMain
    ? art.id === "stage1"
      ? `stage1.sh — ${VERSIONS[version].label}`
      : art.capLeft
    : (art.altTab?.cap ?? art.capLeft);
  const isHex = isMain && art.isHex === true;
  const showElfReveal = art.id === "elf" && isMain;
  const tablistId = `xz-tabs-${art.id}`;
  const panelId = `xz-panel-${art.id}`;

  return (
    <div class="xz-chain-detail">
      <div class="xz-chain-detail-headline">
        <span class={`xz-chain-step-pill is-${art.role}`}>{art.roleLabel}</span>
        <span class="xz-chain-detail-name">{art.name}</span>
      </div>

      <p class="xz-chain-blurb">{art.blurb}</p>

      <div class="xz-chain-detail-meta">
        <div class="xz-chain-detail-meta-cell">
          <span class="xz-chain-detail-meta-k">size</span>
          <span class="xz-chain-detail-meta-v">{art.size}</span>
        </div>
        <div class="xz-chain-detail-meta-cell">
          <span class="xz-chain-detail-meta-k">sha-256</span>
          <HashChip short={art.sha} full={art.shaFull} />
        </div>
        {art.id === "elf" && (
          <div class="xz-chain-detail-meta-cell">
            <span class="xz-chain-detail-meta-k">e_shnum</span>
            <span class="xz-chain-detail-meta-v xz-defender-strong">242</span>
          </div>
        )}
      </div>

      {art.altTab && (
        <div class="xz-chain-tabs" role="tablist" id={tablistId}>
          <button
            type="button"
            role="tab"
            id={`${tablistId}-main`}
            aria-selected={isMain}
            aria-controls={panelId}
            class={`xz-chain-tab${isMain ? " is-on" : ""}`}
            onClick={() => setTab("main")}
          >
            {art.mainTabLabel ?? "decoded"}
          </button>
          <button
            type="button"
            role="tab"
            id={`${tablistId}-alt`}
            aria-selected={!isMain}
            aria-controls={panelId}
            class={`xz-chain-tab${!isMain ? " is-on" : ""}`}
            onClick={() => setTab("alt")}
          >
            {art.altTab.label}
          </button>
        </div>
      )}

      <div
        class={`xz-chain-code-wrap${showElfReveal ? " is-elf" : ""}${revealed ? " is-revealed" : ""}`}
        role={art.altTab ? "tabpanel" : undefined}
        id={art.altTab ? panelId : undefined}
        aria-labelledby={art.altTab ? `${tablistId}-${tab}` : undefined}
      >
        {showElfReveal && (
          <div class="xz-chain-elf-overlay" aria-hidden>
            <span class="xz-chain-elf-bytes">
              <span class="xz-chain-elf-byte">7F</span>{" "}
              <span class="xz-chain-elf-byte">45</span>{" "}
              <span class="xz-chain-elf-byte">4C</span>{" "}
              <span class="xz-chain-elf-byte">46</span>
            </span>
            <span class="xz-chain-elf-arrow">→</span>
            <span class="xz-chain-elf-glyph">ELF</span>
          </div>
        )}

        <div class="xz-code-block">
          <div class="xz-code-block-cap">
            <div class="xz-code-block-cap-l">
              <span class={`xz-code-block-dot is-${art.role}`} />
              <span class="xz-code-block-cap-file">{cap}</span>
            </div>
            <div class="xz-code-block-cap-r">
              {art.id === "stage1" && isMain ? VERSIONS[version].label : ""}
            </div>
          </div>
          {isHex ? (
            <pre>
              <code>{code}</code>
            </pre>
          ) : (
            <ShikiCode
              code={code}
              lang={lang}
              highlighter={highlighter}
              dark={dark}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayloadChain() {
  const [active, setActive] = useState<string>(ARTIFACTS[0].id);
  const [version, setVersion] = useState<VersionKey>("5.6.1");
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  const [dark, setDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const idx = ARTIFACTS.findIndex((x) => x.id === active);
  const art = ARTIFACTS[idx >= 0 ? idx : 0];
  const versionToggleEnabled = art.id === "fixture" || art.id === "stage1";

  useEffect(() => {
    createHighlighterCore({
      themes: [darkTheme as any, lightTheme as any],
      langs: [import("shiki/langs/shellscript.mjs")],
      engine: createJavaScriptRegexEngine(),
    })
      .then(setHighlighter)
      .catch((err) => console.error("[PayloadChain] Shiki load failed:", err));

    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!rootRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowRight" && idx < ARTIFACTS.length - 1) {
        setActive(ARTIFACTS[idx + 1].id);
        e.preventDefault();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        setActive(ARTIFACTS[idx - 1].id);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  return (
    <figure
      class="xz-widget xz-payload-chain"
      ref={rootRef}
      aria-label="XZ-5.6.1 payload artifact chain"
    >
      <div class="xz-chain-rail-wrap">
        <div class="xz-chain-rail">
          {ARTIFACTS.map((a, i) => (
            <ChainStep
              key={a.id}
              art={a}
              idx={i}
              total={ARTIFACTS.length}
              active={active === a.id}
              onSelect={setActive}
            />
          ))}
        </div>
        <div class="xz-chain-version" role="group" aria-label="Tarball version">
          <span class="xz-chain-version-k">tarball</span>
          {VERSION_KEYS.map((v) => (
            <button
              key={v}
              type="button"
              class={`xz-chain-version-btn${version === v ? " is-on" : ""}`}
              onClick={() => setVersion(v)}
              disabled={!versionToggleEnabled}
              title={
                versionToggleEnabled
                  ? `Switch dropper to ${VERSIONS[v].label}`
                  : "Only Fixture / Stage-1 differ between versions."
              }
            >
              {VERSIONS[v].label}
            </button>
          ))}
        </div>
      </div>

      <DetailPanel
        key={art.id}
        art={art}
        version={version}
        highlighter={highlighter}
        dark={dark}
      />

      <figcaption class="xz-chain-foot">
        Hashes verified locally against the{" "}
        <a
          href="https://github.com/thesamesam/xz-archive"
          target="_blank"
          rel="noopener noreferrer"
        >
          xz-archive
        </a>{" "}
        copy of <code>xz-5.6.1.tar.gz</code>. The{" "}
        <code>liblzma_la-crc64-fast.o</code> hash is the{" "}
        <a
          href="https://github.com/smx-smx/xzre"
          target="_blank"
          rel="noopener noreferrer"
        >
          smx-smx/xzre
        </a>{" "}
        extraction; Binarly's distro-extracted hash <code>cbeef92e…3537</code>{" "}
        differs because it came from a real packaged{" "}
        <code>liblzma.so.5.6.1</code>. Structurally identical.
      </figcaption>
    </figure>
  );
}
