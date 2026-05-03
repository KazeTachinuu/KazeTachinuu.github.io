/**
 * Fetch the distro icons referenced by src/data/xz-distros.json and write
 * them to src/data/xz-icons/. Run once; outputs are checked in.
 *
 *   bun run scripts/fetch-svgl-icons.ts
 *
 * Sources:
 *   - svgl.app (https://api.svgl.app)              - for tech-brand logos
 *   - simple-icons.org (CC0, raw GitHub)           - for everything else
 *
 * svgl.app's catalogue is brand-focused and doesn't carry most Linux
 * distros, so we fall back to simple-icons for those. The fetch is
 * one-shot and the SVGs are committed; no runtime calls.
 */
import { writeFileSync, mkdirSync } from "node:fs";

interface SvglEntry {
  title: string;
  route: string | { light: string; dark: string };
}

/** filename → { svglQuery: string | null, simpleIconSlug: string } */
const WANTED: Record<string, { svgl: string | null; simple: string }> = {
  "debian.svg": { svgl: null, simple: "debian" },
  "fedora.svg": { svgl: null, simple: "fedora" },
  "opensuse.svg": { svgl: null, simple: "opensuse" },
  "kali.svg": { svgl: null, simple: "kalilinux" },
  "arch.svg": { svgl: null, simple: "archlinux" },
  "alpine.svg": { svgl: null, simple: "alpinelinux" },
  "ubuntu.svg": { svgl: "ubuntu", simple: "ubuntu" },
  "redhat.svg": { svgl: null, simple: "redhat" },
  "aws.svg": { svgl: "amazon web services", simple: "amazonwebservices" },
};

const svglCat = (await fetch("https://api.svgl.app").then((r) =>
  r.json(),
)) as SvglEntry[];

mkdirSync("src/data/xz-icons", { recursive: true });

let ok = 0;
let miss = 0;
for (const [outName, { svgl, simple }] of Object.entries(WANTED)) {
  let svg: string | null = null;
  let source = "";

  if (svgl) {
    const hit = svglCat.find((e) =>
      e.title.toLowerCase().includes(svgl.toLowerCase()),
    );
    if (hit) {
      const url = typeof hit.route === "string" ? hit.route : hit.route.light;
      svg = await fetch(url).then((r) => r.text());
      source = `svgl.app (${hit.title})`;
    }
  }

  if (!svg) {
    const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${simple}.svg`;
    const res = await fetch(url);
    if (res.ok) {
      svg = await res.text();
      source = `simple-icons (${simple})`;
    }
  }

  if (!svg) {
    console.warn(`MISS ${outName} - no source matched`);
    miss++;
    continue;
  }

  writeFileSync(`src/data/xz-icons/${outName}`, svg);
  console.log(`wrote ${outName} ← ${source}`);
  ok++;
}

console.log(`\n${ok} icons fetched, ${miss} missing.`);
if (miss > 0) process.exit(1);
