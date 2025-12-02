import { Suspense } from 'react'
import { SearchPageClient } from './SearchPageClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkDataAvailability() {
  try {
    const { count } = await supabase
      .from('opportunity_master')
      .select('*', { count: 'exact', head: true })
    
    return (count || 0) > 0
  } catch {
    return false
  }
}

export default async function SearchPage() {
  const hasData = await checkDataAvailability()
  
  return (
    <Suspense fallback={
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280'
      }}>
        Loading search...
      </div>
    }>
      <SearchPageClient initialHasData={hasData} />
    </Suspense>
  )
}
