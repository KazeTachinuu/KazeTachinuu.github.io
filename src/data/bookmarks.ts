// Curated bookmarks — open-source tools that do ONE thing, and do it great.

export type Bookmark = {
  name: string;
  url: string;
  description?: string;
};

export type BookmarkCategory = {
  title: string;
  bookmarks: Bookmark[];
};

export const BOOKMARKS: BookmarkCategory[] = [
  {
    title: 'PDF & Documents',
    bookmarks: [
      {
        name: 'Stirling-PDF',
        url: 'https://github.com/Stirling-Tools/Stirling-PDF',
        description: 'Self-hosted PDF toolkit — watermark, merge, split, redact',
      },
      {
        name: 'OCRmyPDF',
        url: 'https://github.com/ocrmypdf/OCRmyPDF',
        description: 'Adds a searchable OCR text layer to scanned PDFs',
      },
      {
        name: 'Pandoc',
        url: 'https://pandoc.org/',
        description: 'Universal document converter — every format to every format',
      },
    ],
  },
  {
    title: 'Images',
    bookmarks: [
      {
        name: 'Squoosh',
        url: 'https://squoosh.app/',
        description: 'In-browser image compression with side-by-side preview',
      },
      {
        name: 'ImageMagick',
        url: 'https://imagemagick.org/',
        description: 'CLI image manipulation — resize, watermark, convert',
      },
    ],
  },
  {
    title: 'Diagrams',
    bookmarks: [
      {
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        description: 'Hand-drawn-style virtual whiteboard',
      },
      {
        name: 'draw.io',
        url: 'https://app.diagrams.net/',
        description: 'Comprehensive diagramming, runs in-browser',
      },
      {
        name: 'Mermaid Live',
        url: 'https://mermaid.live/',
        description: 'Generate flowcharts and sequence diagrams from text',
      },
      {
        name: 'Asciiflow',
        url: 'https://asciiflow.com/',
        description: 'Draw ASCII-art diagrams to drop straight into READMEs',
      },
    ],
  },
  {
    title: 'Code',
    bookmarks: [
      {
        name: 'carbon.now.sh',
        url: 'https://carbon.now.sh/',
        description: 'Beautiful code screenshots with syntax themes',
      },
      {
        name: 'shellcheck',
        url: 'https://www.shellcheck.net/',
        description: 'Static analysis for shell scripts, in your browser',
      },
      {
        name: 'explainshell',
        url: 'https://explainshell.com/',
        description: 'Paste any shell command, see each flag explained',
      },
      {
        name: 'regexr',
        url: 'https://regexr.com/',
        description: 'Regex playground with live tokenized explanations',
      },
    ],
  },
  {
    title: 'Reverse & CTF',
    bookmarks: [
      {
        name: 'CyberChef',
        url: 'https://gchq.github.io/CyberChef/',
        description: 'The cyber Swiss army knife — encode, decode, transform',
      },
      {
        name: 'Compiler Explorer',
        url: 'https://godbolt.org/',
        description: 'Inspect the assembly your compiler emits, live',
      },
      {
        name: 'dogbolt',
        url: 'https://dogbolt.org/',
        description: 'Run a binary through every decompiler at once',
      },
      {
        name: 'Aperisolve',
        url: 'https://www.aperisolve.com/',
        description: 'Drop an image, get every steganography tool ran on it',
      },
    ],
  },
];
