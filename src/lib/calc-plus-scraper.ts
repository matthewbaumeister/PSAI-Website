// ============================================
// CALC+ API Scraper for GSA MAS Labor Rates
// ============================================
// Scrapes labor category rates from GSA CALC+ (Contract-Awarded Labor Category)
// 
// CALC+ API: https://calc.gsa.gov/api/
// Documentation: https://open.gsa.gov/api/dx-calc-api/
//
// What it provides:
// - Labor category rates from GSA MAS contracts
// - Not-to-Exceed (NTE) ceiling rates
// - Searchable by category, contract, vendor
// - FREE public API, no key required
//
// Data is updated regularly by GSA
// ============================================

import { createClient } from '@supabase/supabase-js';

const CALC_PLUS_API = 'https://calc.gsa.gov/api';

// Lazy-load Supabase client only when needed
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not found. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ============================================
// Types
// ============================================

interface CalcPlusRate {
  id: number;
  labor_category: string;
  education_level: string | null;
  min_years_experience: number;
  hourly_rate_year1: number;
  current_price: number;
  vendor_name: string;
  contract_number: string;
  contract_start: string;
  contract_end: string;
  sin: string; // Special Item Number
  business_size: string; // 's' = small, 'o' = other
  schedule: string; // Usually 'MAS' for Multiple Award Schedule
  contractor_site: string | null;
  location?: string;
  education?: string;
}

interface CalcPlusResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CalcPlusRate[];
}

// ============================================
// Search CALC+ Rates
// ============================================

