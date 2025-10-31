#!/usr/bin/env ts-node
// ============================================
// SBIR Awards Bulk Import Script
// ============================================
// 
// This script imports SBIR awards data from JSON/CSV files
// provided by SBIR.gov support team or downloaded from sbir.gov
//
// Usage:
// 1. Place data files in: data/sbir-awards/
// 2. Run: npx ts-node src/scripts/import-sbir-awards-bulk.ts
//

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Data directory
const DATA_DIR = path.join(process.cwd(), 'data/sbir-awards');

// ============================================
// Helper Functions
// ============================================

function parseAwardAmount(amountStr?: string): number | null {
  if (!amountStr) return null;
  
  // Remove $, commas, and spaces
  const cleaned = amountStr.toString().replace(/[\$,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? null : amount;
}

function normalizePhase(phase?: string): 'Phase I' | 'Phase II' | 'Phase III' {
  if (!phase) return 'Phase I';
  
  const normalized = phase.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normalized.includes('phase2') || normalized.includes('phaseii') || normalized.includes('ii')) {
    return 'Phase II';
  } else if (normalized.includes('phase3') || normalized.includes('phaseiii') || normalized.includes('iii')) {
    return 'Phase III';
  } else {
    return 'Phase I';
  }
}

function normalizeProgram(program?: string): 'SBIR' | 'STTR' {
  if (!program) return 'SBIR';
  return program.toUpperCase().includes('STTR') ? 'STTR' : 'SBIR';
}

/**
 * Normalize award data from API format to database format
 */
function normalizeAward(raw: any): any {
  return {
    contract_award_number: raw.contract || raw.contract_award_number || `UNKNOWN-${Date.now()}`,
    award_year: parseInt(raw.award_year || raw.year || '0'),
    award_date: raw.proposal_award_date || raw.award_date || null,
    
    topic_number: raw.topic_code || raw.topic_number || null,
    solicitation_id: raw.solicitation_number || raw.solicitation_id || null,
    solicitation_number: raw.solicitation_number || null,
    
    award_title: raw.award_title || raw.title || 'Untitled',
    abstract: raw.abstract || null,
    phase: normalizePhase(raw.phase),
    program: normalizeProgram(raw.program),
    award_amount: parseAwardAmount(raw.award_amount),
    
    agency: raw.agency || 'Unknown',
    agency_id: raw.agency || raw.agency_id || 'UNKNOWN',
    branch_of_service: raw.branch || raw.branch_of_service || null,
    component: raw.branch || raw.component || null,
    
    company: raw.firm || raw.company || raw.company_name || 'Unknown Company',
    duns: raw.duns || null,
    uei: raw.uei || null,
    firm_address: raw.address1 ? `${raw.address1}${raw.address2 ? ' ' + raw.address2 : ''}` : (raw.firm_address || null),
    firm_city: raw.city || raw.firm_city || null,
    firm_state: raw.state || raw.firm_state || null,
    firm_zip: raw.zip || raw.firm_zip || null,
    firm_phone: raw.poc_phone || raw.firm_phone || null,
    firm_website: raw.company_url || raw.firm_website || null,
    
    hubzone_owned: raw.hubzone_owned === 'Y' || raw.hubzone_owned === true,
    woman_owned: raw.women_owned === 'Y' || raw.woman_owned === 'Y' || raw.woman_owned === true,
    socially_economically_disadvantaged: raw.socially_economically_disadvantaged === 'Y' || raw.socially_economically_disadvantaged === true,
    veteran_owned: false, // Not typically in API data
    
    research_institution: raw.ri_name || raw.research_institution || null,
    
    program_manager: raw.poc_name || raw.program_manager || null,
    program_manager_email: raw.poc_email || raw.program_manager_email || null,
    program_manager_phone: raw.poc_phone || raw.program_manager_phone || null,
    
    keywords: raw.research_area_keywords 
      ? (typeof raw.research_area_keywords === 'string' 
        ? raw.research_area_keywords.split(',').map((k: string) => k.trim()) 
        : raw.research_area_keywords)
      : (raw.keywords || null),
    
    data_source: 'sbir.gov',
    last_scraped: new Date().toISOString(),
  };
}

/**
 * Batch insert awards into database
 */
async function batchInsertAwards(awards: any[], batchSize: number = 100) {
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < awards.length; i += batchSize) {
    const batch = awards.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('sbir_awards')
        .upsert(batch, {
          onConflict: 'contract_award_number',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error(`[Batch ${Math.floor(i / batchSize) + 1}] Error:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`[Batch ${Math.floor(i / batchSize) + 1}] Inserted ${data?.length || 0} awards`);
      }
    } catch (error) {
      console.error(`[Batch ${Math.floor(i / batchSize) + 1}] Exception:`, error);
      errors += batch.length;
    }
  }
  
  return { inserted, errors };
}

/**
 * Process a single JSON file
 */
async function processJSONFile(filePath: string) {
  console.log(`\n[Processing] ${path.basename(filePath)}`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    
    // Handle different JSON structures
    let awards: any[] = [];
    
    if (Array.isArray(rawData)) {
      awards = rawData;
    } else if (rawData.response?.docs) {
      // SBIR.gov API response format
      awards = rawData.response.docs;
    } else if (rawData.docs) {
      awards = rawData.docs;
    } else if (rawData.awards) {
      awards = rawData.awards;
    } else if (rawData.data) {
      awards = rawData.data;
    } else {
      console.error('❌ Unknown JSON structure');
      return { processed: 0, inserted: 0, errors: 0 };
    }
    
    console.log(`  Found ${awards.length} awards in file`);
    
    // Normalize awards
    const normalizedAwards = awards.map(normalizeAward);
    
    // Insert to database
    const result = await batchInsertAwards(normalizedAwards);
    
    console.log(`  ✅ Inserted: ${result.inserted}, Errors: ${result.errors}`);
    
    return {
      processed: awards.length,
      inserted: result.inserted,
      errors: result.errors
    };
    
  } catch (error) {
    console.error('❌ Error processing file:', error);
    return { processed: 0, inserted: 0, errors: 0 };
  }
}

/**
 * Process a single CSV file
 */
async function processCSVFile(filePath: string) {
  console.log(`\n[Processing] ${path.basename(filePath)}`);
  console.log('  CSV processing not yet implemented');
  console.log('  Please convert CSV to JSON or request JSON format from SBIR.gov');
  return { processed: 0, inserted: 0, errors: 0 };
}

// ============================================
// Main Import Function
// ============================================

async function main() {
  console.log('============================================');
  console.log('SBIR Awards Bulk Import Script');
  console.log('============================================\n');
  
  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`);
    console.log('\nPlease create the directory and add data files:');
    console.log(`  mkdir -p ${DATA_DIR}`);
    console.log(`  # Then add your JSON/CSV files to this directory`);
    process.exit(1);
  }
  
  // Get all JSON and CSV files
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
    .map(f => path.join(DATA_DIR, f));
  
  if (files.length === 0) {
    console.error(`❌ No JSON or CSV files found in ${DATA_DIR}`);
    console.log('\nPlease add data files to the directory:');
    console.log(`  - DOD_2024.json`);
    console.log(`  - NASA_2024.json`);
    console.log(`  - etc.`);
    process.exit(1);
  }
  
  console.log(`Found ${files.length} data files:\n`);
  files.forEach(f => console.log(`  - ${path.basename(f)}`));
  console.log('');
  
  // Process all files
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    let result;
    
    if (file.endsWith('.json')) {
      result = await processJSONFile(file);
    } else if (file.endsWith('.csv')) {
      result = await processCSVFile(file);
    } else {
      continue;
    }
    
    totalProcessed += result.processed;
    totalInserted += result.inserted;
    totalErrors += result.errors;
  }
  
  // Summary
  console.log('\n============================================');
  console.log('Import Complete!');
  console.log('============================================\n');
  console.log(`Total awards processed: ${totalProcessed}`);
  console.log(`Total awards inserted:  ${totalInserted}`);
  console.log(`Total errors:           ${totalErrors}`);
  console.log('');
  
  // Get current database stats
  const { count } = await supabase
    .from('sbir_awards')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total awards in database: ${count || 0}`);
  console.log('');
  
  if (totalInserted > 0) {
    console.log('✅ SUCCESS! Awards data imported successfully.');
    console.log('\nNext steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Build company profiles (aggregate data)');
    console.log('3. Create topic-award linkages');
    console.log('4. Display awards on opportunity pages');
  } else {
    console.log('⚠️  No awards were inserted. Please check errors above.');
  }
  
  console.log('');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

