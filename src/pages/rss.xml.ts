import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog', (e) => import.meta.env.DEV || !e.data.draft);
  const writeups = await getCollection(
    'writeups',
    (e) => (import.meta.env.DEV || !e.data.draft) && e.data.cat === 'chal',
  );

  const items = [
    ...blog.map((p) => ({
      title: p.data.title,
      pubDate: new Date(p.data.date),
      description: p.data.description ?? '',
      link: `/blog/${p.id}/`,
      categories: p.data.categories,
    })),
    ...writeups.map((w) => ({
      title: w.data.title,
      pubDate: w.data.date ? new Date(w.data.date) : new Date(),
      description: w.data.description ?? '',
      link: `/writeups/${w.id}/`,
      categories: w.data.categories ? [w.data.categories] : [],
    })),
  ].sort((a, b) => +b.pubDate - +a.pubDate);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items,
  });
}
