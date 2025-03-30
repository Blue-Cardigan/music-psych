'use client';

import { useEffect, useState } from 'react';
import { redirectToAuthCodeFlow } from '@/lib/spotify';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isInitialRedirect } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If we're in the initial redirect state, wait a bit for the cookie to be set
      if (isInitialRedirect()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (isAuthenticated()) {
        router.push('/mood');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = () => {
    redirectToAuthCodeFlow();
  };

  if (isLoading) {
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
            Mood Music Research Project
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Participate in our study exploring the relationship between music and emotional states.
            Your input helps advance our understanding of music's impact on mood.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to the Study</h2>
          <p className="text-gray-600 mb-6">
            To participate in this study, we'll need access to your Spotify account to play the recommended music.
            This helps us ensure you're listening to the exact songs we want to study.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Connect with Spotify
          </button>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>This research project is designed to study the effects of music on emotional states.</p>
          <p className="mt-2">Your participation helps advance our understanding of music therapy and emotional well-being.</p>
        </div>
      </div>
    </main>
  );
}
