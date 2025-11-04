// ============================================
// GWAC-FPDS Linker
// ============================================
// Links FPDS contract task orders to their parent GWAC vehicles
// This runs after FPDS scraper to auto-populate gwac_task_orders table
//
// How it works:
// 1. Queries fpds_contracts for task orders (has referenced_idv_piid)
// 2. Identifies GWAC contracts by PIID pattern matching
// 3. Links to gwac_programs and gwac_contract_holders
// 4. Updates task order statistics for companies
//
// GWAC PIID Patterns:
// - 8(a) STARS III: 47QTCA19D*, GS00Q17GWD4003
// - Alliant 2: 47QTCB*, GS00Q14OADU107
// - Alliant 2 SB: 47QTCB*, GS00Q14OADU206
// - VETS 2: 36F79*, VA11817F1001
// - Polaris: 47QRAD20D*, various
// - OASIS+: 47QRAA*, various
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// GWAC Program PIID Patterns
// ============================================

interface GWACPattern {
  programCode: string;
  programName: string;
  piidPatterns: string[];
}

const GWAC_PATTERNS: GWACPattern[] = [
  {
    programCode: 'STARS3',
    programName: '8(a) STARS III',
    piidPatterns: [
      '47QTCA19D%', // Main STARS III pattern
      'GS00Q17GWD4003%' // Alternative format
    ]
  },
  {
    programCode: 'ALLIANT2',
    programName: 'Alliant 2',
    piidPatterns: [
      '47QTCB21D%', // Alliant 2 unrestricted
      'GS00Q14OADU107%'
    ]
  },
  {
    programCode: 'ALLIANT2_SB',
    programName: 'Alliant 2 Small Business',
    piidPatterns: [
      '47QTCB22D%', // Alliant 2 Small Business
      'GS00Q14OADU206%'
    ]
  },
  {
    programCode: 'VETS2',
    programName: 'VETS 2',
    piidPatterns: [
      '36F79%', // VETS 2 pattern
      'VA11817F1001%'
    ]
  },
  {
    programCode: 'POLARIS',
    programName: 'Polaris',
    piidPatterns: [
      '47QRAD20D%', // Polaris small business
      '47QRAD21D%'
    ]
  },
  {
    programCode: 'OASIS_PLUS',
    programName: 'OASIS+',
    piidPatterns: [
      '47QRAA%' // OASIS+ patterns
    ]
  }
];

// ============================================
// Main Linking Function
// ============================================

