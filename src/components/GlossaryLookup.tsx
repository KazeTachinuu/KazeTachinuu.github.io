import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { VNode } from 'preact';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import katex from 'katex';
import darkTheme from '../../themes/josh-dark.js';
import lightTheme from '../../themes/josh-light.js';
import { GLOSSARY, KINDS, type Entry, type Kind, type Lang } from '../data/glossary';

/* KaTeX inline math.
 * Input is our own static glossary data (trusted), KaTeX runs with the
 * default `trust:false` so its HTML output cannot embed scripts. We render
 * via DOMParser + replaceChildren - proper safe DOM APIs. */
function Math({ tex }: { tex: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const html = katex.renderToString(tex, {
      throwOnError: false,
      output: 'html',
      displayMode: false,
    });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    ref.current.replaceChildren(...Array.from(doc.body.childNodes));
  }, [tex]);
  return <span class="gloss-math" ref={ref} />;
}

/* Inline SVG figure. Same DOMParser pattern as Math: parse the trusted
 * static markup into nodes, attach via replaceChildren. */
function InlineSvg({ markup, label }: { markup: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg && svg.tagName.toLowerCase() === 'svg') {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);
      ref.current.replaceChildren(svg);
    }
  }, [markup, label]);
  return <div class="gloss-figure-svg" ref={ref} />;
}

/* Inline rendering: `code`, $math$, [link](url), *italic*; literal otherwise. */
function renderInline(text: string): (VNode | string)[] {
  const out: (VNode | string)[] = [];
  let i = 0;
  let plainStart = 0;
  let k = 0;
  const flush = () => {
    if (plainStart < i) out.push(text.slice(plainStart, i));
  };
  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flush();
        out.push(<code key={k++}>{text.slice(i + 1, end)}</code>);
        i = end + 1;
        plainStart = i;
        continue;
      }
    } else if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end > i) {
        flush();
        out.push(<Math key={k++} tex={text.slice(i + 1, end)} />);
        i = end + 1;
        plainStart = i;
        continue;
      }
    } else if (text[i] === '[') {
      const close = text.indexOf('](', i);
      const end = close > i ? text.indexOf(')', close) : -1;
      if (close > i && end > close) {
        flush();
        const label = text.slice(i + 1, close);
        const href = text.slice(close + 2, end);
        out.push(
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
        i = end + 1;
        plainStart = i;
        continue;
      }
    } else if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i + 1) {
        flush();
        out.push(<em key={k++}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        plainStart = i;
        continue;
      }
    }
    i++;
  }
  flush();
  return out;
}

function entryMatches(e: Entry, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    e.slug.includes(needle) ||
    e.term.toLowerCase().includes(needle) ||
    (e.expansion?.toLowerCase().includes(needle) ?? false) ||
    e.summary.toLowerCase().includes(needle)
  );
}

function exactTokens(e: Entry): string[] {
  return [e.slug.toLowerCase(), e.term.toLowerCase()];
}
function exactMatchFor(query: string): Entry | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return GLOSSARY.find((e) => exactTokens(e).includes(q)) ?? null;
}

function slugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('slug');
}

interface Token { content: string; color?: string }