export async function searchCalcPlusRates(options: {
  laborCategory?: string;
  contractNumber?: string;
  vendorName?: string;
  minExperience?: number;
  maxExperience?: number;
  education?: string;
  sin?: string;
  page?: number;
  limit?: number;
}): Promise<CalcPlusResponse> {
  
  const {
    laborCategory,
    contractNumber,
    vendorName,
    minExperience,
    maxExperience,
    education,
    sin,
    page = 1,
    limit = 100
  } = options;
  
  // Build query parameters
  const params = new URLSearchParams();
  
  if (laborCategory) params.append('q', laborCategory);
  if (contractNumber) params.append('contract_number', contractNumber);
  if (vendorName) params.append('vendor_name', vendorName);
  if (minExperience) params.append('min_years_experience', minExperience.toString());
  if (maxExperience) params.append('max_years_experience', maxExperience.toString());
  if (education) params.append('education', education);
  if (sin) params.append('sin', sin);
  
  params.append('page', page.toString());
  params.append('page_size', limit.toString());
  
  const url = `${CALC_PLUS_API}/rates/?${params.toString()}`;
  
  console.log(`[CALC+] Fetching: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`CALC+ API error: ${response.status} ${response.statusText}`);
  }
  
  const data: CalcPlusResponse = await response.json();
  
  console.log(`[CALC+] Found ${data.results.length} rates (total: ${data.count})`);
  
  return data;
}

// ============================================
// Get Contract Details
// ============================================

export async function getCalcPlusContract(contractNumber: string): Promise<any> {
  const url = `${CALC_PLUS_API}/contracts/${contractNumber}/`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`CALC+ API error: ${response.status}`);
  }
  
  return await response.json();
}

// ============================================
// Scrape All Rates for a Contract
// ============================================

export async function scrapeContractRates(contractNumber: string): Promise<{
  success: boolean;
  contractNumber: string;
  ratesFound: number;
  ratesInserted: number;
  ratesUpdated: number;
  errors: number;
}> {
  
  console.log(`[CALC+] Scraping rates for contract ${contractNumber}`);
  
  let ratesFound = 0;
  let ratesInserted = 0;
  let ratesUpdated = 0;
  let errors = 0;
  let page = 1;
  let hasMore = true;
  
  try {
    const supabase = getSupabase();
    
    // Get or create contract vehicle
    const { data: vehicle } = await supabase
      .from('contract_vehicles')
      .select('id')
      .eq('contract_number', contractNumber)
      .single();
    
    let vehicleId = vehicle?.id;
    
    if (!vehicleId) {
      // Contract doesn't exist, try to fetch details from CALC+
      const contractDetails = await getCalcPlusContract(contractNumber);
      
      if (contractDetails) {
        const { data: newVehicle, error: insertError } = await supabase
          .from('contract_vehicles')
          .insert({
            vehicle_type: 'GSA_MAS',
            program_code: 'MAS',
            contract_number: contractNumber,
            contract_type: 'IT Services',
            managing_agency: 'GSA',
            status: 'Active',
            award_date: contractDetails.contract_start,
            base_period_end: contractDetails.contract_end
          })
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        vehicleId = newVehicle.id;
        console.log(`[CALC+] Created vehicle record for ${contractNumber}`);
      } else {
        console.log(`[CALC+] Contract ${contractNumber} not found in CALC+`);
        return { success: false, contractNumber, ratesFound: 0, ratesInserted: 0, ratesUpdated: 0, errors: 1 };
      }
    }
    
    // Paginate through all rates
    while (hasMore) {
      const response = await searchCalcPlusRates({
        contractNumber,
        page,
        limit: 100
      });
      
      ratesFound += response.results.length;
      
      // Process each rate
      for (const rate of response.results) {
        try {
          // Check if rate exists
          const { data: existing } = await supabase
            .from('labor_rates')
            .select('id')
            .eq('contract_number', contractNumber)
            .eq('labor_category', rate.labor_category)
            .eq('min_years_experience', rate.min_years_experience)
            .single();
          
          const rateData = {
            vehicle_id: vehicleId,
            company_name: rate.vendor_name,
            contract_number: rate.contract_number,
            data_source: 'CALC+',
            sin: rate.sin,
            labor_category: rate.labor_category,
            min_years_experience: rate.min_years_experience,
            education_requirement: rate.education_level,
            year1_rate: rate.hourly_rate_year1,
            current_year_rate: rate.current_price,
            location: rate.location || 'CONUS',
            calc_id: rate.id,
            calc_last_updated: new Date().toISOString()
          };
          
          if (existing) {
            // Update existing rate
            await supabase
              .from('labor_rates')
              .update(rateData)
              .eq('id', existing.id);
            
            ratesUpdated++;
          } else {
            // Insert new rate
            await supabase
              .from('labor_rates')
              .insert(rateData);
            
            ratesInserted++;
          }
          
        } catch (err) {
          console.error(`[CALC+] Error processing rate for ${rate.labor_category}:`, err);
          errors++;
        }
      }
      
      // Check for more pages
      hasMore = response.next !== null;
      page++;
      
      console.log(`[CALC+] Processed page ${page - 1}, total rates: ${ratesFound}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[CALC+] Scraping complete for ${contractNumber}`);
    console.log(`  Rates Found: ${ratesFound}`);
    console.log(`  Inserted: ${ratesInserted}`);
    console.log(`  Updated: ${ratesUpdated}`);
    console.log(`  Errors: ${errors}`);
    
    return {
      success: true,
      contractNumber,
      ratesFound,
      ratesInserted,
      ratesUpdated,
      errors
    };
    
  } catch (error) {
    console.error(`[CALC+] Fatal error scraping ${contractNumber}:`, error);
    return {
      success: false,
      contractNumber,
      ratesFound,
      ratesInserted,
      ratesUpdated,
      errors: errors + 1
    };
  }
}

// ============================================
// Scrape by Labor Category (across all contracts)
// ============================================

export async function scrapeLaborCategoryRates(
  laborCategory: string,
  options?: {
    limit?: number;
    minExperience?: number;
    maxExperience?: number;
  }
): Promise<{
  success: boolean;
  laborCategory: string;
  ratesFound: number;
  ratesInserted: number;
  ratesUpdated: number;
  uniqueContracts: number;
}> {
  
  const { limit, minExperience, maxExperience } = options || {};
  
  console.log(`[CALC+] Scraping rates for labor category: ${laborCategory}`);
  
  let ratesFound = 0;
  let ratesInserted = 0;
  let ratesUpdated = 0;
  const contractsProcessed = new Set<string>();
  
  try {
    const supabase = getSupabase();
    let page = 1;
    let hasMore = true;
    let processedCount = 0;
    
    while (hasMore && (!limit || processedCount < limit)) {
      const response = await searchCalcPlusRates({
        laborCategory,
        minExperience,
        maxExperience,
        page,
        limit: 100
      });
      
      if (response.results.length === 0) break;
      
      ratesFound += response.results.length;
      
      for (const rate of response.results) {
        if (limit && processedCount >= limit) break;
        
        contractsProcessed.add(rate.contract_number);
        
        try {
          // Get or create vehicle
          let { data: vehicle } = await supabase
            .from('contract_vehicles')
            .select('id')
            .eq('contract_number', rate.contract_number)
            .single();
          
          if (!vehicle) {
            const { data: newVehicle } = await supabase
              .from('contract_vehicles')
              .insert({
                vehicle_type: 'GSA_MAS',
                program_code: 'MAS',
                contract_number: rate.contract_number,
                contract_type: 'IT Services',
                managing_agency: 'GSA',
                status: 'Active'
              })
              .select('id')
              .single();
            
            vehicle = newVehicle;
          }
          
          if (!vehicle) continue;
          
          // Check if rate exists
          const { data: existing } = await supabase
            .from('labor_rates')
            .select('id')
            .eq('contract_number', rate.contract_number)
            .eq('labor_category', rate.labor_category)
            .eq('min_years_experience', rate.min_years_experience)
            .single();
          
          const rateData = {
            vehicle_id: vehicle.id,
            company_name: rate.vendor_name,
            contract_number: rate.contract_number,
            data_source: 'CALC+',
            sin: rate.sin,
            labor_category: rate.labor_category,
            min_years_experience: rate.min_years_experience,
            education_requirement: rate.education_level,
            year1_rate: rate.hourly_rate_year1,
            current_year_rate: rate.current_price,
            location: 'CONUS',
            calc_id: rate.id,
            calc_last_updated: new Date().toISOString()
          };
          
          if (existing) {
            await supabase.from('labor_rates').update(rateData).eq('id', existing.id);
            ratesUpdated++;
          } else {
            await supabase.from('labor_rates').insert(rateData);
            ratesInserted++;
          }
          
          processedCount++;
          
        } catch (err) {
          console.error(`[CALC+] Error processing rate:`, err);
        }
      }
      
      hasMore = response.next !== null;
      page++;
      
      console.log(`[CALC+] Processed page ${page - 1}, total: ${processedCount}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[CALC+] Scraping complete for "${laborCategory}"`);
    console.log(`  Rates Found: ${ratesFound}`);
    console.log(`  Inserted: ${ratesInserted}`);
    console.log(`  Updated: ${ratesUpdated}`);
    console.log(`  Unique Contracts: ${contractsProcessed.size}`);
    
    return {
      success: true,
      laborCategory,
      ratesFound,
      ratesInserted,
      ratesUpdated,
      uniqueContracts: contractsProcessed.size
    };
    
  } catch (error) {
    console.error(`[CALC+] Fatal error:`, error);
    return {
      success: false,
      laborCategory,
      ratesFound,
      ratesInserted,
      ratesUpdated,
      uniqueContracts: contractsProcessed.size
    };
  }
}

// ============================================
// Bulk Scrape Popular Labor Categories
// ============================================

export async function scrapePopularLaborCategories(): Promise<{
  success: boolean;
  categoriesProcessed: number;
  totalRates: number;
  results: any[];
}> {
  
  const popularCategories = [
    'Software Engineer',
    'Senior Software Engineer',
    'Project Manager',
    'Senior Project Manager',
    'Business Analyst',
    'Senior Business Analyst',
    'Systems Analyst',
    'Database Administrator',
    'Network Engineer',
    'Security Specialist',
    'Cybersecurity Analyst',
    'DevOps Engineer',
    'Cloud Architect',
    'Data Scientist',
    'UX Designer',
    'Technical Writer',
    'Help Desk Technician',
    'IT Support Specialist'
  ];
  
  console.log(`[CALC+] Starting bulk scrape of ${popularCategories.length} popular labor categories`);
  
  const results = [];
  let totalRates = 0;
  
  for (const category of popularCategories) {
    try {
      const result = await scrapeLaborCategoryRates(category, { limit: 200 });
      results.push(result);
      totalRates += result.ratesInserted + result.ratesUpdated;
      
      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[CALC+] Error scraping ${category}:`, err);
      results.push({ success: false, laborCategory: category, error: err });
    }
  }
  
  console.log(`[CALC+] Bulk scrape complete!`);
  console.log(`  Categories Processed: ${results.filter(r => r.success).length}`);
  console.log(`  Total Rates: ${totalRates}`);
  
  return {
    success: true,
    categoriesProcessed: results.filter(r => r.success).length,
    totalRates,
    results
  };
}