export async function linkFPDSToGWAC(options?: {
  dateFrom?: string; // Link contracts from this date forward
  limit?: number;    // Limit processing (for testing)
  dryRun?: boolean;  // Don't insert, just report
}): Promise<{
  success: boolean;
  totalFound: number;
  linked: number;
  unlinked: number;
  errors: number;
  byProgram: Record<string, number>;
}> {
  
  const { dateFrom, limit, dryRun = false } = options || {};
  
  console.log('[GWAC Linker] Starting FPDS-GWAC linking...');
  if (dryRun) console.log('[GWAC Linker] DRY RUN MODE - No data will be written');
  
  let totalFound = 0;
  let linked = 0;
  let unlinked = 0;
  let errors = 0;
  const byProgram: Record<string, number> = {};
  
  try {
    // Step 1: Get all GWAC programs from database
    const { data: gwacPrograms, error: programsError } = await supabase
      .from('gwac_programs')
      .select('id, program_code, program_name');
    
    if (programsError) throw programsError;
    
    if (!gwacPrograms || gwacPrograms.length === 0) {
      console.log('[GWAC Linker] No GWAC programs found in database. Please populate gwac_programs table first.');
      return { success: false, totalFound: 0, linked: 0, unlinked: 0, errors: 1, byProgram: {} };
    }
    
    console.log(`[GWAC Linker] Found ${gwacPrograms.length} GWAC programs in database`);
    
    // Step 2: Query FPDS for task orders with referenced_idv_piid
    let query = supabase
      .from('fpds_contracts')
      .select('id, piid, referenced_idv_piid, vendor_name, vendor_uei, vendor_duns, base_and_exercised_options_value, dollars_obligated, date_signed, period_of_performance_start, period_of_performance_end, description_of_requirement, contracting_agency_name, contracting_agency_id, contracting_office_name')
      .not('referenced_idv_piid', 'is', null);
    
    if (dateFrom) {
      query = query.gte('date_signed', dateFrom);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: fpdsContracts, error: contractsError } = await query;
    
    if (contractsError) throw contractsError;
    
    if (!fpdsContracts || fpdsContracts.length === 0) {
      console.log('[GWAC Linker] No FPDS task orders found');
      return { success: true, totalFound: 0, linked: 0, unlinked: 0, errors: 0, byProgram: {} };
    }
    
    totalFound = fpdsContracts.length;
    console.log(`[GWAC Linker] Found ${totalFound} FPDS task orders to process`);
    
    // Step 3: Process each task order
    for (const contract of fpdsContracts) {
      try {
        // Check if already linked
        const { data: existing } = await supabase
          .from('gwac_task_orders')
          .select('id')
          .eq('task_order_number', contract.piid)
          .single();
        
        if (existing) {
          // Already linked, skip
          continue;
        }
        
        // Match to GWAC program by PIID pattern
        let matchedProgram: typeof gwacPrograms[0] | null = null;
        
        for (const pattern of GWAC_PATTERNS) {
          for (const piidPattern of pattern.piidPatterns) {
            const regex = new RegExp(piidPattern.replace('%', '.*'), 'i');
            if (regex.test(contract.referenced_idv_piid)) {
              // Found a match!
              matchedProgram = gwacPrograms.find(p => p.program_code === pattern.programCode) || null;
              break;
            }
          }
          if (matchedProgram) break;
        }
        
        if (!matchedProgram) {
          // No GWAC match found
          unlinked++;
          continue;
        }
        
        // Step 4: Try to match to contract holder
        const { data: contractHolder } = await supabase
          .from('gwac_contract_holders')
          .select('id')
          .eq('gwac_program_id', matchedProgram.id)
          .or(`company_name.ilike.%${contract.vendor_name}%,vendor_uei.eq.${contract.vendor_uei || ''},vendor_duns.eq.${contract.vendor_duns || ''}`)
          .limit(1)
          .single();
        
        // Step 5: Create gwac_task_orders record
        if (!dryRun) {
          const { error: insertError } = await supabase
            .from('gwac_task_orders')
            .insert({
              fpds_contract_id: contract.id,
              contract_holder_id: contractHolder?.id || null,
              gwac_program_id: matchedProgram.id,
              task_order_number: contract.piid,
              parent_gwac_piid: contract.referenced_idv_piid,
              ordering_agency_name: contract.contracting_agency_name,
              ordering_agency_id: contract.contracting_agency_id,
              ordering_office_name: contract.contracting_office_name,
              task_order_value: contract.base_and_exercised_options_value,
              obligated_amount: contract.dollars_obligated,
              award_date: contract.date_signed,
              period_of_performance_start: contract.period_of_performance_start,
              period_of_performance_end: contract.period_of_performance_end,
              description: contract.description_of_requirement
            });
          
          if (insertError) {
            console.error(`[GWAC Linker] Error inserting task order ${contract.piid}:`, insertError);
            errors++;
            continue;
          }
        }
        
        linked++;
        byProgram[matchedProgram.program_name] = (byProgram[matchedProgram.program_name] || 0) + 1;
        
        // Log progress every 100
        if (linked % 100 === 0) {
          console.log(`[GWAC Linker] Linked ${linked}/${totalFound} task orders...`);
        }
        
      } catch (err) {
        console.error(`[GWAC Linker] Error processing contract ${contract.piid}:`, err);
        errors++;
      }
    }
    
    console.log('[GWAC Linker] Linking complete!');
    console.log(`  Total Found: ${totalFound}`);
    console.log(`  Linked: ${linked}`);
    console.log(`  Unlinked: ${unlinked}`);
    console.log(`  Errors: ${errors}`);
    console.log('  By Program:');
    Object.entries(byProgram).forEach(([program, count]) => {
      console.log(`    ${program}: ${count}`);
    });
    
    // Step 6: Update contract holder statistics
    if (!dryRun && linked > 0) {
      console.log('[GWAC Linker] Updating contract holder statistics...');
      await updateContractHolderStats();
    }
    
    return {
      success: true,
      totalFound,
      linked,
      unlinked,
      errors,
      byProgram
    };
    
  } catch (error) {
    console.error('[GWAC Linker] Fatal error:', error);
    return {
      success: false,
      totalFound,
      linked,
      unlinked,
      errors: errors + 1,
      byProgram
    };
  }
}

// ============================================
// Update Contract Holder Statistics
// ============================================

