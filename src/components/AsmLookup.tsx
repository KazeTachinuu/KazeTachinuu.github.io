import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import darkTheme from '../../themes/josh-dark.js';
import lightTheme from '../../themes/josh-light.js';
import { OPS, type Op } from '../data/asm-ops';

/* Inline markdown helper: `code` spans only. */
function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) =>
    p.startsWith('`') && p.endsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : <span key={i}>{p}</span>
  );
}

function opMatches(op: Op, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    op.slug.includes(needle) ||
    op.mnemonic.toLowerCase().includes(needle) ||
    op.name.toLowerCase().includes(needle) ||
    op.summary.toLowerCase().includes(needle)
  );
}

/* Tokens the user might type to pick this entry exactly —
   its slug plus each mnemonic segment (e.g. "je / jz" → ["je", "jz"]). */
function exactTokens(op: Op): string[] {
  const parts = op.mnemonic.toLowerCase().split(/[\s/]+/).filter(Boolean);
  return [op.slug, ...parts];
}

function exactMatchFor(query: string): Op | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return OPS.find((op) => exactTokens(op).includes(q)) ?? null;
}

function slugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('op');
}

interface Token {
  content: string;
  color?: string;
  fontStyle?: number;
}

/* Render Shiki tokens as Preact spans — no HTML strings, no innerHTML.
   Each token's color comes straight from the highlighter. */
function CodeBlock({ tokens, fallback }: { tokens: Token[][] | null; fallback: string }) {
  if (!tokens) return <pre>{fallback}</pre>;
  return (
    <pre>
      <code>
        {tokens.map((line, i) => (
          <span key={i} class="line">
            {line.map((t, j) => (
              <span
                key={j}
                style={t.color ? { color: t.color } : undefined}
              >
                {t.content}
              </span>
            ))}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

export default function AsmLookup() {
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(slugFromUrl);
  const [highlighter, setHighlighter] = useState<any>(null);
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createHighlighterCore({
      themes: [darkTheme as any, lightTheme as any],
      langs: [import('shiki/langs/asm.mjs')],
      engine: createJavaScriptRegexEngine(),
    }).then(setHighlighter);

    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedSlug) url.searchParams.set('op', selectedSlug);
    else url.searchParams.delete('op');
    window.history.replaceState(null, '', url.toString());
  }, [selectedSlug]);

  useEffect(() => {
    const handler = () => setSelectedSlug(slugFromUrl());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const selected = useMemo(
    () => (selectedSlug ? OPS.find((o) => o.slug === selectedSlug) ?? null : null),
    [selectedSlug]
  );

  const filtered = useMemo(() => OPS.filter((o) => opMatches(o, query)), [query]);

  function pick(slug: string) {
    setSelectedSlug(slug);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clear() {
    setSelectedSlug(null);
    setQuery('');
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  /* Auto-pick when the query exactly matches a mnemonic or slug. */
  useEffect(() => {
    if (selectedSlug) return;
    const exact = exactMatchFor(query);
    if (exact) pick(exact.slug);
  }, [query, selectedSlug]);

  function onSubmit(e: Event) {
    e.preventDefault();
    const exact = exactMatchFor(query);
    if (exact) pick(exact.slug);
    else if (filtered.length === 1) pick(filtered[0].slug);
  }

  function tokenize(code: string): Token[][] | null {
    if (!highlighter) return null;
    try {
      const res = highlighter.codeToTokens(code, {
        lang: 'asm',
        theme: dark ? 'josh-dark' : 'josh-light',
      });
      return res.tokens as Token[][];
    } catch {
      return null;
    }
  }

  const active = !!selected;
  const exampleTokens = selected ? tokenize(selected.example) : null;

  return (
    <div class={`asm${active ? ' asm-active' : ''}`}>
      <header class="asm-hero">
        <h1 class="asm-title">Assembly Lookup</h1>
        <p class="asm-sub">
          Search an x86-64 instruction (AT&amp;T / GAS syntax) to learn more about it:
        </p>
      </header>

      <form class="asm-search" onSubmit={onSubmit} role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        {active ? (
          <span class="asm-search-chip" aria-label={`Selected: ${selected!.mnemonic}`}>
            {selected!.mnemonic}
          </span>
        ) : (
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder="mov, lea, syscall…"
            aria-label="Search for an instruction"
            spellcheck={false}
            autocomplete="off"
            autoFocus
            onInput={(e: any) => setQuery(e.target.value)}
          />
        )}
        {active && (
          <button type="button" class="asm-search-x" onClick={clear} aria-label="Clear selection">
            &times;
          </button>
        )}
      </form>

      {!active && (
        <section class="asm-grid-wrap">
          <p class="asm-grid-label">Or, pick one:</p>
          {filtered.length > 0 ? (
            <ul class="asm-chips">
              {filtered.map((op) => (
                <li key={op.slug}>
                  <button
                    type="button"
                    class="asm-chip"
                    onClick={() => pick(op.slug)}
                    title={op.name}
                    aria-label={`${op.mnemonic} — ${op.name}`}
                  >
                    {op.mnemonic}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p class="asm-empty">No instruction matches "{query}".</p>
          )}
        </section>
      )}

      {active && selected && (
        <article class="asm-detail">
          <p class="asm-lede">
            This is the <strong class="asm-accent">{selected.name}</strong> instruction.
          </p>

          {selected.body.map((para, i) => (
            <p key={i} class="asm-para">
              {renderInline(para)}
            </p>
          ))}

          <div class="asm-code">
            <CodeBlock tokens={exampleTokens} fallback={selected.example} />
          </div>

          {selected.moreHref && (
            <p class="asm-more">
              Read more{' '}
              <a href={selected.moreHref} target="_blank" rel="noopener noreferrer">
                {selected.moreLabel ?? 'on felixcloutier.com'}
              </a>
              .
            </p>
          )}
        </article>
      )}
    </div>
  );
}
