import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fetchPage, decode } from '../../shared/burnhamFetch.ts';

const INDEX_URL = 'https://www.burnhamweek.com/results-2026/';

// Links on the results index that point at a Sailwave results page.
function parseIndex(html) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a[^>]*href="([^"]*\/results\/\d{4}results\/[^"]+\.htm)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = m[1].startsWith('http') ? m[1] : 'https://www.burnhamweek.com' + m[1];
    const title = decode(m[2]);
    if (!title || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, title });
  }
  return out;
}

function cellsOf(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => decode(c[1]));
}

// Sailwave pages start with the overall standings table; that is the one we keep.
function parseStandings(html) {
  const table = /<table[\s\S]*?<\/table>/i.exec(html);
  if (!table) return [];
  const rows = [...table[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => cellsOf(r[1]));
  let header = null;
  const out = [];
  for (const cells of rows) {
    if (!cells.length) continue;
    const lower = cells.map((c) => c.toLowerCase().replace(/\s+/g, ''));
    if (!header) {
      if (lower.includes('helmname') || lower.includes('rank')) header = lower;
      continue;
    }
    const at = (name) => {
      const i = header.indexOf(name);
      return i >= 0 && i < cells.length ? cells[i] : '';
    };
    const row = {
      rank: at('rank'),
      sail_no: at('sailno'),
      boat: at('boat'),
      club: at('club'),
      helm: at('helmname'),
      crew: at('crewname'),
      nett: at('nett'),
      total: at('total'),
    };
    if (row.helm || row.boat) out.push(row);
  }
  return out;
}

async function syncOne(base44, entry) {
  const rows = parseStandings(await fetchPage(entry.url));
  const data = {
    class_name: entry.title,
    source_url: entry.url,
    rows,
    fetched_at: new Date().toISOString(),
  };
  const existing = await base44.asServiceRole.entities.RaceResult.filter({ source_url: entry.url });
  if (existing.length) {
    await base44.asServiceRole.entities.RaceResult.update(existing[0].id, data);
  } else {
    await base44.asServiceRole.entities.RaceResult.create(data);
  }
  return rows.length;
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

    const indexUrl = body.index_url || INDEX_URL;
    const limit = Number(body.limit) || 6;

    const entries = parseIndex(await fetchPage(indexUrl));
    if (!entries.length) return Response.json({ ok: true, published: false, synced: 0 });

    // Refresh the pages that are most out of date first, a few per run.
    const stored = await base44.asServiceRole.entities.RaceResult.list();
    const stamp = {};
    for (const r of stored) stamp[r.source_url] = r.fetched_at || '';
    entries.sort((a, b) => (stamp[a.url] || '').localeCompare(stamp[b.url] || ''));

    const results = {};
    for (const entry of entries.slice(0, limit)) {
      try {
        results[entry.title] = await syncOne(base44, entry);
      } catch (err) {
        results[entry.title] = `failed: ${err.message}`;
      }
    }

    return Response.json({ ok: true, published: true, total_pages: entries.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}