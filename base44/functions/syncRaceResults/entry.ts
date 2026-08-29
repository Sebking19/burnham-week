import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fetchPage, decode } from '../../shared/burnhamFetch.ts';

const INDEX_URL = 'https://www.burnhamweek.com/results-2026/';
const BACKOFF_KEY = 'results_sync_backoff';

async function getBackoff(base44) {
  const rows = await base44.asServiceRole.entities.SettingsConfig.filter({ key: BACKOFF_KEY });
  if (!rows.length) return { record: null, until: 0, streak: 0 };
  let parsed = { until: 0, streak: 0 };
  try {
    parsed = JSON.parse(rows[0].value);
  } catch { /* fresh start */ }
  return { record: rows[0], until: parsed.until || 0, streak: parsed.streak || 0 };
}

async function setBackoff(base44, record, until, streak) {
  const value = JSON.stringify({ until, streak });
  if (record) {
    await base44.asServiceRole.entities.SettingsConfig.update(record.id, { key: BACKOFF_KEY, value });
  } else {
    await base44.asServiceRole.entities.SettingsConfig.create({ key: BACKOFF_KEY, value });
  }
}

// Escalating cooldown: 2, 4, 8, then 15 minutes per consecutive stall.
async function registerStall(base44, backoff) {
  const streak = backoff.streak + 1;
  const minutes = Math.min(2 ** streak, 15);
  const until = Date.now() + minutes * 60 * 1000;
  await setBackoff(base44, backoff.record, until, streak);
  return minutes;
}

function isRateLimited(err) {
  return /202\/429|unreachable|429/i.test(err.message || '');
}

// Series codes embedded in the Sailwave file names, e.g. 2025BHSquib.htm
const SERIES_LABELS = {
  BH: 'Bank Holiday',
  MW: 'Mid Week',
  TD: 'Town Days',
  WP: "Week's Points",
};

function seriesOf(url) {
  const m = /\/(\d{4})(BH|MW|TD|WP)/.exec(url);
  if (!m) return '';
  return `${SERIES_LABELS[m[2]]} ${m[1]}`;
}

// Links on the results index that point at a Sailwave results page.
function parseIndex(html) {
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a[^>]*href="([^"]*\/results\/2026results\/[^"]+\.htm)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = m[1].startsWith('http') ? m[1] : 'https://www.burnhamweek.com' + m[1];
    let title = decode(m[2]);
    if (!title || seen.has(url)) continue;
    seen.add(url);
    const series = seriesOf(url);
    if (series) title = `${title} – ${series}`;
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
  let changed;
  if (existing.length) {
    // Compare standings only — fetched_at always differs.
    changed = JSON.stringify(existing[0].rows || []) !== JSON.stringify(rows);
    await base44.asServiceRole.entities.RaceResult.update(existing[0].id, data);
  } else {
    changed = rows.length > 0;
    await base44.asServiceRole.entities.RaceResult.create(data);
  }
  return { count: rows.length, changed };
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

    // Throttle: skip the run entirely while cooling down after a rate-limit stall.
    const backoff = await getBackoff(base44);
    if (!body.force && Date.now() < backoff.until) {
      return Response.json({
        ok: true,
        skipped: true,
        cooldown_until: new Date(backoff.until).toISOString(),
        changed_count: 0,
      });
    }

    let entries;
    try {
      entries = parseIndex(await fetchPage(indexUrl));
    } catch (err) {
      if (isRateLimited(err)) {
        const minutes = await registerStall(base44, backoff);
        return Response.json({ ok: true, stalled: true, cooldown_minutes: minutes, changed_count: 0 });
      }
      throw err;
    }
    if (!entries.length) return Response.json({ ok: true, published: false, synced: 0 });

    // Refresh the pages that are most out of date first, a few per run.
    const stored = await base44.asServiceRole.entities.RaceResult.list();
    const stamp = {};
    for (const r of stored) stamp[r.source_url] = r.fetched_at || '';
    entries.sort((a, b) => (stamp[a.url] || '').localeCompare(stamp[b.url] || ''));

    const results = {};
    const changedClasses = [];
    let stalled = false;
    for (const entry of entries.slice(0, limit)) {
      try {
        const outcome = await syncOne(base44, entry);
        results[entry.title] = outcome.count;
        if (outcome.changed) changedClasses.push(entry.title);
      } catch (err) {
        results[entry.title] = `failed: ${err.message}`;
        if (isRateLimited(err)) {
          stalled = true;
          break; // stop hammering the site, cool down instead
        }
      }
    }

    let cooldownMinutes = 0;
    if (stalled) {
      cooldownMinutes = await registerStall(base44, backoff);
    } else if (backoff.streak > 0) {
      await setBackoff(base44, backoff.record, 0, 0); // healthy run — reset the throttle
    }

    return Response.json({
      ok: true,
      published: true,
      total_pages: entries.length,
      results,
      stalled,
      cooldown_minutes: cooldownMinutes,
      changed_classes: changedClasses,
      changed_count: changedClasses.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}