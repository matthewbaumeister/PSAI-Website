import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Get one record to see all column names
    const { data, error } = await supabase
      .from('sbir_final')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      success: true,
      tableName: 'sbir_final',
      columnCount: columns.length,
      columns: columns.sort()
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

