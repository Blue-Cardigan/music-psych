import SpotifyWebApi from 'spotify-web-api-node';

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET as string;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const redirectUri = `${appUrl}/api/auth/callback/spotify`;

if (!clientId) {
  throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not defined');
}

if (!clientSecret) {
  throw new Error('SPOTIFY_CLIENT_SECRET is not defined');
}

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
});

export async function getAccessToken(code: string, codeVerifier: string) {
  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('code_verifier', codeVerifier);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export default spotifyApi; 