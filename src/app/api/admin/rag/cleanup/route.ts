/**
 * RAG Cleanup API
 * Deletes expired ephemeral files (older than 1 hour)
 * Can be called manually or via cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log(' Running ephemeral file cleanup...');

    // Find files older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Get files to delete (ephemeral files older than 1 hour)
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('rag_files')
      .select('id, filename, uploaded_at')
      .lt('uploaded_at', oneHourAgo);

    if (fetchError) {
      console.error(' Error fetching expired files:', fetchError);
      throw fetchError;
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      console.log(' No expired files to clean up');
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No expired files found'
      });
    }

    console.log(` Found ${expiredFiles.length} expired files`);

    // Delete expired files (cascades to chunks and embeddings)
    const { error: deleteError } = await supabase
      .from('rag_files')
      .delete()
      .lt('uploaded_at', oneHourAgo);

    if (deleteError) {
      console.error(' Error deleting expired files:', deleteError);
      throw deleteError;
    }

    console.log(` Deleted ${expiredFiles.length} expired files`);

    return NextResponse.json({
      success: true,
      deleted: expiredFiles.length,
      files: expiredFiles.map(f => ({
        id: f.id,
        filename: f.filename,
        uploadedAt: f.uploaded_at
      }))
    });

  } catch (error) {
    console.error(' Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET: Get cleanup stats (how many files would be deleted)
 */
export async function GET(request: NextRequest) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('rag_files')
      .select('*', { count: 'exact', head: true })
      .lt('uploaded_at', oneHourAgo);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      expiredCount: count || 0,
      cutoffTime: oneHourAgo
    });

  } catch (error) {
    console.error(' Error checking cleanup stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

