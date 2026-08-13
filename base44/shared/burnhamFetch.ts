// Shared fetch/clean helpers for burnhamweek.com.
// The site sits behind a SiteGround bot check that answers plain requests with a JavaScript
// captcha page, so we fall back to a rendering reader service that returns the real HTML.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-GB,en;q=0.9',
};

export async function fetchPage(url) {
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

export function decode(raw) {
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