/**
 * Apply Congressional Trades SQL Migration
 * Uses Supabase Management API to execute SQL
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('APPLYING CONGRESSIONAL TRADES MIGRATION');
  console.log('='.repeat(60) + '\n');

  // Load env
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  } catch (e) {
    // Already loaded
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  console.log('📍 Project:', projectRef);
  console.log('');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'supabase/migrations/create_congressional_trades.sql');
  const fullSql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Loaded SQL file:', (fullSql.length / 1024).toFixed(2), 'KB\n');

  // Since we can't execute via Supabase client directly, provide instructions
  console.log('=' + '='.repeat(59));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('=' + '='.repeat(59));
  console.log('');
  console.log('The SQL migration needs to be run manually via the Supabase Dashboard.');
  console.log('');
  console.log('📋 STEPS:');
  console.log('');
  console.log('1. Open Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('');
  console.log('2. Copy the SQL file contents:');
  console.log(`   File: ${sqlPath}`);
  console.log('');
  console.log('3. Paste into the SQL editor and click "RUN"');
  console.log('');
  console.log('4. Verify success - should see:');
  console.log('   - Tables created');
  console.log('   - Views created  ');
  console.log('   - Functions created');
  console.log('   - "Congressional Trades Schema Created!" message');
  console.log('');
  console.log('5. Then run verification:');
  console.log('   npx tsx test-congressional-trades-schema.ts');
  console.log('');
  console.log('=' + '='.repeat(59));
  console.log('');

  // Write a simplified SQL to a temporary file for easy copy-paste
  const tempPath = path.join(process.cwd(), 'TEMP_MIGRATION_TO_COPY.sql');
  fs.writeFileSync(tempPath, fullSql);
  console.log('✅ SQL also saved to: TEMP_MIGRATION_TO_COPY.sql');
  console.log('   (for easy copy-paste)');
  console.log('');

  // Open the file in default editor (optional)
  console.log('💡 TIP: Opening SQL editor URL...');
  const { exec } = require('child_process');
  exec(`open "https://supabase.com/dashboard/project/${projectRef}/sql/new"`, (error: any) => {
    if (error) {
      console.log('   (Could not auto-open browser)');
    } else {
      console.log('   Browser should open automatically');
    }
  });

  console.log('');
}

main().catch(console.error);