async function updateContractHolderStats(): Promise<void> {
  try {
    // Get all contract holders
    const { data: holders, error } = await supabase
      .from('gwac_contract_holders')
      .select('id');
    
    if (error) throw error;
    if (!holders) return;
    
    console.log(`[GWAC Linker] Updating stats for ${holders.length} contract holders...`);
    
    for (const holder of holders) {
      // Aggregate task order data
      const { data: stats } = await supabase
        .from('gwac_task_orders')
        .select('task_order_value, obligated_amount, award_date, ordering_agency_name')
        .eq('contract_holder_id', holder.id);
      
      if (!stats || stats.length === 0) continue;
      
      const totalTaskOrders = stats.length;
      const totalTaskOrderValue = stats.reduce((sum, t) => sum + (t.task_order_value || 0), 0);
      const totalObligated = stats.reduce((sum, t) => sum + (t.obligated_amount || 0), 0);
      
      const dates = stats.map(t => t.award_date).filter(Boolean).sort();
      const firstTaskOrderDate = dates[0] || null;
      const mostRecentTaskOrderDate = dates[dates.length - 1] || null;
      
      // Get unique agencies
      const agencies = [...new Set(stats.map(t => t.ordering_agency_name).filter(Boolean))];
      const topOrderingAgencies = agencies.slice(0, 10); // Top 10
      
      // Update contract holder record
      await supabase
        .from('gwac_contract_holders')
        .update({
          total_task_orders: totalTaskOrders,
          total_task_order_value: totalTaskOrderValue,
          total_obligated: totalObligated,
          first_task_order_date: firstTaskOrderDate,
          most_recent_task_order_date: mostRecentTaskOrderDate,
          top_ordering_agencies: topOrderingAgencies,
          last_updated: new Date().toISOString()
        })
        .eq('id', holder.id);
    }
    
    console.log('[GWAC Linker] Contract holder stats updated successfully');
    
  } catch (error) {
    console.error('[GWAC Linker] Error updating contract holder stats:', error);
  }
}

// ============================================
// Identify Potential GWAC Contracts in FPDS
// ============================================
// Utility function to scan FPDS and report potential GWAC contracts

export async function identifyGWACContracts(options?: {
  limit?: number;
}): Promise<{
  totalTaskOrders: number;
  potentialGWACs: Record<string, number>;
  uniqueParentPIIDs: string[];
}> {
  
  const { limit } = options || {};
  
  console.log('[GWAC Identifier] Scanning FPDS for potential GWAC contracts...');
  
  let query = supabase
    .from('fpds_contracts')
    .select('referenced_idv_piid')
    .not('referenced_idv_piid', 'is', null);
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  if (!data) return { totalTaskOrders: 0, potentialGWACs: {}, uniqueParentPIIDs: [] };
  
  const totalTaskOrders = data.length;
  const potentialGWACs: Record<string, number> = {};
  const parentPIIDs = new Set<string>();
  
  for (const row of data) {
    const piid = row.referenced_idv_piid;
    parentPIIDs.add(piid);
    
    // Check against patterns
    for (const pattern of GWAC_PATTERNS) {
      for (const piidPattern of pattern.piidPatterns) {
        const regex = new RegExp(piidPattern.replace('%', '.*'), 'i');
        if (regex.test(piid)) {
          potentialGWACs[pattern.programName] = (potentialGWACs[pattern.programName] || 0) + 1;
          break;
        }
      }
    }
  }
  
  console.log('[GWAC Identifier] Scan complete!');
  console.log(`  Total Task Orders: ${totalTaskOrders}`);
  console.log(`  Unique Parent PIIDs: ${parentPIIDs.size}`);
  console.log('  Potential GWAC Matches:');
  Object.entries(potentialGWACs).forEach(([program, count]) => {
    console.log(`    ${program}: ${count} task orders`);
  });
  
  return {
    totalTaskOrders,
    potentialGWACs,
    uniqueParentPIIDs: Array.from(parentPIIDs).sort()
  };
}

// ============================================
// CLI Test Function
// ============================================

if (require.main === module) {
  // Run directly from command line for testing
  const command = process.argv[2];
  
  if (command === 'identify') {
    // Identify potential GWAC contracts in FPDS
    identifyGWACContracts({ limit: 10000 })
      .then(results => {
        console.log('\n=== IDENTIFICATION COMPLETE ===');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else if (command === 'link') {
    // Link FPDS to GWAC (dry run by default)
    const dryRun = process.argv[3] !== '--for-real';
    linkFPDSToGWAC({ dryRun })
      .then(results => {
        console.log('\n=== LINKING COMPLETE ===');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  ts-node src/lib/gwac-fpds-linker.ts identify    # Identify potential GWAC contracts');
    console.log('  ts-node src/lib/gwac-fpds-linker.ts link        # Link FPDS to GWAC (dry run)');
    console.log('  ts-node src/lib/gwac-fpds-linker.ts link --for-real  # Actually write to database');
    process.exit(1);
  }
}

