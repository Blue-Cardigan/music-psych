# Gaos  

**Gaos** is a music therapy platform. It fetches user’s liked tracks from Spotify, processes audio features via Essentia, and predicts mood/focus improvements based on user feedback.  It also leverages AI-driven interviews to build a naive digital twin of the user, allowing the system to discover new influential variables for personalization dynamically.
---

## Repository Structure  

- **`web`** – **User Interface & Authentication**  
  - Implements **Google OAuth** for login.  
  - Connects to **Spotify API** to fetch Liked Songs.  
  - UI for collecting **user feedback** on mood/focus after listening to songs.  

- **`auralysis`** – **Audio Processing & Feature Extraction**  
  - Runs **Essentia** to extract BPM, spectral features, loudness, etc.  
  - Stores extracted features in a structured dataset.  

- **`synapse`** – **Music Impact Modeling & Recommendation**  
  - Merges **user feedback** (mood, ADHD tests) with extracted **audio features**.  
  - Trains a model to **predict** how a song affects a user’s **focus & relaxation**.  
  - Provides a **recommendation function** for optimal therapy tracks.  

- **`psygraph`** – **AI Interview & Dynamic User Model**  
  - Conducts an **AI-driven interview** to build a personalized psychological profile.  
  - The AI learns to **simulate user responses**, allowing it to infer missing psychological variables over time.  
  - Instead of asking the user every question, the system **queries the AI user model** to determine which factors are most relevant for personalization.  
  - The refined model improves both the **accuracy of recommendations** and the **efficiency of data collection**.  

---

## Tasks  

### 1. **User Authentication & Spotify Integration (`web`)**  
- [ ] Implement **Google OAuth login**.  
- [ ] Connect **Spotify API** to retrieve Liked Songs.  
- [ ] Store minimal user data for session management.  
- [ ] UI for collecting **user feedback** on song effects.  

### 2. **Audio Processing (`auralysis`)**  
- [ ] Extract **BPM, loudness, spectral descriptors, MFCCs** using **Essentia**.  
- [ ] Store processed features in **CSV/DB**.  

### 3. **Music Impact Modeling & Recommendation (`synapse`)**  
- [ ] Merge **user feedback** (mood, ADHD test scores) with extracted **audio features**.  
- [ ] Train a **regression/classification model** to predict music impact.  
- [ ] Implement **recommendation logic** based on user profile & model output.  

### 4. **AI-Driven Interview & Dynamic User Model (`psygraph`)**  
- [ ] Design an **AI interview system** that asks relevant psychological & cognitive questions.  
- [ ] Train an AI to **answer future questions like the user**, reducing the need for explicit input.  
- [ ] Implement a feedback loop where the AI **adapts its user model over time**.  
- [ ] Use this model to **dynamically identify missing variables** that could improve recommendations.  


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
