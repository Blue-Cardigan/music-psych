# Mood Music Recommender

A Next.js application that recommends music based on your current mood and collects feedback on how the music affects your mood.

## Features

- Mood-based music recommendations using vector similarity search
- Spotify integration for music playback
- Survey system to collect feedback on music's impact on mood
- Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Supabase account with the following setup:
  - Vector extension enabled
  - Songs table with embeddings
  - Survey responses table
- Spotify Developer account with API credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Songs Table
```sql
create table songs (
    id uuid default gen_random_uuid() primary key,
    title text not null unique,
    artist text not null,
    embedding vector(200),
    audio_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Survey Responses Table
```sql
create table survey_responses (
    id uuid default gen_random_uuid() primary key,
    song_id uuid references songs(id) on delete cascade,
    mood_before integer not null check (mood_before >= 1 and mood_before <= 5),
    mood_after integer not null check (mood_after >= 1 and mood_after <= 5),
    energy_level integer not null check (energy_level >= 1 and energy_level <= 5),
    focus_level integer not null check (focus_level >= 1 and focus_level <= 5),
    comments text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
