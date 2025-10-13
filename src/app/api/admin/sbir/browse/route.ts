import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body for search parameters
    const { 
      searchText = '',
      component = '',
      statuses = [],
      programType = '',
      keywords = '',
      page = 0,
      pageSize = 50,
      sortBy = 'modified_date',
      sortOrder = 'desc'
    } = await request.json();

    console.log(' SBIR Browse request:', { searchText, component, statuses, programType, page });

    // Build the base query with increased timeout
    let query = supabase
      .from('sbir_final')
      .select('*', { count: 'exact' });

    // Filter out corrupted/invalid entries
    // Only show entries with valid topic_number (not null, not empty, matches pattern)
    query = query.not('topic_number', 'is', null);
    query = query.neq('topic_number', '');
    
    // Apply filters
    if (searchText && searchText.trim()) {
      // Split search text into individual keywords for better performance
      // Remove punctuation and filter out short words
      const searchKeywords = searchText.trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
        .split(/\s+/)
        .filter((k: string) => k.length > 2);
      
      if (searchKeywords.length > 0) {
        // Search each keyword across fields (more efficient than one long string)
        // Build OR conditions for each keyword
        const orConditions = searchKeywords.map((keyword: string) => 
          `title.ilike.%${keyword}%,description.ilike.%${keyword}%,keywords.ilike.%${keyword}%`
        ).join(',');
        
        console.log(` Searching ${searchKeywords.length} keywords:`, searchKeywords.slice(0, 5));
        query = query.or(orConditions);
      }
    }

    if (component && component !== 'all') {
      query = query.eq('component', component);
    }

    // Handle multiple status filters
    if (Array.isArray(statuses) && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    if (programType && programType !== 'all') {
      query = query.eq('program_type', programType);
    }

    if (keywords && keywords.trim()) {
      query = query.ilike('keywords', `%${keywords}%`);
    }

    // Apply sorting
    let sortColumn = sortBy || 'modified_date';
    const order = sortOrder === 'asc' ? true : false;
    
    // Use timestamp columns for date sorting (chronologically correct)
    if (sortColumn === 'close_date') {
      sortColumn = 'close_date_ts';
    } else if (sortColumn === 'open_date') {
      sortColumn = 'open_date_ts';
    }
    
    query = query.order(sortColumn, { ascending: order, nullsFirst: false });

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error(' SBIR browse error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        searchText: searchText.substring(0, 100) // Log first 100 chars
      });
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Get filter options for dropdowns
    const filterOptions = await getFilterOptions();

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      filterOptions
    });

  } catch (error) {
    console.error(' SBIR browse request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function getFilterOptions() {
  try {
    // Get unique components
    const { data: components } = await supabase
      .from('sbir_final')
      .select('component')
      .not('component', 'is', null)
      .order('component');

    // Get unique statuses
    const { data: statuses } = await supabase
      .from('sbir_final')
      .select('status')
      .not('status', 'is', null)
      .order('status');

    // Get unique program types
    const { data: programTypes } = await supabase
      .from('sbir_final')
      .select('program_type')
      .not('program_type', 'is', null)
      .order('program_type');

    // Get unique values
    const uniqueComponents = [...new Set(components?.map(c => c.component).filter(Boolean))];
    const uniqueStatuses = [...new Set(statuses?.map(s => s.status).filter(Boolean))];
    const uniqueProgramTypes = [...new Set(programTypes?.map(p => p.program_type).filter(Boolean))];

    return {
      components: uniqueComponents,
      statuses: uniqueStatuses,
      programTypes: uniqueProgramTypes
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      components: [],
      statuses: [],
      programTypes: []
    };
  }
}

