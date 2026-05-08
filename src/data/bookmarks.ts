// Curated bookmarks — useful tools I keep coming back to.
// Each entry is a category with a list of links. Add freely.

export type Bookmark = {
  name: string;
  url: string;
  description?: string;
};

export type BookmarkCategory = {
  title: string;
  description?: string;
  bookmarks: Bookmark[];
};

export const BOOKMARKS: BookmarkCategory[] = [
  {
    title: 'PDF',
    description: 'Edit, merge, split, compress, OCR.',
    bookmarks: [
      { name: 'iLovePDF', url: 'https://www.ilovepdf.com/', description: 'Merge, split, compress, convert' },
      { name: 'PDF24 Tools', url: 'https://tools.pdf24.org/', description: 'All-in-one PDF toolkit, no signup' },
      { name: 'Sejda', url: 'https://www.sejda.com/', description: 'In-browser PDF editor' },
    ],
  },
  {
    title: 'Images',
    description: 'Compress, convert, remove background or watermarks.',
    bookmarks: [
      { name: 'Squoosh', url: 'https://squoosh.app/', description: 'Image compression in the browser' },
      { name: 'TinyPNG', url: 'https://tinypng.com/', description: 'PNG / JPG / WebP compression' },
      { name: 'remove.bg', url: 'https://www.remove.bg/', description: 'Background removal' },
      { name: 'Dewatermark', url: 'https://dewatermark.ai/', description: 'AI watermark removal' },
    ],
  },
  {
    title: 'File conversion',
    description: 'Convert anything to anything.',
    bookmarks: [
      { name: 'CloudConvert', url: 'https://cloudconvert.com/', description: '200+ formats, file & video' },
      { name: 'Convertio', url: 'https://convertio.co/', description: 'Quick browser conversions' },
    ],
  },
  {
    title: 'Dev & Security',
    description: 'Daily companions for hacking and dev.',
    bookmarks: [
      { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', description: 'The cyber Swiss army knife' },
      { name: 'regex101', url: 'https://regex101.com/', description: 'Regex builder & explainer' },
      { name: 'jwt.io', url: 'https://jwt.io/', description: 'Decode and verify JWTs' },
      { name: 'crontab.guru', url: 'https://crontab.guru/', description: 'Crontab expression editor' },
    ],
  },
  {
    title: 'Productivity',
    description: 'Drawing, sharing, quick utilities.',
    bookmarks: [
      { name: 'Excalidraw', url: 'https://excalidraw.com/', description: 'Hand-drawn-style diagrams' },
      { name: 'tldraw', url: 'https://www.tldraw.com/', description: 'Collaborative whiteboard' },
      { name: '0x0.st', url: 'https://0x0.st/', description: 'Null-pointer file sharing' },
    ],
  },
];
