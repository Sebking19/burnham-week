// Shared fetch/clean helpers for burnhamweek.com.
// The site sits behind a SiteGround bot check that answers plain requests with a JavaScript
// captcha page, so we fall back to a rendering reader service that returns the real HTML.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-GB,en;q=0.9',
};

export async function fetchPage(url) {
  // The bot check is intermittent, so try the site itself a few times before the reader service.
  let direct = { status: 0 };
  for (const delay of [0, 1500, 4000]) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      direct = await fetch(url, { headers: HEADERS });
      if (direct.ok) {
        const html = await direct.text();
        if (!/sgcaptcha/.test(html)) return html;
        console.log(`bot check on ${url}`);
      } else {
        console.log(`direct ${direct.status} on ${url}`);
      }
    } catch (e) {
      console.log(`direct error on ${url}: ${e.message}`);
    }
  }

  // Mirrors that fetch the page for us when the bot check keeps blocking our own requests.
  const mirrors = [
    { url: 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url), headers: {} },
    { url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url), headers: {} },
    { url: 'https://r.jina.ai/' + url, headers: { 'X-Return-Format': 'html', Accept: 'text/html' } },
  ];

  let status = 0;
  for (const mirror of mirrors) {
    try {
      const reader = await fetch(mirror.url, { headers: mirror.headers });
      status = reader.status;
      if (reader.ok) {
        const html = await reader.text();
        if (html && !/sgcaptcha/.test(html)) return html;
      }
      console.log(`mirror ${status} on ${url}`);
    } catch (e) {
      console.log(`mirror error on ${url}: ${e.message}`);
    }
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