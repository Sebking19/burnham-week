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

// The WordPress index page is often blocked by the site's bot check, while the Sailwave
// result files themselves always load — so the 2026 pages are listed here directly.
const BASE = 'https://burnhamweek.com/results/2026results/';
const KNOWN_2026 = [
  ['2026BH707.htm', '707'],
  ['2026BHBeastie.htm', 'Beastie'],
  ['2026BHClass12.htm', 'IRC Class 1 & 2'],
  ['2026BHClass5.htm', 'Class 5'],
  ['2026BHClass6.htm', 'Class 6'],
  ['2026BHDinghyFast.htm', 'Dinghy Fast Handicap'],
  ['2026BHDinghySlow.htm', 'Dinghy Slow Handicap'],
  ['2026BHDragon.htm', 'Dragon'],
  ['2026BHECOD.htm', 'ECOD'],
  ['2026BHLaser.htm', 'ILCA 4-6-7 and Laser'],
  ['2026BHOsprey.htm', 'Osprey'],
  ['2026BHPhantom.htm', 'Phantom'],
  ['2026BHRBOD.htm', 'RBOD'],
  ['2026BHRCOD.htm', 'RCOD'],
  ['2026BHRSElite.htm', 'Elite One Design'],
  ['2026BHSquib.htm', 'Squib'],
].map(([file, name]) => {
  const url = BASE + file;
  return { url, title: `${name} – ${seriesOf(url)}` };
});

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

    // Start from the known 2026 pages, then add anything extra the index lists (if it loads).
    const entries = [...KNOWN_2026];
    const seenUrls = new Set(entries.map((e) => e.url));
    try {
      for (const e of parseIndex(await fetchPage(indexUrl))) {
        if (!seenUrls.has(e.url)) {
          seenUrls.add(e.url);
          entries.push(e);
        }
      }
    } catch { /* index blocked — the known list is enough */ }

    // Refresh the pages that are most out of date first, a few per run.
    const stored = await base44.asServiceRole.entities.RaceResult.list();
    const stamp = {};
    for (const r of stored) stamp[r.source_url] = r.fetched_at || '';
    entries.sort((a, b) => (stamp[a.url] || '').localeCompare(stamp[b.url] || ''));

    const results = {};
    const changedClasses = [];
    let stalled = false;
    let misses = 0;
    for (const entry of entries.slice(0, limit)) {
      try {
        const outcome = await syncOne(base44, entry);
        results[entry.title] = outcome.count;
        if (outcome.changed) changedClasses.push(entry.title);
        misses = 0;
      } catch (err) {
        results[entry.title] = `failed: ${err.message}`;
        // One awkward page shouldn't end the run; several in a row means the site is blocking us.
        if (isRateLimited(err) && ++misses >= 3) {
          stalled = true;
          break;
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