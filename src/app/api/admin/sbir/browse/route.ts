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
      sortBy = 'last_scraped',
      sortOrder = 'desc'
    } = await request.json();

    console.log(' SBIR Browse request:', { searchText, component, statuses, programType, page });

    // Build query - IMPORTANT: Apply indexed filters FIRST to reduce search space
    let query = supabase
      .from('sbir_final')
      .select('*', { count: 'estimated', head: false }); // Use estimated count to avoid full table scan

    // Filter out corrupted/invalid entries FIRST (this should use index on topic_number)
    query = query.not('topic_number', 'is', null);
    query = query.neq('topic_number', '');
    
    // Apply indexed filters BEFORE search (dramatically reduces search space)
    if (component && component !== 'all') {
      query = query.eq('sponsor_component', component);
      console.log(` Filtering by sponsor_component: ${component}`);
    }

    // Handle multiple status filters (indexed field)
    if (Array.isArray(statuses) && statuses.length > 0) {
      query = query.in('status', statuses);
      console.log(` Filtering by statuses: ${statuses.join(', ')}`);
    }

    if (programType && programType !== 'all') {
      query = query.eq('solicitation_branch', programType);
      console.log(` Filtering by solicitation_branch: ${programType}`);
    }

    // NOW apply search AFTER filtering (searches smaller dataset)
    if (searchText && searchText.trim()) {
      const trimmed = searchText.trim();
      
      // Check if it looks like a topic number (e.g., SF254-D1205, CBD254-011, A254-P039)
      const isTopicNumber = /^[A-Z]{1,4}\d{3,4}[-_][A-Z0-9]+$/i.test(trimmed);
      
      if (isTopicNumber) {
        // Exact topic number search (case-insensitive)
        console.log(` Exact topic number search: "${trimmed}"`);
        query = query.ilike('topic_number', trimmed);
      } else {
        // Accept keywords 2+ characters (allows "AI")
        const allKeywords = trimmed
          .toLowerCase()
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .filter((k: string) => k.length >= 2); // Minimum 2 chars (allows "AI")
        
        if (allKeywords.length > 0) {
          // Take top 2 longest keywords for better matching
          const topKeywords = allKeywords
            .sort((a: string, b: string) => b.length - a.length)
            .slice(0, 2);
          
          // Search across topic_number, title, and keywords fields
          const searchConditions = topKeywords.map((keyword: string) => 
            `topic_number.ilike.%${keyword}%,title.ilike.%${keyword}%,keywords.ilike.%${keyword}%`
          ).join(',');
          
          console.log(` Searching for: [${topKeywords.join(', ')}] (from: "${trimmed.substring(0, 50)}")`);
          query = query.or(searchConditions);
        }
      }
    }

    if (keywords && keywords.trim()) {
      query = query.ilike('keywords', `%${keywords}%`);
    }

    // Apply sorting
    let sortColumn = sortBy || 'last_scraped';
    const order = sortOrder === 'asc' ? true : false;
    
    // Map legacy column names to actual columns in the table
    if (sortColumn === 'modified_date') {
      sortColumn = 'last_scraped';
    } else if (sortColumn === 'close_date_ts') {
      sortColumn = 'close_datetime';
    } else if (sortColumn === 'open_date_ts') {
      sortColumn = 'open_datetime';
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
      .select('sponsor_component')
      .not('sponsor_component', 'is', null)
      .order('sponsor_component');

    // Get unique statuses
    const { data: statuses } = await supabase
      .from('sbir_final')
      .select('status')
      .not('status', 'is', null)
      .order('status');

    // Get unique solicitation branches (program types)
    const { data: programTypes } = await supabase
      .from('sbir_final')
      .select('solicitation_branch')
      .not('solicitation_branch', 'is', null)
      .order('solicitation_branch');

    // Get unique values
    const uniqueComponents = [...new Set(components?.map((c: any) => c.sponsor_component).filter(Boolean))];
    const uniqueStatuses = [...new Set(statuses?.map(s => s.status).filter(Boolean))];
    const uniqueProgramTypes = [...new Set(programTypes?.map(p => p.solicitation_branch).filter(Boolean))];

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

