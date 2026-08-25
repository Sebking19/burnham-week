import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-GB,en;q=0.9',
};

// burnhamweek.com sits behind a SiteGround bot check that answers plain requests with a
// JavaScript captcha page. Try the page directly, and when the check blocks us fall back to a
// rendering reader service that returns the real HTML.
async function fetchPage(url) {
  const direct = await fetch(url, { headers: HEADERS });
  if (direct.ok) {
    const html = await direct.text();
    if (!/sgcaptcha/.test(html)) return html;
  }

  let status = 0;
  for (const delay of [0, 3000, 8000]) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const reader = await fetch('https://r.jina.ai/' + url, {
      headers: { 'X-Return-Format': 'html', Accept: 'text/html' },
    });
    status = reader.status;
    if (reader.ok) return await reader.text();
  }
  throw new Error(`Website unreachable (${direct.status}/${status})`);
}

function decode(raw) {
  return String(raw || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;|&#039;|&#39;/g, "'")
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function freeText(html) {
  const m = /fc_free_text[\s\S]*?<div class="max__width">([\s\S]*?)<!-- max__width -->/.exec(html);
  return m ? m[1] : html;
}

function linksIn(section) {
  const out = [];
  for (const m of section.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const title = decode(m[2]);
    if (title) out.push({ title, url: m[1] });
  }
  return out;
}

function dedupe(items, field) {
  const seen = new Set();
  return items.filter((i) => {
    const k = i[field];
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseNews(html) {
  const items = [];
  for (const block of html.split('<article>').slice(1)) {
    const link = /href="(https:\/\/www\.burnhamweek\.com\/[^"]+)"/.exec(block);
    const title = /<h3><a[^>]*>([\s\S]*?)<\/a><\/h3>/.exec(block);
    const img = /<img src="([^"]+)"/.exec(block);
    const date = /calendar-outline"><\/i>([^<]+)</.exec(block);
    if (link && title) {
      items.push({
        title: decode(title[1]),
        url: link[1],
        subtitle: date ? decode(date[1]) : undefined,
        image_url: img ? img[1] : undefined,
      });
    }
  }
  return dedupe(items, 'url').slice(0, 8);
}

function parseFleets(html) {
  const items = [];
  for (const m of html.matchAll(/<a[^>]*href="(https:\/\/www\.burnhamweek\.com\/fleet\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const title = decode(m[2]);
    if (title) items.push({ title, url: m[1] });
  }
  return dedupe(items, 'url');
}

const NAV_PATHS = /\/(news|fleets?|sponsors|social|courses|results|entry|contact|notice-board|privacy|about|shop|category|author|tag|feed)/i;

function parseDocuments(html) {
  const items = [];
  // Site navigation sits above the page heading, so start reading at the heading.
  const start = html.search(/<h1[^>]*>/i);
  const body = start > 0 ? html.slice(start) : html;
  for (const m of body.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = m[1];
    const inner = m[2];
    if (/privacy/i.test(url)) continue;
    if (/<img/i.test(inner)) continue; // sponsor logo links
    const title = decode(inner);
    if (!title || title.length < 3) continue;
    if (/^(home|get in touch|results|visitors|photo gallery)$/i.test(title)) continue;
    const isFile = /\/wp-content\/uploads\//i.test(url);
    const isPage = /burnhamweek\.com\//i.test(url) && !NAV_PATHS.test(url);
    if (!isFile && !isPage) continue;
    const ext = /\.(pdf|docx?|xlsx?)(\?|$)/i.exec(url);
    items.push({ title, url, subtitle: ext ? ext[1].toUpperCase() : undefined });
  }
  return dedupe(items, 'url').slice(0, 25);
}

function parseCourses(html) {
  const heading = /<h1>([\s\S]*?)<\/h1>/.exec(html);
  const section = freeText(html);
  const body = decode(section.replace(/<a[\s\S]*?<\/a>/g, ' '));
  const items = [];
  if (heading) items.push({ title: decode(heading[1]), subtitle: body || undefined });
  return items.concat(dedupe(linksIn(section), 'url'));
}

function prettyName(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const base = host.split('.')[0].replace(/-/g, ' ');
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Burnham Week sponsor';
  }
}

function parseSponsors(html) {
  const items = [];
  for (const m of html.matchAll(/<div class="carousel_image[^"]*"[^>]*>\s*(?:<a[^>]*href="([^"]*)"[^>]*>)?\s*<img src="([^"]+)"/g)) {
    const link = m[1] || undefined;
    items.push({
      title: link ? prettyName(link) : 'Burnham Week sponsor',
      url: link,
      image_url: m[2],
    });
  }
  return dedupe(items, 'image_url');
}

function parseSocial(html) {
  const section = freeText(html);
  const items = [];
  for (const line of section.split(/<br\s*\/?>|<\/p>/)) {
    const label = decode(line);
    if (!label) continue;
    const link = /href="([^"]+)"/.exec(line);
    items.push({ title: label, url: link ? link[1] : undefined });
  }
  return items.slice(0, 12);
}

const SOURCES = {
  news: { url: 'https://www.burnhamweek.com/news/', parse: parseNews },
  fleets: { url: 'https://www.burnhamweek.com/fleets/', parse: parseFleets },
  documents: { url: 'https://www.burnhamweek.com/notice-board-2026/', parse: parseDocuments },
  courses: { url: 'https://www.burnhamweek.com/courses-2/', parse: parseCourses },
  sponsors: { url: 'https://www.burnhamweek.com/sponsors/', parse: parseSponsors },
  social: { url: 'https://www.burnhamweek.com/social/', parse: parseSocial },
};

async function syncKey(base44, key) {
  const source = SOURCES[key];
  const items = source.parse(await fetchPage(source.url));
  if (!items.length) throw new Error(`No items parsed for ${key}`);

  const data = {
    key,
    source_url: source.url,
    items,
    fetched_at: new Date().toISOString(),
  };
  const existing = await base44.asServiceRole.entities.SiteContent.filter({ key });
  // Detect real content changes (ignore fetched_at) so workflows can notify members.
  const strip = (list) => JSON.stringify((list || []).map(({ title, subtitle, url }) => ({ title: title ?? null, subtitle: subtitle ?? null, url: url ?? null })));
  const changed = existing.length ? strip(existing[0].items) !== strip(items) : false;
  if (existing.length) {
    await base44.asServiceRole.entities.SiteContent.update(existing[0].id, data);
  } else {
    await base44.asServiceRole.entities.SiteContent.create(data);
  }
  return { count: items.length, changed };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    // Signed-in callers must be admins; unauthenticated calls come from the scheduled workflow.
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let keys;
    if (body && body.key && SOURCES[body.key]) {
      keys = [body.key];
    } else if (body && body.all) {
      keys = Object.keys(SOURCES);
    } else {
      // Rotate: refresh whichever block is the most out of date.
      const records = await base44.asServiceRole.entities.SiteContent.list();
      const stamp = {};
      for (const r of records) stamp[r.key] = r.fetched_at || '';
      const sorted = Object.keys(SOURCES).sort((a, b) => (stamp[a] || '').localeCompare(stamp[b] || ''));
      keys = [sorted[0]];
    }

    const results = {};
    const changedKeys = [];
    for (const key of keys) {
      try {
        const { count, changed } = await syncKey(base44, key);
        results[key] = count;
        if (changed) changedKeys.push(key);
      } catch (err) {
        results[key] = `failed: ${err.message}`;
      }
    }

    return Response.json({ ok: true, results, changed_keys: changedKeys });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}