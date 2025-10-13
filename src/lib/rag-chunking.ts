/**
 * RAG Text Chunking Utility
 * Splits documents into overlapping chunks for embedding
 * 
 * Strategy: 300-800 token chunks with 10-15% overlap
 */

const CHUNK_SIZE = 512; // Target tokens per chunk (estimated)
const CHUNK_OVERLAP = 64; // ~12.5% overlap
const MIN_CHUNK_SIZE = 5; // Minimum chunk size (reduced to allow small test queries)
const CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
  startChar: number;
  endChar: number;
  pageNumber?: number;
  sectionHeader?: string;
}

/**
 * Count tokens in text using simple estimation
 * (1 token ≈ 4 characters for English text)
 */
export function countTokens(text: string): number {
  // Simple word-based estimation (more accurate than pure char count)
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3); // ~1.3 tokens per word on average
}

/**
 * Split text into sentences for smarter chunking
 */
function splitIntoSentences(text: string): string[] {
  // Split on period, exclamation, question mark followed by space or newline
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
  
  return sentences;
}

/**
 * Detect section headers in text
 * Returns map of line numbers to header text
 */
function detectHeaders(text: string): Map<number, string> {
  const headers = new Map<number, string>();
  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Heuristics for headers:
    // 1. Short lines (< 80 chars)
    // 2. Title case or all caps
    // 3. Ends without punctuation or ends with colon
    // 4. Common header patterns (e.g., "1. ", "Section ", "Chapter ")
    
    if (trimmed.length > 0 && trimmed.length < 80) {
      const isNumbered = /^\d+\.?\s/.test(trimmed);
      const hasHeaderKeyword = /^(section|chapter|appendix|part|table|figure|abstract|introduction|conclusion|background|methodology|results|discussion)/i.test(trimmed);
      const endsWithColon = trimmed.endsWith(':');
      const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3;
      const isTitleCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed);
      
      if (isNumbered || hasHeaderKeyword || endsWithColon || isAllCaps || isTitleCase) {
        headers.set(index, trimmed);
      }
    }
  });
  
  return headers;
}

/**
 * Find the most recent header before a given position
 */
function findRelevantHeader(
  charPosition: number,
  text: string,
  headers: Map<number, string>
): string | undefined {
  const lines = text.substring(0, charPosition).split('\n');
  const lineNumber = lines.length - 1;
  
  // Look backwards for the most recent header
  for (let i = lineNumber; i >= 0; i--) {
    if (headers.has(i)) {
      return headers.get(i);
    }
  }
  
  return undefined;
}

/**
 * Chunk text into overlapping segments
 * @param text - Input text to chunk
 * @param metadata - Optional metadata (page numbers, etc.)
 * @returns Array of chunks with metadata
 */
export function chunkText(
  text: string,
  metadata?: {
    pageNumber?: number;
    filename?: string;
  }
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  const sentences = splitIntoSentences(text);
  const headers = detectHeaders(text);
  
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let chunkStartChar = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = countTokens(sentence);

    // If adding this sentence exceeds chunk size, save current chunk
    if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      const chunkEndChar = chunkStartChar + chunkText.length;
      const header = findRelevantHeader(chunkStartChar, text, headers);

      chunks.push({
        content: chunkText,
        index: chunkIndex++,
        tokenCount: currentTokens,
        startChar: chunkStartChar,
        endChar: chunkEndChar,
        pageNumber: metadata?.pageNumber,
        sectionHeader: header
      });

      // Keep overlap: remove first few sentences, keep rest
      const overlapTokens = CHUNK_OVERLAP;
      let tokensToRemove = 0;
      let sentencesToRemove = 0;

      for (let j = 0; j < currentChunk.length; j++) {
        const tokens = countTokens(currentChunk[j]);
        if (tokensToRemove + tokens < currentTokens - overlapTokens) {
          tokensToRemove += tokens;
          sentencesToRemove++;
        } else {
          break;
        }
      }

      currentChunk = currentChunk.slice(sentencesToRemove);
      currentTokens -= tokensToRemove;
      chunkStartChar = text.indexOf(currentChunk[0], chunkEndChar - 500); // Approximate
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Save final chunk if it's big enough
  if (currentChunk.length > 0 && currentTokens >= MIN_CHUNK_SIZE) {
    const chunkText = currentChunk.join(' ');
    const chunkEndChar = chunkStartChar + chunkText.length;
    const header = findRelevantHeader(chunkStartChar, text, headers);

    chunks.push({
      content: chunkText,
      index: chunkIndex,
      tokenCount: currentTokens,
      startChar: chunkStartChar,
      endChar: chunkEndChar,
      pageNumber: metadata?.pageNumber,
      sectionHeader: header
    });
  }

  return chunks;
}

/**
 * Chunk text by pages (for PDFs)
 * @param pages - Array of page texts
 * @returns Array of chunks with page numbers
 */
export function chunkTextByPages(pages: string[]): TextChunk[] {
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  pages.forEach((pageText, pageIndex) => {
    const pageChunks = chunkText(pageText, {
      pageNumber: pageIndex + 1
    });

    // Update global indices
    pageChunks.forEach(chunk => {
      chunk.index = globalIndex++;
      allChunks.push(chunk);
    });
  });

  return allChunks;
}

/**
 * Get statistics about chunking
 */
export function getChunkingStats(chunks: TextChunk[]): {
  totalChunks: number;
  avgTokensPerChunk: number;
  minTokens: number;
  maxTokens: number;
  totalTokens: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgTokensPerChunk: 0,
      minTokens: 0,
      maxTokens: 0,
      totalTokens: 0
    };
  }

  const tokenCounts = chunks.map(c => c.tokenCount);
  const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);

  return {
    totalChunks: chunks.length,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
    totalTokens
  };
}

