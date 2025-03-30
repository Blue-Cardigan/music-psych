import pandas as pd
import numpy as np
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn
import logging
import traceback
from fastapi.middleware.cors import CORSMiddleware

# Set up logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI()

# Initialize global variables
language_model = None
query_embeddings = None
pca = None
embeddings = None
allfiles = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoodInput(BaseModel):
    mood: str

def parse_song_info(filename):
    """Extract song information from the embedding filename."""
    # Remove the .csv extension
    base_name = os.path.splitext(filename)[0]
    
    # Handle various filename formats
    if ' - ' in base_name:
        artist, title = base_name.split(' - ', 1)
    elif '-' in base_name:
        # Handle cases like "2pac- Still Ballin"
        parts = base_name.split('-', 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    elif '_' in base_name:
        parts = base_name.split('_')
        artist = parts[0]
        title = ' '.join(parts[1:])
    else:
        # If no separator found, use the whole name as both title and artist
        title = base_name
        artist = base_name
    
    return {
        'title': title,
        'artist': artist
    }

def normalize_embeddings(embeddings):
    """Normalize embeddings to unit length."""
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    # Avoid division by zero
    norms = np.where(norms == 0, 1, norms)
    return embeddings / norms

def load_models():
    global language_model, query_embeddings, pca, embeddings, allfiles
    
    try:
        # Load the language model
        logger.info("Loading language model...")
        language_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Language model loaded successfully")
        
        # Load query embeddings
        logger.info("Loading query embeddings...")
        query_embeddings = pd.read_csv(os.path.join(SCRIPT_DIR, "query_embedding.csv"), header=None).values
        logger.info(f"Query embeddings loaded. Shape: {query_embeddings.shape}")
        
        # Validate query embeddings
        if query_embeddings.shape[1] != 384:  # Expected dimension for all-MiniLM-L6-v2
            raise ValueError(f"Unexpected query embedding dimension: {query_embeddings.shape[1]}")
        
        # Initialize PCA
        logger.info("Initializing PCA...")
        pca = PCA(n_components=200)
        pca.fit(query_embeddings)
        logger.info(f"PCA explained variance ratio: {pca.explained_variance_ratio_.sum():.3f}")
        
        # Read all embedding files
        logger.info("Loading embedding files...")
        embeddings_dir = os.path.join(SCRIPT_DIR, "embeddings")
        allfiles = os.listdir(embeddings_dir)
        allfiles.sort()
        n = len(allfiles)
        logger.info(f"Found {n} embedding files")
        
        embeddings = np.zeros((n, 200))
        for i, file in enumerate(allfiles):
            file_path = os.path.join(embeddings_dir, file)
            try:
                a = pd.read_csv(file_path, header=None).values
                if a.shape[1] != 200:  # Expect 200 dimensions since they're pre-PCA'd
                    logger.warning(f"Unexpected embedding dimension in {file}: {a.shape[1]}")
                    continue
                # Take mean and normalize
                embedding = np.mean(a, axis=0)
                embeddings[i, :] = embedding
            except Exception as e:
                logger.error(f"Error loading embedding file {file}: {str(e)}")
                raise
        
        # Normalize song embeddings
        embeddings = normalize_embeddings(embeddings)
        
        # Validate final embeddings
        if embeddings.shape[1] != 200:
            raise ValueError(f"Unexpected final embedding dimension: {embeddings.shape[1]}")
        
        logger.info(f"Embeddings loaded successfully. Shape: {embeddings.shape}")
        
    except Exception as e:
        logger.error(f"Error during model loading: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@app.on_event("startup")
async def startup_event():
    load_models()

@app.post("/recommend")
async def get_recommendation(mood_input: MoodInput):
    try:
        logger.info(f"Received mood input: {mood_input.mood}")
        
        # Compute the embedding for the input mood
        logger.info("Computing mood embedding...")
        embedding_sentence = language_model.encode(mood_input.mood).reshape(1, -1)
        logger.info(f"Mood embedding shape: {embedding_sentence.shape}")
        
        # Transform with PCA
        logger.info("Transforming with PCA...")
        mood_pca = pca.transform(embedding_sentence)
        mood_pca = normalize_embeddings(mood_pca)
        logger.info(f"PCA transformed shape: {mood_pca.shape}")
        
        # Compute similarities using dot product (since vectors are normalized)
        logger.info("Computing similarities...")
        similarities = np.dot(embeddings, mood_pca.T).flatten()
        logger.info(f"Computed {len(similarities)} similarity scores")
        
        # Get top 5 matches for logging
        top_indices = np.argsort(similarities)[-5:][::-1]
        logger.info("Top 5 matches:")
        for idx in top_indices:
            song_info = parse_song_info(allfiles[idx])
            logger.info(f"- {song_info['artist']} - {song_info['title']}: {similarities[idx]:.3f}")
        
        # Find best match
        best_match_index = np.argmax(similarities)
        best_match_song = allfiles[best_match_index]
        logger.info(f"Best match found: {best_match_song} with similarity score: {similarities[best_match_index]}")
        
        # Extract song information from filename
        song_info = parse_song_info(best_match_song)
        logger.info(f"Parsed song info: {song_info}")
        
        # Prepare response
        response = {
            "song_file": best_match_song,
            "similarity_score": float(similarities[best_match_index]),
            "title": song_info['title'],
            "artist": song_info['artist']
        }
        
        logger.info("Successfully prepared response")
        return response
        
    except Exception as e:
        logger.error(f"Error in recommendation: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    status = {
        "status": "healthy",
        "models_loaded": language_model is not None,
        "embeddings_loaded": embeddings is not None,
        "num_embeddings": len(allfiles) if allfiles is not None else 0
    }
    logger.info(f"Health check status: {status}")
    return status

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

