# hugosibony.com

Personal site — portfolio, blog, snippets, CTF writeups, and small tools. Built with Astro, deployed on Cloudflare.

## Stack

- [Astro](https://astro.build) 6 + MDX + Preact islands
- Tailwind CSS v4
- [Expressive Code](https://expressive-code.com) for syntax highlighting
- [Pagefind](https://pagefind.app) for static search
- Cloudflare Pages (site) + Workers (view-count API in `worker/`)

## Develop

```sh
bun install
bun run dev       # astro dev
bun run build     # astro build && pagefind
bun run preview
```

Node >= 22.12 is required (see `package.json`).

## Layout

```
src/           # pages, components, content collections, layouts, styles
public/        # static assets served as-is (images, pdfs, writeup files)
themes/        # Expressive Code syntax themes
worker/        # Cloudflare Worker for view counts / likes
```
