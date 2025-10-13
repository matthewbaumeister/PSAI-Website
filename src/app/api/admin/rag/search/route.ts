/**
 * RAG Search API
 * POST: Query → vector search → return ranked matches from SBIR database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/rag-embedding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface SearchRequest {
  query?: string;
  fileId?: string; // Search by uploaded document
  matchThreshold?: number; // Similarity threshold (0-1)
  matchCount?: number; // Max results
  filters?: {
    customer?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

interface SearchResult {
  chunkId: string;
  fileId: string;
  filename: string;
  fileType: string;
  content: string;
  similarity: number;
  pageNumber?: number;
  sectionHeader?: string;
  metadata?: any;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log(' RAG Search request received');

    const body: SearchRequest = await request.json();
    const {
      query,
      fileId,
      matchThreshold = 0.5,
      matchCount = 100,
      filters = {}
    } = body;

    if (!query && !fileId) {
      return NextResponse.json({
        success: false,
        error: 'Either query or fileId must be provided'
      }, { status: 400 });
    }

    // Step 1: Generate query embedding
    let queryEmbedding: number[];
    
    if (query) {
      console.log(` Searching for query: "${query}"`);
      queryEmbedding = await generateEmbedding(query);
      console.log(` Generated query embedding`);
      
    } else if (fileId) {
      console.log(` Searching by document: ${fileId}`);
      
      // Get all chunks from the uploaded file and average their embeddings
      const { data: fileChunks, error: chunksError } = await supabase
        .from('rag_chunks')
        .select(`
          id,
          rag_embeddings(embedding)
        `)
        .eq('file_id', fileId);

      if (chunksError || !fileChunks || fileChunks.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'File not found or has no embeddings'
        }, { status: 404 });
      }

      // Average all embeddings from the document
      const embeddings = fileChunks
        .map((chunk: any) => chunk.rag_embeddings?.[0]?.embedding)
        .filter(Boolean);

      if (embeddings.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No embeddings found for this file'
        }, { status: 404 });
      }

      // Parse embeddings (they're stored as strings)
      const parsedEmbeddings = embeddings.map((e: any) => 
        typeof e === 'string' ? JSON.parse(e) : e
      );

      // Average the embeddings
      queryEmbedding = parsedEmbeddings[0].map((_: any, i: number) =>
        parsedEmbeddings.reduce((sum: number, emb: number[]) => sum + emb[i], 0) / parsedEmbeddings.length
      );

      console.log(` Averaged ${parsedEmbeddings.length} embeddings from document`);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid request'
      }, { status: 400 });
    }

    // Step 2: Vector similarity search using pgvector
    console.log(` Performing vector search (top ${matchCount})...`);
    
    const { data: matches, error: searchError } = await supabase.rpc(
      'search_rag_embeddings',
      {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: matchThreshold,
        match_count: matchCount
      }
    );

    if (searchError) {
      console.error(' Search error:', searchError);
      return NextResponse.json({
        success: false,
        error: 'Vector search failed',
        details: searchError.message
      }, { status: 500 });
    }

    console.log(` Found ${matches?.length || 0} matches`);

    // Step 3: Apply metadata filters if provided
    let filteredMatches = matches || [];
    
    if (filters.customer) {
      filteredMatches = filteredMatches.filter((m: any) =>
        m.metadata?.customer?.toLowerCase().includes(filters.customer!.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filteredMatches = filteredMatches.filter((m: any) => {
        const fileDate = m.metadata?.processed_at ? new Date(m.metadata.processed_at) : null;
        return fileDate && fileDate >= dateFrom;
      });
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      filteredMatches = filteredMatches.filter((m: any) => {
        const fileDate = m.metadata?.processed_at ? new Date(m.metadata.processed_at) : null;
        return fileDate && fileDate <= dateTo;
      });
    }

    // Step 4: Format results
    const results: SearchResult[] = filteredMatches.map((match: any) => ({
      chunkId: match.chunk_id,
      fileId: match.file_id,
      filename: match.filename,
      fileType: match.file_type,
      content: match.content,
      similarity: match.similarity,
      pageNumber: match.page_number,
      sectionHeader: match.section_header,
      metadata: match.metadata
    }));

    // Step 5: EPHEMERAL MODE - Delete file after search (if it was uploaded)
    if (fileId) {
      console.log(` EPHEMERAL MODE: Deleting file ${fileId} after search`);
      await supabase
        .from('rag_files')
        .delete()
        .eq('id', fileId);
      console.log(` File deleted (ephemeral mode)`);
    }

    // SECURITY: Do NOT log search history in ephemeral mode
    // (Commented out for privacy)
    // await supabase.from('rag_search_history').insert({...});

    const responseTime = Date.now() - startTime;
    console.log(` Search complete in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      query: query || `document:${fileId}`,
      results,
      stats: {
        totalMatches: results.length,
        responseTimeMs: responseTime,
        avgSimilarity: results.length > 0
          ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length
          : 0
      },
      security: {
        mode: 'EPHEMERAL',
        action: fileId ? 'File deleted after search' : 'Query not logged',
        note: 'No data retained for security/privacy'
      }
    });

  } catch (error) {
    console.error(' Search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET: Get search history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { data: history, error } = await supabase
      .from('rag_search_history')
      .select('*')
      .order('searched_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      history
    });

  } catch (error) {
    console.error(' Error fetching search history:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

