#!/usr/bin/env ts-node
/**
 * Run GSA/GWAC Migration via Supabase Admin Client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('============================================================');
  console.log('GSA/GWAC Migration Runner');
  console.log('============================================================');
  console.log();

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/create_gsa_gwac_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`ERROR: Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`Reading migration file: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`Migration size: ${sql.length} characters`);
  console.log();

  // Execute SQL via RPC
  console.log('Executing migration...');
  console.log('------------------------------------------------------------');

  try {
    // Use Supabase's SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Check if it's a benign error (tables already exist)
      if (error.message.includes('already exists')) {
        console.log('✓ Tables already exist (migration was run before)');
        console.log('------------------------------------------------------------');
        return true;
      } else {
        console.error('✗ Migration failed:', error.message);
        console.log('------------------------------------------------------------');
        return false;
      }
    }

    console.log('✓ Migration executed successfully!');
    console.log('------------------------------------------------------------');
    return true;

  } catch (e: any) {
    // Try alternative method: execute in chunks
    console.log('Trying alternative execution method...');
    console.log();
    
    return await runMigrationInChunks(sql);
  }
}

async function runMigrationInChunks(sql: string): Promise<boolean> {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} statements...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          // Benign error
          successCount++;
        } else {
          console.error(`✗ Statement ${i + 1} failed: ${preview}...`);
          console.error(`  Error: ${error.message}`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (e: any) {
      console.error(`✗ Statement ${i + 1} failed: ${preview}...`);
      errorCount++;
    }
  }

  console.log();
  console.log(`Results: ${successCount} succeeded, ${errorCount} failed`);
  console.log('------------------------------------------------------------');

  return errorCount === 0;
}

async function verifyTables() {
  console.log();
  console.log('============================================================');
  console.log('Verifying Tables');
  console.log('============================================================');
  console.log();

  const tables = [
    'gsa_schedule_holders',
    'gwac_holders',
    'gsa_sin_catalog',
    'gwac_catalog',
    'gsa_gwac_scraper_log'
  ];

  console.log('Checking tables...');
  let allExist = true;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`✗ Table missing or error: ${table}`);
        console.log(`  ${error.message}`);
        allExist = false;
      } else {
        console.log(`✓ Table exists: ${table} (${count || 0} records)`);
      }
    } catch (e: any) {
      console.log(`✗ Table error: ${table}`);
      allExist = false;
    }
  }

  console.log();

  // Check gwac_catalog seed data
  try {
    const { data: gwacs, error } = await supabase
      .from('gwac_catalog')
      .select('gwac_name')
      .order('gwac_name');

    if (error) {
      console.log('⚠ Could not check gwac_catalog seed data');
    } else if (gwacs && gwacs.length > 0) {
      console.log(`✓ gwac_catalog has ${gwacs.length} seed records:`);
      gwacs.slice(0, 5).forEach(g => console.log(`  - ${g.gwac_name}`));
      if (gwacs.length > 5) {
        console.log(`  ... and ${gwacs.length - 5} more`);
      }
    } else {
      console.log('⚠ gwac_catalog is empty (should have 11 seed GWACs)');
    }
  } catch (e: any) {
    console.log('⚠ Could not verify gwac_catalog');
  }

  console.log();

  return allExist;
}

async function main() {
  const migrationSuccess = await runMigration();
  const tablesExist = await verifyTables();

  console.log('============================================================');
  console.log('Summary');
  console.log('============================================================');
  console.log();

  if (migrationSuccess && tablesExist) {
    console.log('✓ Migration completed successfully!');
    console.log('✓ All tables verified!');
    console.log();
    console.log('Database is ready for GSA/GWAC data collection!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Download GSA schedule data: ./setup-gsa-gwac.sh');
    console.log('  2. Or manually: visit https://www.gsaelibrary.gsa.gov');
    console.log('  3. Run scrapers when data is ready');
    console.log();
    console.log('YOU CAN NOW RUN THE SCRAPERS!');
    process.exit(0);
  } else {
    console.log('⚠ Migration may have had issues');
    console.log();
    console.log('Alternative: Run via Supabase Dashboard SQL Editor');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Open SQL Editor');
    console.log('  3. Copy/paste from: supabase/migrations/create_gsa_gwac_tables.sql');
    console.log('  4. Click "Run"');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});

