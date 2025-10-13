/**
 * RAG Ingestion API
 * POST: Upload PDF or paste text, extract, chunk, embed, and store
 * Updated: Oct 13, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// PDF parsing temporarily disabled - use text paste only
// import { extractPDFText, cleanPDFText, extractPDFMetadata } from '@/lib/rag-pdf';
import { chunkText } from '@/lib/rag-chunking';
import { generateEmbeddingsBatch } from '@/lib/rag-embedding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface IngestRequest {
  type: 'pdf' | 'text' | 'paste';
  text?: string;
  filename?: string;
  metadata?: {
    customer?: string;
    project?: string;
    tags?: string[];
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log(' RAG Ingest request received');

    // Check authentication (admin only)
    // TODO: Add proper auth check
    
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let ingestData: IngestRequest | null = null;
    let filename = 'unknown';

    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const metadataStr = formData.get('metadata') as string;
      
      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'No file provided'
        }, { status: 400 });
      }

      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      
      ingestData = {
        type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
        filename: file.name,
        metadata: metadataStr ? JSON.parse(metadataStr) : {}
      };

    } else {
      // Handle JSON (text paste)
      ingestData = await request.json();
      
      if (!ingestData) {
        return NextResponse.json({
          success: false,
          error: 'Invalid request format'
        }, { status: 400 });
      }
      
      filename = ingestData.filename || 'pasted-text.txt';
    }

    if (!ingestData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 });
    }

    console.log(` Processing: ${filename} (type: ${ingestData.type})`);

    // Step 1: Extract text
    let fullText = '';
    let pages: string[] = [];
    let pageCount = 1;
    let extractedMetadata: any = {};

    if (ingestData.type === 'pdf' && fileBuffer) {
      // PDF support temporarily disabled due to serverless environment limitations
      return NextResponse.json({
        success: false,
        error: 'PDF upload temporarily disabled. Please use text paste instead.'
      }, { status: 400 });
      
    } else if (ingestData.text) {
      fullText = ingestData.text.trim();
      pages = [fullText];
      console.log(` Text provided: ${fullText.length} chars`);
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'No text or file provided'
      }, { status: 400 });
    }

    if (fullText.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Text too short (minimum 10 characters)'
      }, { status: 400 });
    }

    // Step 2: Create file record (EPHEMERAL MODE - auto-expires in 1 hour)
    console.log(' Creating ephemeral file record...');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const { data: fileRecord, error: fileError } = await supabase
      .from('rag_files')
      .insert({
        filename,
        file_type: ingestData.type,
        original_text: null, // SECURITY: Never store original text
        file_size: fileBuffer?.length || fullText.length,
        page_count: pageCount,
        uploaded_by: 'admin@prop-shop.ai', // TODO: Get from auth
        metadata: {
          ...ingestData.metadata,
          ...extractedMetadata,
          processed_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          ephemeral: true,
          security_note: 'This document will be automatically deleted after 1 hour or after first search'
        },
        status: 'processing'
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      console.error(' Error creating file record:', fileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create file record'
      }, { status: 500 });
    }

    const fileId = fileRecord.id;
    console.log(` File record created: ${fileId}`);

    // Step 3: Chunk text (text-only, no page-based chunking)
    console.log(' Chunking text...');
    const chunks = chunkText(fullText);
    
    console.log(` Created ${chunks.length} chunks`);

    // Step 4: Store chunks
    console.log(' Storing chunks...');
    const chunkRecords = chunks.map(chunk => ({
      file_id: fileId,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      page_number: chunk.pageNumber,
      section_header: chunk.sectionHeader,
      metadata: {}
    }));

    const { data: insertedChunks, error: chunksError } = await supabase
      .from('rag_chunks')
      .insert(chunkRecords)
      .select();

    if (chunksError || !insertedChunks) {
      console.error(' Error storing chunks:', chunksError);
      
      // Update file status to error
      await supabase
        .from('rag_files')
        .update({ status: 'error', error_message: 'Failed to store chunks' })
        .eq('id', fileId);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to store chunks'
      }, { status: 500 });
    }

    console.log(` Stored ${insertedChunks.length} chunks`);

    // Step 5: Generate embeddings
    console.log('🧠 Generating embeddings...');
    const chunkTexts = chunks.map(c => c.content);
    
    let embeddings: number[][];
    try {
      embeddings = await generateEmbeddingsBatch(chunkTexts);
      console.log(` Generated ${embeddings.length} embeddings`);
    } catch (embeddingError) {
      console.error(' Error generating embeddings:', embeddingError);
      
      await supabase
        .from('rag_files')
        .update({ 
          status: 'error', 
          error_message: `Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`
        })
        .eq('id', fileId);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate embeddings',
        details: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 6: Store embeddings
    console.log(' Storing embeddings...');
    const embeddingRecords = insertedChunks.map((chunk, index) => ({
      chunk_id: chunk.id,
      embedding: `[${embeddings[index].join(',')}]`, // pgvector format
      model_name: 'nvidia/NV-Embed-v2'
    }));

    const { error: embeddingsError } = await supabase
      .from('rag_embeddings')
      .insert(embeddingRecords);

    if (embeddingsError) {
      console.error(' Error storing embeddings:', embeddingsError);
      
      await supabase
        .from('rag_files')
        .update({ status: 'error', error_message: 'Failed to store embeddings' })
        .eq('id', fileId);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to store embeddings'
      }, { status: 500 });
    }

    console.log(` Stored ${embeddingRecords.length} embeddings`);

    // Step 7: Update file status to ready
    await supabase
      .from('rag_files')
      .update({ status: 'ready' })
      .eq('id', fileId);

    const processingTime = Date.now() - startTime;
    console.log(` Ingestion complete in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      fileId,
      filename,
      stats: {
        pageCount,
        chunkCount: chunks.length,
        characterCount: fullText.length,
        embeddingCount: embeddings.length,
        processingTimeMs: processingTime
      },
      security: {
        mode: 'EPHEMERAL',
        expiresAt: expiresAt.toISOString(),
        warning: 'Document will be automatically deleted after first search or in 1 hour'
      }
    });

  } catch (error) {
    console.error(' Ingestion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

