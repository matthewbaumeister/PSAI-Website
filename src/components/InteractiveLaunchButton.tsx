'use client'

interface InteractiveLaunchButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export default function InteractiveLaunchButton({ 
  href, 
  children,
  variant = 'primary'
}: InteractiveLaunchButtonProps) {
  const isPrimary = variant === 'primary'
  
  return (
    <a 
      href={href}
      className="btn btn-primary btn-lg"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: isPrimary 
          ? 'linear-gradient(135deg, #3b82f6, #6366f1)' 
          : 'rgba(139, 92, 246, 0.3)',
        border: 'none',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '8px',
        cursor: isPrimary ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s',
        textDecoration: 'none',
        color: isPrimary ? '#ffffff' : '#a78bfa',
        boxShadow: isPrimary 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          : 'none'
      }}
      onMouseEnter={(e) => {
        if (isPrimary) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (isPrimary) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }}
    >
      {children}
    </a>
  )
}

