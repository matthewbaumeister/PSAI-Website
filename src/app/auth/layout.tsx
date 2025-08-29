import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: 'white',
        position: 'relative',
        zIndex: 1000
      }}
    >
      {/* Force white background with inline styles */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'white',
          zIndex: 1001
        }}
      ></div>
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
          zIndex: 1002
        }}
      ></div>
      
      <div 
        className="relative container mx-auto px-4 py-8"
        style={{ zIndex: 1003 }}
      >
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            {/* Clean logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg mb-4 shadow-sm">
              <span className="text-lg font-bold text-white">PS</span>
            </div>
            
            {/* Clean typography */}
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: '#111827' }}
            >
              Prop Shop AI
            </h1>
            <p 
              className="text-base"
              style={{ color: '#4b5563' }}
            >
              The procurement intelligence platform
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
