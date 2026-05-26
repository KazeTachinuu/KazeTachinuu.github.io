/**
 * Curated bookmarks — one pick per job.
 * The tool I'd actually name if asked.
 */

export type Bookmark = {
  name: string;
  url: string;
  description?: string;
};

export const BOOKMARKS = {
  "Code & Shell": [
    {
      name: "ray.so",
      url: "https://ray.so/",
      description: "Code screenshots, fast and sane",
    },
    {
      name: "regex101",
      url: "https://regex101.com/",
      description: "Regex tester with token-by-token explainer",
    },
  ],

  "Reverse Engineering": [
    {
      name: "CyberChef",
      url: "https://gchq.github.io/CyberChef/",
      description: "Cyber Swiss army knife — 477 ops, all local",
    },
    {
      name: "Compiler Explorer",
      url: "https://godbolt.org/",
      description: "See the assembly your compiler emits",
    },
    {
      name: "dogbolt",
      url: "https://dogbolt.org/",
      description: "Every decompiler, side by side, on one binary",
    },
    {
      name: "felixcloutier x86",
      url: "https://www.felixcloutier.com/x86/",
      description: "Searchable Intel SDM, one instruction per page",
    },
    {
      name: "asm-lookup",
      url: "/tools/asm-lookup",
      description: "AT&T x86-64 instruction lookup — mine",
    },
    {
      name: "syscalls.mebeim",
      url: "https://syscalls.mebeim.net/",
      description: "Linux syscall tables, every arch and kernel",
    },
    {
      name: "Hashlookup",
      url: "https://hashlookup.circl.lu/",
      description: "Hash known-good lookup against NSRL — by CIRCL",
    },
  ],

  "CTF & Crypto": [
    {
      name: "dcode.fr",
      url: "https://www.dcode.fr/en",
      description: "900+ ciphers and codes, auto-identified",
    },
    {
      name: "CrackStation",
      url: "https://crackstation.net/",
      description: "Hash lookup before firing up hashcat",
    },
    {
      name: "Aperi'Solve",
      url: "https://www.aperisolve.com/",
      description: "Drop an image, every stego tool runs on it",
    },
    {
      name: "libc.rip",
      url: "https://libc.rip/",
      description: "Identify libc from leaked offsets, for ret2libc",
    },
    {
      name: "GTFOBins",
      url: "https://gtfobins.github.io/",
      description: "Unix binaries for privesc and bypass",
    },
  ],

  Drawing: [
    {
      name: "Excalidraw",
      url: "https://excalidraw.com/",
      description: "Hand-drawn whiteboard, my default sketch",
    },
    {
      name: "Mermaid Live",
      url: "https://mermaid.live/",
      description: "Diagrams from text that render in any README",
    },
    {
      name: "Asciiflow",
      url: "https://asciiflow.com/",
      description: "ASCII art for code comments and READMEs",
    },
  ],

  Images: [
    {
      name: "Squoosh",
      url: "https://squoosh.app/",
      description: "In-browser compression, A/B every codec",
    },
    {
      name: "Photopea",
      url: "https://www.photopea.com/",
      description: "Photoshop in the browser, opens PSDs",
    },
    {
      name: "Yandex Images",
      url: "https://yandex.com/images/",
      description: "Reverse image search — faces and EU/RU coverage",
    },
  ],

  "PDF & Documents": [
    {
      name: "LocalPDF",
      url: "https://localpdf.online/",
      description: "Merge, split, watermark, OCR — all browser-local",
    },
    {
      name: "MuPDF WebViewer",
      url: "https://webviewer.mupdf.com/",
      description: "Annotate, sign, truly destructive redaction — all local",
    },
    {
      name: "Pandora",
      url: "https://pandora.circl.lu/",
      description: "Drop a suspicious file, every analyzer runs on it — by CIRCL",
    },
  ],

  "Privacy & Hide": [
    {
      name: "SimpleLogin",
      url: "https://simplelogin.io/",
      description: "Long-term email aliases I keep around",
    },
    {
      name: "mail.tm",
      url: "https://mail.tm/",
      description: "Throwaway inbox when a site demands an email",
    },
    {
      name: "nadanada.me",
      url: "https://nadanada.me/",
      description: "Anonymous UK phone numbers, crypto-pay",
    },
    {
      name: "This Person Does Not Exist",
      url: "https://thispersondoesnotexist.com/",
      description: "StyleGAN face per refresh — the persona photo",
    },
    {
      name: "ipleak.net",
      url: "https://ipleak.net/",
      description: "IP, DNS, WebRTC — what your browser is leaking",
    },
  ],

  Leaks: [
    {
      name: "HaveIBeenPwned",
      url: "https://haveibeenpwned.com/",
      description: "Free email and domain breach lookup — the baseline",
    },
    {
      name: "leakradar.io",
      url: "https://leakradar.io/",
      description: "Plain-text creds from stealer logs and breach DBs — pay-per-unlock, Paris-based",
    },
    {
      name: "HudsonRock Cavalier",
      url: "https://cavalier.hudsonrock.com/",
      description: "Stealer-log forensics — which malware, what machine, when",
    },
    {
      name: "DeHashed",
      url: "https://dehashed.com/",
      description: "Credential breach search across leaked databases",
    },
    {
      name: "LeakIX",
      url: "https://leakix.net/",
      description: "Exposed services, open databases, public leaks",
    },
  ],

  OSINT: [
    {
      name: "WhatsMyName",
      url: "https://whatsmyname.app/",
      description: "Username search across 600+ sites",
    },
    {
      name: "crt.sh",
      url: "https://crt.sh/",
      description: "Subdomain enum via Certificate Transparency",
    },
    {
      name: "urlscan.io",
      url: "https://urlscan.io/",
      description: "Detonate a URL, see its requests and behavior",
    },
    {
      name: "Lookyloo",
      url: "https://lookyloo.circl.lu/",
      description: "Capture a URL, visualize its redirect tree — by CIRCL",
    },
    {
      name: "societe.ninja",
      url: "https://societe.ninja/",
      description: "French company actes and balance sheets — free, no paywall, by CYBERTRON",
    },
    {
      name: "Wayback Machine",
      url: "https://web.archive.org/",
      description: "View a page as it existed on any date",
    },
  ],

} as const satisfies Record<string, readonly Bookmark[]>;
