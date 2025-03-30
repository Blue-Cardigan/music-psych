'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import { isAuthenticated } from '@/lib/auth';
import Image from 'next/image';

interface RecommendedSong {
  uri: string;
  title: string;
  artist: string;
  albumArt: string;
}

export default function ListenPage() {
  const router = useRouter();
  const [recommendedSong, setRecommendedSong] = useState<RecommendedSong | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    // Get the recommended song from sessionStorage
    const songStr = sessionStorage.getItem('recommendedSong');
    if (!songStr) {
      router.push('/mood');
      return;
    }

    try {
      const song = JSON.parse(songStr);
      setRecommendedSong(song);
    } catch (error) {
      console.error('Error parsing recommended song:', error);
      setError('Failed to load recommended song');
    }
  }, [router]);

  const handleSongComplete = () => {
    router.push('/survey');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!recommendedSong) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Listen to Your Song
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Based on your mood, we recommend:
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <Image
                src={recommendedSong.albumArt}
                alt={recommendedSong.title}
                width={96}
                height={96}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {recommendedSong.title}
                </h2>
                <p className="text-gray-500">{recommendedSong.artist}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SpotifyPlayer
            songUri={recommendedSong.uri}
            onSongComplete={handleSongComplete}
          />
        </div>
      </div>
    </div>
  );
} 