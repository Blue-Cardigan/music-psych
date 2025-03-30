'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAccessToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { findSpotifySong } from '@/lib/song_name_mapping';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RecommendedSong {
  uri: string;
  title: string;
  artist: string;
  albumArt: string;
  similarity_score?: number;
}

interface SupabaseSong {
  spotify_id: string;
  title: string;
  artist: string;
  album_art_url: string;
  uri: string;
}

const findSongInSupabase = async (title: string, artist: string): Promise<SupabaseSong | null> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('title', title)
    .eq('artist', artist)
    .limit(1)
    .single();

  if (error) {
    console.error('Error searching Supabase:', error);
    return null;
  }

  return data;
};

export default function MoodPage() {
  const router = useRouter();
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router, isClient]);

  const getRandomSong = async (): Promise<RecommendedSong> => {
    const response = await fetch('/api/random-song');
    if (!response.ok) {
      throw new Error('Failed to get random song');
    }
    return response.json();
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      let song: RecommendedSong;

      try {
        // First try the FastAPI endpoint
        const response = await fetch('http://localhost:8000/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'http://localhost:3000'
          },
          mode: 'cors',
          credentials: 'include',
          body: JSON.stringify({ mood })
        });

        if (!response.ok) {
          throw new Error(`Failed to get song recommendation: ${response.status}`);
        }

        const data = await response.json();
        console.log('FastAPI response:', data);
        
        // Extract title from song_file if title is empty
        const title = data.title || data.song_file.replace('.csv', '');
        
        // Find the Spotify version of the song
        const spotifySong = findSpotifySong(title, data.artist);
        console.log('Spotify song mapping result:', spotifySong);
        
        if (!spotifySong) {
          throw new Error('Could not find Spotify version of song');
        }

        // Find the song in Supabase using the Spotify title
        const supabaseSong = await findSongInSupabase(spotifySong.title, spotifySong.artist);
        
        if (!supabaseSong) {
          throw new Error('Song not found in database');
        }

        song = {
          uri: supabaseSong.uri,
          title: supabaseSong.title,
          artist: supabaseSong.artist,
          albumArt: supabaseSong.album_art_url,
          similarity_score: data.similarity_score
        };
      } catch (apiError) {
        console.log('FastAPI endpoint failed, falling back to random song:', apiError);
        // Fallback to random song if FastAPI fails
        try {
          song = await getRandomSong();
        } catch (randomError) {
          console.error('Failed to get random song:', randomError);
          throw new Error('Failed to get song recommendation');
        }
      }
      
      // Store the recommended song in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('recommendedSong', JSON.stringify(song));
      }

      // Redirect to the listen page
      router.push('/listen');
    } catch (error) {
      console.error('Error getting song recommendation:', error);
      setError('Failed to get song recommendation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How are you feeling?
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Share your current mood and we&apos;ll find the perfect song for you.
          </p>
        </div>

        <form onSubmit={handleMoodSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="mood" className="sr-only">
              Your mood
            </label>
            <textarea
              id="mood"
              name="mood"
              rows={4}
              required
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Describe how you're feeling right now..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Get Song Recommendation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 