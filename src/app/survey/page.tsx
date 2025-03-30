'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SurveyForm from '@/components/SurveyForm';

interface RecommendedSong {
  uri: string;
  name: string;
  artist: string;
}

export default function SurveyPage() {
  const [recommendedSong, setRecommendedSong] = useState<RecommendedSong | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a recommended song
    const song = sessionStorage.getItem('recommendedSong');
    if (!song) {
      router.push('/mood');
      return;
    }
    setRecommendedSong(JSON.parse(song));
  }, [router]);

  if (!recommendedSong) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Share Your Experience
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please tell us how the music affected your mood and emotional state.
            Your feedback is valuable for our research.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Song You Listened To</h2>
            <p className="text-gray-600">{recommendedSong.name} by {recommendedSong.artist}</p>
          </div>
          <SurveyForm songId={recommendedSong.uri} />
        </div>
      </div>
    </main>
  );
} 