// ============================================
// CLI Test Function
// ============================================

if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  if (command === 'search') {
    // Search for labor category
    searchCalcPlusRates({ laborCategory: arg || 'Software Engineer', limit: 10 })
      .then(results => {
        console.log('\n=== SEARCH RESULTS ===');
        console.log(`Found ${results.count} total results`);
        console.log('\nFirst 10 results:');
        results.results.forEach(rate => {
          console.log(`  ${rate.labor_category} (${rate.min_years_experience}yr) - $${rate.current_price}/hr - ${rate.vendor_name} (${rate.contract_number})`);
        });
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else if (command === 'contract') {
    // Scrape all rates for a contract
    if (!arg) {
      console.error('Error: Please provide contract number');
      console.error('Usage: ts-node src/lib/calc-plus-scraper.ts contract GS35F0119Y');
      process.exit(1);
    }
    scrapeContractRates(arg)
      .then(results => {
        console.log('\n=== SCRAPING COMPLETE ===');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else if (command === 'category') {
    // Scrape all rates for a labor category
    if (!arg) {
      console.error('Error: Please provide labor category');
      console.error('Usage: ts-node src/lib/calc-plus-scraper.ts category "Software Engineer"');
      process.exit(1);
    }
    scrapeLaborCategoryRates(arg)
      .then(results => {
        console.log('\n=== SCRAPING COMPLETE ===');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else if (command === 'popular') {
    // Scrape popular labor categories
    scrapePopularLaborCategories()
      .then(results => {
        console.log('\n=== BULK SCRAPING COMPLETE ===');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  ts-node src/lib/calc-plus-scraper.ts search [category]         # Search CALC+ for rates');
    console.log('  ts-node src/lib/calc-plus-scraper.ts contract GS35F0119Y      # Scrape all rates for contract');
    console.log('  ts-node src/lib/calc-plus-scraper.ts category "Software Engineer"  # Scrape rates for labor category');
    console.log('  ts-node src/lib/calc-plus-scraper.ts popular                  # Scrape popular labor categories');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node src/lib/calc-plus-scraper.ts search "Project Manager"');
    console.log('  ts-node src/lib/calc-plus-scraper.ts contract GS35F0119Y');
    console.log('  ts-node src/lib/calc-plus-scraper.ts category "Cybersecurity Analyst"');
    process.exit(1);
  }
}

