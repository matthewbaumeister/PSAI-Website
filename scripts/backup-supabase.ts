/**
 * Supabase Backup Script
 * Exports all data from important tables to JSON files
 * Run with: tsx scripts/backup-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing environment variables!')
  console.error('Please ensure .env.local has:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// List all tables you want to backup
const TABLES_TO_BACKUP = [
  'users',
  'opportunities',
  'sbir_final',
  'fpds_contracts',
  'dod_news',
  'congressional_trades',
  'army_innovation',
  'mantech_articles',
  'dsip_opportunities',
  'gsa_gwac_holders',
  'gsa_mas_pricing',
  'publications',
  'scraper_logs',
  // Add any other important tables
]

async function backupTable(tableName: string, backupDir: string) {
  try {
    console.log(`\nBacking up table: ${tableName}`)
    
    // Fetch all data from table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error(`Error backing up ${tableName}:`, error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log(`  ├─ Table is empty, skipping`)
      return
    }
    
    // Save to JSON file
    const filename = path.join(backupDir, `${tableName}.json`)
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))
    
    console.log(`  ├─ Records: ${count || data.length}`)
    console.log(`  └─ Saved to: ${filename}`)
  } catch (err) {
    console.error(`Failed to backup ${tableName}:`, err)
  }
}

async function getAllTables() {
  try {
    // Query to get all public tables
    const { data, error } = await supabase.rpc('get_public_tables' as any)
    
    if (error) {
      console.log('Could not fetch table list automatically. Using predefined list.')
      return TABLES_TO_BACKUP
    }
    
    return data.map((row: any) => row.tablename)
  } catch {
    return TABLES_TO_BACKUP
  }
}

async function main() {
  console.log('=================================')
  console.log('Supabase Backup Tool')
  console.log('=================================')
  console.log(`Project: ${supabaseUrl}`)
  
  // Create backup directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const backupDir = path.join(process.cwd(), 'backups', `backup_${timestamp}`)
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  console.log(`Backup directory: ${backupDir}\n`)
  
  // Get list of tables
  const tables = await getAllTables()
  console.log(`Found ${tables.length} tables to backup\n`)
  
  // Backup each table
  for (const table of tables) {
    await backupTable(table, backupDir)
  }
  
  // Create metadata file
  const metadata = {
    backupDate: new Date().toISOString(),
    supabaseUrl,
    tablesBackedUp: tables.length,
    backupDir
  }
  
  fs.writeFileSync(
    path.join(backupDir, '_metadata.json'),
    JSON.stringify(metadata, null, 2)
  )
  
  console.log('\n=================================')
  console.log('Backup Complete!')
  console.log(`Location: ${backupDir}`)
  console.log('=================================')
}

main().catch(console.error)

