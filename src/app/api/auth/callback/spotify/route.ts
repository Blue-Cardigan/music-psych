import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/spotify-server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  if (!state) {
    return NextResponse.redirect(new URL('/?error=no_state', request.url));
  }

  try {
    // Get the code verifier from cookies
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('code_verifier')?.value;
    
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    // Get the access token using the code and code verifier
    const accessToken = await getAccessToken(code, codeVerifier);
    
    // Create the redirect response to the mood page
    const response = NextResponse.redirect(new URL('/mood', request.url));
    
    // Clear the code verifier cookie
    response.cookies.delete('code_verifier');
    
    // Set the access token in a cookie with proper attributes
    response.cookies.set('spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour
    });

    // Add a script to set the token in sessionStorage
    const html = `
      <script>
        sessionStorage.setItem('spotify_access_token', '${accessToken}');
        window.location.href = '/mood';
      </script>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
  }
} 