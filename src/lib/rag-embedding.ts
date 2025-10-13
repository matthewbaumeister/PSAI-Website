/**
 * RAG Embedding Service
 * Uses HuggingFace Inference API (FREE tier) for BGE-small-en-v1.5
 * 
 * Model: BAAI/bge-small-en-v1.5 (384 dimensions)
 * Setup: Add HUGGINGFACE_API_KEY to Vercel environment variables
 * Get free key: https://huggingface.co/settings/tokens (read permissions)
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const EMBEDDING_DIMENSIONS = 384; // BGE-small outputs 384-dimensional vectors

interface EmbeddingResponse {
  embedding: number[];
  error?: string;
}

/**
 * Generate embedding for a single text chunk
 * @param text - Text to embed (max ~512 tokens recommended)
 * @returns 384-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!HF_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY not found in environment variables');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true // Wait if model is loading
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace API error:', errorText);
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // BGE model returns array of embeddings (we send one input, get one output)
    const embedding = Array.isArray(result) ? result[0] : result;
    
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding format. Expected ${EMBEDDING_DIMENSIONS}-dim vector, got length: ${Array.isArray(embedding) ? embedding.length : 'not an array'}`);
    }

    return embedding;

  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 * @param texts - Array of texts to embed
 * @returns Array of 384-dimensional vectors
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Process in parallel with rate limiting (max 5 concurrent requests)
  const batchSize = 5;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score (0-1, higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

/**
 * Format embedding for Supabase pgvector
 * @param embedding - 384-dimensional vector
 * @returns Postgres array string format
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

