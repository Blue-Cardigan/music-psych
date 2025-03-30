'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAccessToken } from '@/lib/auth';

interface RecommendedSong {
  uri: string;
  title: string;
  artist: string;
  albumArt: string;
}

export default function MoodPage() {
  const router = useRouter();
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/recommend-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ mood })
      });

      if (!response.ok) {
        throw new Error('Failed to get song recommendation');
      }

      const song = await response.json();
      
      // Store the recommended song in sessionStorage
      const recommendedSong: RecommendedSong = {
        uri: song.uri,
        title: song.title,
        artist: song.artist,
        albumArt: song.albumArt
      };
      sessionStorage.setItem('recommendedSong', JSON.stringify(recommendedSong));

      // Redirect to the listen page
      router.push('/listen');
    } catch (error) {
      console.error('Error getting song recommendation:', error);
      setError('Failed to get song recommendation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How are you feeling?
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Share your current mood and we'll find the perfect song for you.
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