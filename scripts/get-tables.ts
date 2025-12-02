import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTables() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `
  } as any)
  
  if (error) {
    console.log('Using direct query instead...')
    // Try direct query
    const { data: tables, error: err2 } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
    
    if (err2) {
      console.error('Could not fetch tables:', err2)
      return
    }
    
    console.log('Tables in database:', tables)
  } else {
    console.log('Tables:', data)
  }
}

getTables()