/* Shiki tokens → Preact spans. Mirrors AsmLookup's CodeBlock. */
function CodeBlock({ tokens, fallback }: { tokens: Token[][] | null; fallback: string }) {
  if (!tokens) return <pre><code>{fallback}</code></pre>;
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
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

/* Shiki language slug per Lang. "text" stays unhighlighted. */
const SHIKI_LANG: Record<Lang, string | null> = {
  c: 'c',
  asm: 'asm',
  bash: 'bash',
  python: 'python',
  text: null,
};

export default function GlossaryLookup() {
  const initial = (() => {
    const raw = slugFromUrl();
    if (!raw) return null;
    return GLOSSARY.find((e) => e.slug === raw.toLowerCase()) ?? null;
  })();

  const [query, setQuery] = useState(() => initial?.term ?? '');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => initial?.slug ?? null
  );
  const [highlighter, setHighlighter] = useState<any>(null);
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  const searchRef = useRef<HTMLInputElement>(null);

  // Shiki bootstrap + theme observer (one-time)
  useEffect(() => {
    createHighlighterCore({
      themes: [darkTheme as any, lightTheme as any],
      langs: [
        import('shiki/langs/c.mjs'),
        import('shiki/langs/asm.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/python.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    }).then(setHighlighter);

    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // URL sync
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedSlug) url.searchParams.set('slug', selectedSlug);
    else url.searchParams.delete('slug');
    window.history.replaceState(null, '', url.toString());
  }, [selectedSlug]);

  // Browser back/forward
  useEffect(() => {
    const handler = () => {
      const raw = slugFromUrl();
      const e = raw ? GLOSSARY.find((x) => x.slug === raw.toLowerCase()) : null;
      setSelectedSlug(e?.slug ?? null);
      if (e) setQuery(e.term);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const selected = useMemo(
    () => (selectedSlug ? GLOSSARY.find((e) => e.slug === selectedSlug) ?? null : null),
    [selectedSlug]
  );

  const filtered = useMemo(() => GLOSSARY.filter((e) => entryMatches(e, query)), [query]);

  const grouped = useMemo(() => {
    const map = new Map<Kind, Entry[]>();
    for (const e of filtered) {
      if (!map.has(e.kind)) map.set(e.kind, []);
      map.get(e.kind)!.push(e);
    }
    return KINDS.filter((k) => map.has(k.key)).map((k) => ({
      kind: k,
      entries: map.get(k.key)!,
    }));
  }, [filtered]);

  function pick(slug: string) {
    const e = GLOSSARY.find((x) => x.slug === slug);
    if (e) setQuery(e.term);
    setSelectedSlug(slug);
    searchRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clear() {
    setSelectedSlug(null);
    setQuery('');
    searchRef.current?.focus();
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      if (selectedSlug) setSelectedSlug(null);
      return;
    }
    const exact = exactMatchFor(q);
    if (exact && exact.slug !== selectedSlug) setSelectedSlug(exact.slug);
  }, [query]);

  function onSubmit(e: Event) {
    e.preventDefault();
    const exact = exactMatchFor(query);
    if (exact) pick(exact.slug);
    else if (filtered.length === 1) pick(filtered[0].slug);
  }

  function tokenize(code: string, lang: Lang): Token[][] | null {
    if (!highlighter) return null;
    const shikiLang = SHIKI_LANG[lang];
    if (!shikiLang) return null;
    try {
      const res = highlighter.codeToTokens(code, {
        lang: shikiLang,
        theme: dark ? 'josh-dark' : 'josh-light',
      });
      return res.tokens as Token[][];
    } catch {
      return null;
    }
  }

  const active = !!selected;
  const exampleTokens = selected?.example
    ? tokenize(selected.example, selected.exampleLang ?? 'text')
    : null;

  return (
    <div class={`gloss${active ? ' gloss-active' : ''}`}>
      <header class="gloss-hero">
        <h1 class="gloss-title">Glossary</h1>
        <p class="gloss-sub">
          Technical terms used across the site, defined once. Search a term, or pick one below.
        </p>
      </header>

      <form class="gloss-search" onSubmit={onSubmit} role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={query}
          placeholder="GOT, RELRO, sshd…"
          aria-label="Search the glossary"
          spellcheck={false}
          autocomplete="off"
          autoFocus
          onInput={(e: any) => setQuery(e.target.value)}
        />
        {(query || active) && (
          <button type="button" class="gloss-search-x" onClick={clear} aria-label="Clear">
            &times;
          </button>
        )}
      </form>

      {!active && (
        <section class="gloss-grid-wrap">
          {grouped.length > 0 ? (
            grouped.map((g) => (
              <div key={g.kind.key} class="gloss-group">
                <p class="gloss-group-label">{g.kind.label}</p>
                <ul class="gloss-chips">
                  {g.entries.map((e) => (
                    <li key={e.slug}>
                      <button
                        type="button"
                        class="gloss-chip"
                        onClick={() => pick(e.slug)}
                        title={e.expansion ?? e.summary}
                        aria-label={`${e.term}${e.expansion ? ' - ' + e.expansion : ''}`}
                      >
                        {e.term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p class="gloss-empty">No term matches "{query}".</p>
          )}
        </section>
      )}

      {active && selected && (
        <article class="gloss-detail">
          <header class="gloss-detail-head">
            <code class="gloss-detail-term">{selected.term}</code>
            {selected.expansion && (
              <span class="gloss-detail-exp">{selected.expansion}</span>
            )}
            <span class="gloss-detail-kind">
              {KINDS.find((k) => k.key === selected.kind)?.label}
            </span>
          </header>

          <p class="gloss-detail-summary">{renderInline(selected.summary)}</p>

          <div class="gloss-detail-body">
            {selected.body.map((para, i) => (
              <p key={i} class="gloss-para">
                {renderInline(para)}
              </p>
            ))}
          </div>

          {selected.image && (
            <figure class="gloss-figure">
              {selected.image.svg ? (
                <InlineSvg markup={selected.image.svg} label={selected.image.alt} />
              ) : selected.image.src ? (
                <img
                  src={selected.image.src}
                  alt={selected.image.alt}
                  loading="lazy"
                  data-invert={selected.image.invert ? '' : undefined}
                />
              ) : null}
              {selected.image.caption && (
                <figcaption>{renderInline(selected.image.caption)}</figcaption>
              )}
            </figure>
          )}

          {selected.example && (
            <div class="gloss-code" data-lang={selected.exampleLang ?? 'text'}>
              <CodeBlock tokens={exampleTokens} fallback={selected.example} />
            </div>
          )}

          {selected.moreHref && (
            <p class="gloss-more">
              <a href={selected.moreHref} target="_blank" rel="noopener noreferrer">
                {selected.moreLabel ?? 'Primary source'}
              </a>
              <span class="gloss-more-arrow" aria-hidden>↗</span>
            </p>
          )}
        </article>
      )}
    </div>
  );
}
