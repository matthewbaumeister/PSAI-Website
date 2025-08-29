import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div 
      className="auth-page-isolated"
      style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        position: 'relative',
        isolation: 'isolate'
      }}
    >
      {/* Create a completely isolated container */}
      <div 
        className="auth-container"
        style={{
          position: 'relative',
          zIndex: 9999,
          backgroundColor: 'white',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem'
        }}
      >
        {/* Beautiful background with subtle patterns */}
        <div 
          className="auth-background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            zIndex: -1
          }}
        />
        
        {/* Subtle pattern overlay */}
        <div 
          className="auth-pattern"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
            `,
            zIndex: -1
          }}
        />
        
        <div 
          className="auth-content"
          style={{
            width: '100%',
            maxWidth: '28rem',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Beautiful header */}
          <div 
            className="auth-header"
            style={{
              textAlign: 'center',
              marginBottom: '2.5rem'
            }}
          >
            {/* Premium logo */}
            <div 
              className="auth-logo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
              }}
            >
              <span 
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'white'
                }}
              >
                PS
              </span>
            </div>
            
            {/* Company name */}
            <h1 
              className="auth-title"
              style={{
                fontSize: '2.25rem',
                fontWeight: '800',
                color: '#111827',
                marginBottom: '0.5rem',
                letterSpacing: '-0.025em'
              }}
            >
              Prop Shop AI
            </h1>
            
            {/* Tagline */}
            <p 
              className="auth-subtitle"
              style={{
                fontSize: '1.125rem',
                color: '#6b7280',
                fontWeight: '400'
              }}
            >
              The procurement intelligence platform
            </p>
          </div>
          
          {/* Render the auth pages */}
          {children}
        </div>
      </div>
    </div>
  )
}
