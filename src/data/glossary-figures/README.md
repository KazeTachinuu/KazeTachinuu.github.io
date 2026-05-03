# Glossary figures

Mermaid source for the diagrams referenced from `src/data/glossary.ts`.

Edit a `.mmd` file, then regenerate the SVGs with:

```bash
bun run figures
```

That runs `mmdc` (from `@mermaid-js/mermaid-cli`) with `mermaid.json` as the
theme config and writes the outputs into `public/glossary/`. Each
`<entry>.mmd` produces `<entry>.svg`.

External (non-Mermaid) figures used by the glossary live in `public/glossary/`
directly and are sourced from Wikimedia Commons - see each entry's
`image.caption` for the source link and licence.
