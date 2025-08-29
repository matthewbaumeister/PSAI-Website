import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple, clean background - Updated for Scale AI style */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            {/* Clean logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg mb-4 shadow-sm">
              <span className="text-lg font-bold text-white">PS</span>
            </div>
            
            {/* Clean typography */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prop Shop AI
            </h1>
            <p className="text-gray-600 text-base">
              The procurement intelligence platform
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
