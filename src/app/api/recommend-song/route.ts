import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const { mood } = await request.json();

    if (!mood) {
      return NextResponse.json(
        { error: 'Mood is required' },
        { status: 400 }
      );
    }

    // Search for songs based on the mood
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for songs');
    }

    const searchData = await searchResponse.json();
    const track = searchData.tracks.items[0];

    if (!track) {
      return NextResponse.json(
        { error: 'No songs found' },
        { status: 404 }
      );
    }

    // Return the song details
    return NextResponse.json({
      uri: track.uri,
      title: track.name,
      artist: track.artists[0].name,
      albumArt: track.album.images[0].url
    });
  } catch (error) {
    console.error('Error recommending song:', error);
    return NextResponse.json(
      { error: 'Failed to recommend song' },
      { status: 500 }
    );
  }
} 