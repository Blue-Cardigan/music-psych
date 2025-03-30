import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Get all song embeddings from Supabase
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, title, artist, embedding');

    if (error) throw error;

    // For now, we'll use a simple text similarity approach
    // In a production environment, you would want to use the same model as main.py
    const textWords = text.toLowerCase().split(' ');
    
    // Calculate a simple similarity score based on word overlap
    const songsWithScores = songs.map(song => {
      const songWords = (song.title + ' ' + song.artist).toLowerCase().split(' ');
      const overlap = textWords.filter((word: string) => songWords.includes(word)).length;
      const similarity = overlap / Math.max(textWords.length, songWords.length);
      
      return {
        ...song,
        similarity
      };
    });

    // Sort by similarity and get the best match
    const bestMatch = songsWithScores
      .sort((a, b) => b.similarity - a.similarity)[0];

    return NextResponse.json({ song: bestMatch });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 