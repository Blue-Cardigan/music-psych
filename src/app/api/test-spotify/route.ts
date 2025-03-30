import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    // Test search API
    const searchResponse = await fetch(
      'https://api.spotify.com/v1/search?q=track:Shape%20of%20You%20artist:Ed%20Sheeran&type=track&limit=1',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      return NextResponse.json({ error: 'Search API failed', details: error }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    const trackId = searchData.tracks.items[0]?.id;

    if (!trackId) {
      return NextResponse.json({ error: 'No track found' }, { status: 404 });
    }

    // Test playback API
    const playbackResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!playbackResponse.ok) {
      const error = await playbackResponse.json();
      return NextResponse.json({ error: 'Playback API failed', details: error }, { status: playbackResponse.status });
    }

    const playbackData = await playbackResponse.json();

    return NextResponse.json({
      success: true,
      search: searchData,
      playback: playbackData,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 