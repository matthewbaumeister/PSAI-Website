import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch SBIR data with search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const component = searchParams.get('component') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('sbir_final')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,sponsor_component.ilike.%${search}%`);
    }

    // Apply component filter
    if (component) {
      query = query.eq('sponsor_component', component);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching SBIR data:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in SBIR API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update SBIR record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sbir_final')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating SBIR record:', error);
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] });

  } catch (error) {
    console.error('Error updating SBIR record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete SBIR record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sbir_final')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting SBIR record:', error);
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting SBIR record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
