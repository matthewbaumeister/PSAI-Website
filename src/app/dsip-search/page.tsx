'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function DSIPSearchPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Redirect to Small Business DSIP Search (production location)
  useEffect(() => {
    if (!isLoading) {
      router.push('/small-business/dsip-search');
    }
  }, [isLoading, router]);
  
  // Show loading state while redirecting
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Redirecting to SBIR Database...</div>
      </div>
    </div>
  );
}
