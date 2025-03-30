const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
const redirectUri = 'http://localhost:3000/api/auth/callback/spotify';

if (!clientId) {
  throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not defined');
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('NEXT_PUBLIC_APP_URL is not defined');
}

export const scopes = [
  'user-read-private',
  'user-read-email',
  'streaming',
  'user-read-playback-state',
];

export function generateCodeVerifier(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function redirectToAuthCodeFlow() {
  const verifier = generateCodeVerifier(128);
  const state = generateCodeVerifier(16);

  // Store verifier in a cookie
  document.cookie = `code_verifier=${verifier}; path=/; max-age=3600; SameSite=Lax`;

  generateCodeChallenge(verifier).then(challenge => {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('response_type', 'code');
    params.append('redirect_uri', redirectUri);
    params.append('scope', scopes.join(' '));
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', challenge);
    params.append('state', state);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  });
}

export async function searchTrack(query: string, accessToken: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to search track: ${error.error.message}`);
  }

  const data = await response.json();
  return data.tracks.items[0];
} 