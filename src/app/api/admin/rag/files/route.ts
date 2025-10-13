/**
 * RAG Files Management API
 * GET: List all uploaded files
 * DELETE: Remove file and all associated chunks/embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * GET: List all uploaded files with stats
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'ready', 'processing', 'error'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('rag_files')
      .select(`
        *,
        chunks:rag_chunks(count),
        embeddings:rag_chunks(
          rag_embeddings(count)
        )
      `)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: files, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching files:', error);
      throw error;
    }

    // Transform to include stats
    const filesWithStats = (files || []).map((file: any) => {
      const chunkCount = file.chunks?.[0]?.count || 0;
      const embeddingCount = file.embeddings?.[0]?.rag_embeddings?.[0]?.count || 0;
      
      return {
        id: file.id,
        filename: file.filename,
        fileType: file.file_type,
        fileSize: file.file_size,
        pageCount: file.page_count,
        status: file.status,
        errorMessage: file.error_message,
        uploadedBy: file.uploaded_by,
        uploadedAt: file.uploaded_at,
        metadata: file.metadata,
        stats: {
          chunkCount,
          embeddingCount,
          characterCount: file.original_text?.length || 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      files: filesWithStats,
      total: count || files?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/rag/files:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove a file and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'File ID is required'
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting file: ${fileId}`);

    // Check if file exists
    const { data: file, error: fetchError } = await supabase
      .from('rag_files')
      .select('filename')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Delete file (cascades to chunks and embeddings due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('rag_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('❌ Error deleting file:', deleteError);
      throw deleteError;
    }

    console.log(`✅ File deleted: ${file.filename}`);

    return NextResponse.json({
      success: true,
      message: `File "${file.filename}" and all associated data deleted successfully`
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/rag/files:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

