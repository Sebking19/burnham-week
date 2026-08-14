// Shared FCM HTTP v1 helpers — mints a Google OAuth2 access token from the
// service-account JSON secret and sends push messages.
import { secrets } from 'base44:runtime';

function b64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem) {
  const clean = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function getFcmAuth() {
  const sa = JSON.parse(secrets.get('FIREBASE_SERVICE_ACCOUNT_JSON'));
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));
  const input = header + '.' + claims;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(input));
  const jwt = input + '.' + b64url(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('FCM auth failed: ' + JSON.stringify(data));
  return { accessToken: data.access_token, projectId: sa.project_id };
}

// Sends one FCM message. Throws with .unregistered = true when the token is dead.
export async function sendFcmMessage(auth, deviceToken, title, body, data) {
  const res = await fetch(
    'https://fcm.googleapis.com/v1/projects/' + auth.projectId + '/messages:send',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          data: data || {},
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    const err = new Error('FCM send failed (' + res.status + '): ' + text);
    err.unregistered = res.status === 404 || text.includes('UNREGISTERED');
    throw err;
  }
}