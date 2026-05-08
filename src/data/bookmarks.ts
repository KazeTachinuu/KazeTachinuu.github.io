// Curated bookmarks — open-source tools that do one thing well.

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
        description: 'Universal document converter, every format to every format',
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
        description: 'CLI image manipulation toolkit — resize, watermark, convert',
      },
      {
        name: 'Upscayl',
        url: 'https://upscayl.org/',
        description: 'AI image upscaling, fully offline desktop app',
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
    ],
  },
  {
    title: 'Dev & Security',
    bookmarks: [
      {
        name: 'CyberChef',
        url: 'https://gchq.github.io/CyberChef/',
        description: 'The cyber Swiss army knife — encode, decode, transform',
      },
      {
        name: 'IT-Tools',
        url: 'https://it-tools.tech/',
        description: 'Bundle of small dev utilities, all client-side',
      },
      {
        name: 'regexr',
        url: 'https://regexr.com/',
        description: 'Regex playground with live explanations',
      },
    ],
  },
  {
    title: 'Files & Sharing',
    bookmarks: [
      {
        name: '0x0.st',
        url: 'https://0x0.st/',
        description: 'Null-pointer file paste — single-shot, no account',
      },
      {
        name: 'OnionShare',
        url: 'https://onionshare.org/',
        description: 'Anonymous file sharing through Tor',
      },
      {
        name: 'Send',
        url: 'https://send.tuta.com/',
        description: 'End-to-end encrypted file transfer (Firefox Send fork)',
      },
    ],
  },
];
