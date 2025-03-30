'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { getAccessToken } from '@/lib/auth';

interface SpotifyPlayerProps {
  songUri: string;
  onSongComplete?: () => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyError {
  message: string;
  error?: {
    message: string;
  };
}

interface PlayerState {
  position: number;
  duration: number;
  paused: boolean;
  track: {
    name: string;
    artist: string;
    uri: string;
  };
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SpotifyPlayer({ songUri, onSongComplete }: SpotifyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showReadyCheck, setShowReadyCheck] = useState(true);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('SpotifyPlayer mounted');
    console.log('Song URI:', songUri);
    console.log('SDK Ready:', isSDKReady);
    
    if (!songUri) {
      console.error('No song URI provided');
      setError('No song selected');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error('No access token found');
      setError('Please log in to Spotify');
      return;
    }

    console.log('Access token found:', accessToken.substring(0, 10) + '...');

    // Initialize the player when the SDK is ready
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK is ready');
      setIsSDKReady(true);
      
      const player = new window.Spotify.Player({
        name: 'Mood Music Player',
        getOAuthToken: (cb: (token: string) => void) => {
          console.log('Getting OAuth token');
          cb(accessToken);
        },
        volume: 0.5
      });

      playerRef.current = player;

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
        setError('Failed to initialize player');
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        setError('Authentication failed');
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
        setError('Account validation failed');
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
        setError('Playback failed');
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: any) => {
        console.log('Player state changed:', state);
        if (state) {
          // Only update display if the current track matches the selected song URI
          if (state.track_window.current_track.uri === songUri) {
            setIsPlaying(!state.paused);
            setPlayerState({
              position: state.position,
              duration: state.duration,
              paused: state.paused,
              track: {
                name: state.track_window.current_track.name,
                artist: state.track_window.current_track.artists[0].name,
                uri: state.track_window.current_track.uri
              }
            });

            if (state.paused) {
              console.log('Song completed');
              onSongComplete?.();
            }
          }
        }
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        
        // Activate the element for mobile support
        player.activateElement().then(() => {
          console.log('Element activated');
        });

        // Transfer playback to this device and start playing
        const transferPlayback = async () => {
          try {
            // First, transfer playback to this device
            const transferResponse = await fetch('https://api.spotify.com/v1/me/player', {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                device_ids: [device_id],
                play: true
              })
            });

            if (!transferResponse.ok) {
              const errorData = await transferResponse.json().catch(() => ({})) as SpotifyError;
              console.error('Transfer playback error:', errorData);
              throw new Error(`Failed to transfer playback: ${errorData.error?.message || transferResponse.statusText}`);
            }

            console.log('Playback transferred successfully');

            // Wait a moment for the transfer to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Then start playing the song
            const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                uris: [songUri]
              })
            });

            if (!playResponse.ok) {
              const errorData = await playResponse.json().catch(() => ({})) as SpotifyError;
              console.error('Start playback error:', errorData);
              throw new Error(`Failed to start playback: ${errorData.error?.message || playResponse.statusText}`);
            }

            console.log('Song started playing');
          } catch (error: unknown) {
            console.error('Error in playback flow:', error);
            if (error instanceof Error) {
              setError(error.message);
            } else {
              setError('Failed to start playback');
            }
          }
        };

        transferPlayback();
      });

      // Connect to the player
      player.connect().then((success: boolean) => {
        if (success) {
          console.log('Successfully connected to Spotify!');
        } else {
          console.error('Failed to connect to Spotify');
          setError('Failed to connect to Spotify');
        }
      });
    };

    return () => {
      // Cleanup
      if (playerRef.current) {
        console.log('Disconnecting player');
        playerRef.current.disconnect();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [songUri, onSongComplete, isSDKReady]);

  // Update progress every second when playing
  useEffect(() => {
    if (isPlaying && playerState) {
      progressIntervalRef.current = setInterval(() => {
        setPlayerState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            position: Math.min(prev.position + 1000, prev.duration)
          };
        });
      }, 1000);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, playerState]);

  const togglePlayback = async () => {
    if (!deviceId || !playerRef.current) {
      console.log('Cannot toggle playback:', { deviceId, playerRef: !!playerRef.current });
      return;
    }
    
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error('No access token found for playback');
      return;
    }

    try {
      console.log('Attempting to toggle playback');
      await playerRef.current.togglePlay();
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
      setError('Failed to control playback');
    }
  };

  const handleReady = () => {
    setIsReady(true);
    setShowReadyCheck(false);
    // Start playback after a short delay
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.resume();
      }
    }, 1000);
  };

  const skipToEnd = async () => {
    if (!playerRef.current || !playerState) return;
    
    try {
      await playerRef.current.seek(playerState.duration - 1000); // Skip to last second
    } catch (error) {
      console.error('Error skipping to end:', error);
    }
  };

  // Update dark mode when playback state changes
  useEffect(() => {
    if (isPlaying) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, [isPlaying]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Dark mode overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-1000 ${
          isDarkMode ? 'opacity-90' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div className="w-full max-w-md mx-auto p-4 relative z-10">
        <Script
          src="https://sdk.scdn.co/spotify-player.js"
          strategy="afterInteractive"
          onLoad={() => console.log('Spotify SDK script loaded')}
          onError={(e) => console.error('Error loading Spotify SDK:', e)}
        />
        <div className={`rounded-lg shadow-lg p-6 transition-colors duration-1000 ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className="space-y-4">
            {/* Ready Check */}
            {showReadyCheck && !isPlaying && (
              <div className="text-center space-y-4">
                <h3 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Are you ready to begin?
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Once you start, the song will play without interruption.
                </p>
                <button
                  onClick={handleReady}
                  className={`px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-green-500 hover:bg-green-400' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  I'm Ready
                </button>
              </div>
            )}

            {/* Song Info */}
            {playerState && (
              <div className="text-center">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {playerState.track.name}
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {playerState.track.artist}
                </p>
              </div>
            )}

            {/* Progress Bar */}
            {playerState && (
              <div className="space-y-2">
                <div className={`h-1 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{ 
                      width: `${(playerState.position / playerState.duration) * 100}%`,
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
                <div className={`flex justify-between text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{formatTime(playerState.position)}</span>
                  <span>{formatTime(playerState.duration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {isPlaying && (
                <button
                  onClick={skipToEnd}
                  className={`text-xs px-3 py-1 rounded-full text-white transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  Skip to End
                </button>
              )}
              {!isPlaying && isReady && (
                <button
                  onClick={togglePlayback}
                  className={`flex items-center justify-center w-16 h-16 rounded-full text-white transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-green-500 hover:bg-green-400' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                  disabled={!deviceId || !isSDKReady}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 